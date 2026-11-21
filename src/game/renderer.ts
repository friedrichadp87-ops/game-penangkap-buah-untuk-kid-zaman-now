import {
  GROUND_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type FallingEntity,
  type WorldState,
} from './types';

export const BACKDROP_IMAGE_URL = '/src/assets/images/orchard_backdrop_1795254371551.jpg';

const INK = '#24170E';

export interface RenderTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function computeRenderTransform(
  canvasWidth: number,
  canvasHeight: number,
): RenderTransform {
  const scale = Math.min(canvasWidth / WORLD_WIDTH, canvasHeight / WORLD_HEIGHT);
  const offsetX = (canvasWidth - WORLD_WIDTH * scale) * 0.5;
  const offsetY = (canvasHeight - WORLD_HEIGHT * scale) * 0.5;
  return { scale, offsetX, offsetY, canvasWidth, canvasHeight };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: WorldState,
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Transform into logical world coordinates (1280x720) with decaying camera shake
  const tf = computeRenderTransform(canvasWidth, canvasHeight);
  const shakeMag = world.shakeTrauma * world.shakeTrauma * 14;
  const shakeX = shakeMag > 0.1 ? Math.sin(world.elapsed * 95) * shakeMag : 0;
  const shakeY = shakeMag > 0.1 ? Math.cos(world.elapsed * 112) * shakeMag * 0.7 : 0;

  ctx.translate(tf.offsetX + shakeX * tf.scale, tf.offsetY + shakeY * tf.scale);
  ctx.scale(tf.scale, tf.scale);

  // 1. Ambient drifting orchard leaves
  drawAmbientLeaves(ctx, world);

  // 2. Basket ground contact shadow (keeps basket grounded in the meadow)
  drawBasketShadow(ctx, world);

  // 3. Hazard telegraph sight lines & landing rings
  for (let i = 0; i < world.entities.length; i++) {
    const e = world.entities[i];
    if (e.state === 'active' && e.telegraphTimer > 0) {
      drawTelegraph(ctx, e);
    }
  }

  // 4. Woven rattan basket + diegetic gaze-routed dash bar
  drawBasket(ctx, world);

  // 5. Falling fruits & hazards
  const animTime = world.elapsed + world.titleTime;
  for (let i = 0; i < world.entities.length; i++) {
    drawEntity(ctx, world.entities[i], animTime);
  }

  // 6. Pooled particle bursts
  drawParticles(ctx, world);

  // 7. Pooled floating score / combo popups
  drawFloatingTexts(ctx, world);

  ctx.restore();

  // 8. Subtle peripheral crimson vignette when at 1 heart during active play
  if (world.phase === 'playing' && world.hearts === 1) {
    const pulse = 0.22 + Math.sin(world.elapsed * 5.2) * 0.06;
    ctx.save();
    ctx.strokeStyle = `rgba(185, 28, 28, ${pulse.toFixed(3)})`;
    ctx.lineWidth = 36;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}

function drawAmbientLeaves(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (let i = 0; i < world.ambientLeaves.length; i++) {
    const leaf = world.ambientLeaves[i];
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rotation);
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBasketShadow(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const b = world.basket;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 38, 18, 0.36)';
  ctx.beginPath();
  ctx.ellipse(b.x, GROUND_Y + 2, b.width * 0.46 * b.scaleX, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBasket(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const b = world.basket;

  // Diegetic Dash Readiness Bar directly beneath basket (gaze-routed)
  if (world.phase === 'playing' && b.dashCooldown > 0) {
    const progress = 1 - b.dashCooldown / 0.95;
    ctx.save();
    ctx.translate(b.x, GROUND_Y + 18);
    ctx.strokeStyle = 'rgba(36, 23, 14, 0.55)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(36, 0);
    ctx.stroke();

    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-36 + 72 * Math.max(0, Math.min(1, progress)), 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  if (b.invulnTimer > 0 && Math.floor(b.invulnTimer * 16) % 2 === 0 && b.hitFlashTimer <= 0) {
    ctx.globalAlpha = 0.55;
  }

  const bobY = Math.sin(b.stridePhase) * 2.5;
  ctx.translate(b.x, b.y + bobY);
  ctx.rotate(b.tilt);
  ctx.scale(b.scaleX, b.scaleY);

  // Warm golden catch aura
  if (b.catchGlowTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.55, b.catchGlowTimer * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(0, -4, b.width * 0.56, b.height * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const hw = b.width * 0.5;
  const hh = b.height * 0.5;
  const isHit = b.hitFlashTimer > 0;

  // Back interior rim shadow
  ctx.fillStyle = isHit ? '#FFFFFF' : '#5C3A21';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, -hh + 10, hw - 4, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Main trapezoidal woven rattan basket body (crisp cel-shaded fills, zero clip overhead)
  ctx.fillStyle = isHit ? '#FFFFFF' : '#CC883B';
  ctx.beginPath();
  ctx.moveTo(-hw + 2, -hh + 10);
  ctx.quadraticCurveTo(-hw + 10, hh + 4, -hw + 24, hh);
  ctx.lineTo(hw - 24, hh);
  ctx.quadraticCurveTo(hw - 10, hh + 4, hw - 2, -hh + 10);
  ctx.closePath();
  ctx.fill();

  if (!isHit) {
    // Sunlit left shoulder highlight
    ctx.fillStyle = 'rgba(253, 230, 168, 0.32)';
    ctx.beginPath();
    ctx.moveTo(-hw + 4, -hh + 14);
    ctx.lineTo(-hw + 36, -hh + 14);
    ctx.lineTo(-hw + 42, hh - 3);
    ctx.lineTo(-hw + 24, hh - 1);
    ctx.quadraticCurveTo(-hw + 11, hh + 2, -hw + 4, -hh + 14);
    ctx.closePath();
    ctx.fill();

    // Woven rattan bands
    ctx.strokeStyle = 'rgba(92, 52, 18, 0.45)';
    ctx.lineWidth = 2.6;
    const rows = [-6, 8, 21];
    const inset = [6, 13, 20];
    for (let r = 0; r < rows.length; r++) {
      ctx.beginPath();
      ctx.moveTo(-hw + inset[r], rows[r]);
      ctx.quadraticCurveTo(0, rows[r] + 5, hw - inset[r], rows[r]);
      ctx.stroke();
    }
    const ribs = [-38, -19, 0, 19, 38];
    for (let k = 0; k < ribs.length; k++) {
      const rx = ribs[k];
      ctx.beginPath();
      ctx.moveTo(rx, -hh + 16);
      ctx.lineTo(rx * 0.78, hh - 2);
      ctx.stroke();
    }
  }

  // Crisp outer ink outline on body
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-hw + 2, -hh + 10);
  ctx.quadraticCurveTo(-hw + 10, hh + 4, -hw + 24, hh);
  ctx.lineTo(hw - 24, hh);
  ctx.quadraticCurveTo(hw - 10, hh + 4, hw - 2, -hh + 10);
  ctx.closePath();
  ctx.stroke();

  // Rolled braided bamboo rim
  ctx.fillStyle = isHit ? '#FFFFFF' : '#F2C16B';
  ctx.beginPath();
  ctx.roundRect(-hw - 4, -hh + 3, b.width + 8, 15, 8);
  ctx.fill();
  ctx.stroke();

  // Side bamboo handles
  ctx.beginPath();
  ctx.arc(-hw - 2, -hh + 14, 8, Math.PI * 0.55, Math.PI * 1.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hw + 2, -hh + 14, 8, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  ctx.restore();
}

function drawTelegraph(ctx: CanvasRenderingContext2D, e: FallingEntity): void {
  const ratio = 1 - e.telegraphTimer / Math.max(0.01, e.telegraphDuration);
  const pulse = 0.55 + Math.sin(ratio * Math.PI * 8) * 0.35;

  ctx.save();
  if (e.kind === 'coconut') {
    ctx.strokeStyle = `rgba(220, 38, 38, ${(0.35 + pulse * 0.35).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + 24);
    ctx.lineTo(e.x, GROUND_Y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(220, 38, 38, ${(0.2 + ratio * 0.22).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(e.x, GROUND_Y, 34 * (1.15 - ratio * 0.25), 9, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'spiky') {
    ctx.strokeStyle = `rgba(234, 88, 12, ${(0.38 + pulse * 0.35).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.vx * 0.85, e.y + e.vy * 0.85);
    ctx.stroke();
  } else if (e.kind === 'wasp') {
    ctx.strokeStyle = `rgba(239, 68, 68, ${(0.45 + pulse * 0.4).toFixed(2)})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 34 + (1 - ratio) * 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#DC2626';
  ctx.strokeStyle = '#FFF8E7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(e.x, e.y - 42, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', e.x, e.y - 41);

  ctx.restore();
}

function drawEntity(ctx: CanvasRenderingContext2D, e: FallingEntity, time: number): void {
  ctx.save();

  let jitterX = 0;
  let jitterY = 0;
  if (e.telegraphTimer > 0) {
    jitterX = Math.sin(time * 55) * 4.5;
    jitterY = Math.cos(time * 48) * 2.5;
  }

  ctx.translate(e.x + jitterX, e.y + jitterY);
  ctx.rotate(e.rotation);

  if (e.state === 'caught') {
    const t = e.stateTimer / 0.32;
    const s = 1 + t * 0.45;
    ctx.scale(s, s);
    ctx.globalAlpha = Math.max(0, 1 - t);
  } else if (e.state === 'ko') {
    const t = e.stateTimer / 0.32;
    ctx.globalAlpha = Math.max(0, 1 - t);
  }

  switch (e.kind) {
    case 'mango':
      drawMango(ctx);
      break;
    case 'guava':
      drawGuava(ctx);
      break;
    case 'starfruit':
      drawStarfruit(ctx, time);
      break;
    case 'coconut':
      drawCoconut(ctx);
      break;
    case 'wasp':
      drawWasp(ctx, time);
      break;
    case 'spiky':
      drawSpiky(ctx);
      break;
  }

  ctx.restore();
}

function drawMango(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.bezierCurveTo(22, -22, 26, 6, 12, 22);
  ctx.bezierCurveTo(2, 30, -14, 24, -19, 8);
  ctx.bezierCurveTo(-24, -8, -14, -24, 0, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Warm ripe blush & highlight
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.ellipse(-6, -6, 6.5, 11, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.beginPath();
  ctx.ellipse(-9, -9, 3, 6, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Crisp green leaf
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.ellipse(9, -24, 11, 5, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawGuava(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#E11D48';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(14, -20, 22, 2, 18, 16);
  ctx.bezierCurveTo(14, 25, -14, 25, -18, 16);
  ctx.bezierCurveTo(-22, 2, -14, -20, 0, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FB7185';
  ctx.beginPath();
  ctx.ellipse(-6, -2, 5.5, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.beginPath();
  ctx.ellipse(-8, -5, 2.5, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4ADE80';
  ctx.beginPath();
  ctx.ellipse(-6, -23, 8, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawStarfruit(ctx: CanvasRenderingContext2D, time: number): void {
  const pulse = 1 + Math.sin(time * 9) * 0.08;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 27 : 13;
    const angle = (i * Math.PI) / spikes - Math.PI * 0.5;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.arc(-4, -4, 5.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoconut(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4A2B18';
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle top highlight
  ctx.fillStyle = '#784A2A';
  ctx.beginPath();
  ctx.ellipse(-7, -11, 8, 4.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Three coconut eyes
  ctx.fillStyle = '#1A0D06';
  ctx.beginPath();
  ctx.arc(-7, -3, 4.2, 0, Math.PI * 2);
  ctx.arc(7, -3, 4.2, 0, Math.PI * 2);
  ctx.arc(0, 8, 4.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawWasp(ctx: CanvasRenderingContext2D, time: number): void {
  const wingFlap = Math.sin(time * 42) * 0.35;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;

  ctx.save();
  ctx.translate(-8, -10);
  ctx.rotate(-0.5 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(0, -7, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(8, -10);
  ctx.rotate(0.5 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(0, -7, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Striped yellow-black body (drawn cleanly without ctx.clip)
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#1E1B18';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-5, -11);
  ctx.lineTo(-5, 15);
  ctx.moveTo(6, -11);
  ctx.lineTo(6, 15);
  ctx.stroke();

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(-11, 1, 3.5, 0, Math.PI * 2);
  ctx.arc(11, 1, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-4, 17);
  ctx.lineTo(4, 17);
  ctx.lineTo(0, 25);
  ctx.closePath();
  ctx.fill();
}

function drawSpiky(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4C1D3D';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  const spikes = 10;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 28 : 17;
    const angle = (i * Math.PI) / spikes;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (let i = 0; i < world.particles.length; i++) {
    const p = world.particles[i];
    if (!p.active) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === 'leaf') {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'star') {
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const r = s % 2 === 0 ? p.size * 1.35 : p.size * 0.55;
        const a = (s * Math.PI) / 4;
        if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (let i = 0; i < world.floatingTexts.length; i++) {
    const ft = world.floatingTexts[i];
    if (!ft.active) continue;
    const progress = ft.life / ft.maxLife;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(ft.x, ft.y);
    ctx.scale(ft.scale, ft.scale);
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#24170E';
    ctx.fillText(ft.text, 0, 2);
    ctx.fillStyle = '#FFFDF5';
    ctx.fillText(ft.text, 0, -1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();
  }
}
