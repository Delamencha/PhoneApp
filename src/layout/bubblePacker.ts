/**
 * Bubble Packing Layout Engine
 *
 * Responsibilities:
 * 1. Compute each bubble's pixel radius from its willingness value
 * 2. Auto-scale all radii when total area exceeds screen capacity
 * 3. Place new bubbles in available positions (no overlap)
 * 4. Resolve collisions when bubbles are dragged
 * 5. Clamp all bubbles within screen bounds
 */

import { BubbleConfig } from '../theme';

// ─── Types ───

export interface BubbleInput {
  id: number;
  willingness: number; // 0~1
  posX: number;        // normalized 0~1
  posY: number;        // normalized 0~1
}

export interface BubbleOutput {
  id: number;
  radius: number;      // pixel radius after scaling
  screenX: number;     // pixel X (center of bubble)
  screenY: number;     // pixel Y (center of bubble)
}

export interface CanvasSize {
  width: number;
  height: number;
}

// ─── Radius Calculation ───

/** Get base radius (before auto-scale) from willingness.
 *  When canvasWidth is provided, willingness=1 maps to radius = canvasWidth/2 (fills the row). */
export function baseRadius(willingness: number, canvasWidth?: number): number {
  const w = Math.max(0, Math.min(1, willingness));
  const maxR = canvasWidth ? canvasWidth / 2 : BubbleConfig.maxRadius;
  return BubbleConfig.minRadius + w * (maxR - BubbleConfig.minRadius);
}

/** Compute global scale factor so all bubbles fit in canvas */
export function computeScaleFactor(
  bubbles: BubbleInput[],
  canvas: CanvasSize
): number {
  if (bubbles.length === 0) return 1;

  const totalArea = bubbles.reduce((sum, b) => {
    const r = baseRadius(b.willingness, canvas.width);
    return sum + Math.PI * r * r;
  }, 0);

  const availableArea = canvas.width * canvas.height;
  const targetArea = availableArea * BubbleConfig.packingDensity;

  if (totalArea <= targetArea) return 1;

  return Math.sqrt(targetArea / totalArea);
}

// ─── Layout Computation ───

/** Compute full layout for all bubbles */
export function computeLayout(
  bubbles: BubbleInput[],
  canvas: CanvasSize
): BubbleOutput[] {
  if (bubbles.length === 0) return [];

  const scale = computeScaleFactor(bubbles, canvas);

  // Convert normalized positions to screen coordinates
  let outputs: BubbleOutput[] = bubbles.map((b) => {
    const r = baseRadius(b.willingness, canvas.width) * scale;
    return {
      id: b.id,
      radius: r,
      screenX: b.posX * canvas.width,
      screenY: b.posY * canvas.height,
    };
  });

  // Clamp within bounds first
  outputs = outputs.map((o) => clampToBounds(o, canvas));

  // Resolve overlaps with iterative physics
  outputs = resolveAllCollisions(outputs, canvas, 80);

  return outputs;
}

/** Find a good position for a new bubble on the canvas */
export function findNewBubblePosition(
  existingBubbles: BubbleOutput[],
  newRadius: number,
  canvas: CanvasSize
): { posX: number; posY: number } {
  // Try center first
  const candidates: { x: number; y: number; score: number }[] = [];

  // Generate candidate positions in a grid
  const step = Math.max(20, newRadius);
  for (let y = newRadius; y <= canvas.height - newRadius; y += step) {
    for (let x = newRadius; x <= canvas.width - newRadius; x += step) {
      const minDist = getMinDistance(x, y, newRadius, existingBubbles);
      if (minDist >= 0) {
        // Score: prefer center of canvas
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const distToCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        candidates.push({ x, y, score: distToCenter });
      }
    }
  }

  if (candidates.length > 0) {
    // Pick position closest to center
    candidates.sort((a, b) => a.score - b.score);
    return {
      posX: candidates[0].x / canvas.width,
      posY: candidates[0].y / canvas.height,
    };
  }

  // Fallback: place at center (collisions will be resolved)
  return { posX: 0.5, posY: 0.5 };
}

// ─── Collision Resolution ───

/** Resolve all collisions iteratively */
function resolveAllCollisions(
  bubbles: BubbleOutput[],
  canvas: CanvasSize,
  maxIterations: number
): BubbleOutput[] {
  const result = bubbles.map((b) => ({ ...b }));

  for (let iter = 0; iter < maxIterations; iter++) {
    let hasOverlap = false;

    // Pairwise collision resolution
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = b.screenX - a.screenX;
        const dy = b.screenY - a.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius + 2; // 2px gap

        if (dist < minDist && dist > 0.001) {
          hasOverlap = true;
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          a.screenX -= nx * overlap;
          a.screenY -= ny * overlap;
          b.screenX += nx * overlap;
          b.screenY += ny * overlap;
        } else if (dist <= 0.001) {
          // Nearly same position: push apart randomly
          hasOverlap = true;
          const angle = Math.random() * Math.PI * 2;
          const push = (a.radius + b.radius) / 2 + 2;
          a.screenX -= Math.cos(angle) * push;
          a.screenY -= Math.sin(angle) * push;
          b.screenX += Math.cos(angle) * push;
          b.screenY += Math.sin(angle) * push;
        }
      }
    }

    // Clamp to bounds after each iteration
    for (let i = 0; i < result.length; i++) {
      const clamped = clampToBounds(result[i], canvas);
      result[i].screenX = clamped.screenX;
      result[i].screenY = clamped.screenY;
    }

    if (!hasOverlap) break;
  }

  return result;
}

/** Resolve collision for a single dragged bubble against all others */
export function resolveDragCollisions(
  draggedId: number,
  allBubbles: BubbleOutput[],
  canvas: CanvasSize
): BubbleOutput[] {
  const result = allBubbles.map((b) => ({ ...b }));

  for (let iter = 0; iter < 30; iter++) {
    let hasOverlap = false;
    const dragIdx = result.findIndex((b) => b.id === draggedId);
    if (dragIdx === -1) break;

    for (let j = 0; j < result.length; j++) {
      if (j === dragIdx) continue;

      const a = result[dragIdx];
      const b = result[j];
      const dx = b.screenX - a.screenX;
      const dy = b.screenY - a.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius + 2;

      if (dist < minDist && dist > 0.001) {
        hasOverlap = true;
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push only the non-dragged bubble away
        b.screenX += nx * overlap;
        b.screenY += ny * overlap;
      }
    }

    // Clamp all non-dragged bubbles
    for (let i = 0; i < result.length; i++) {
      if (i !== dragIdx) {
        const clamped = clampToBounds(result[i], canvas);
        result[i].screenX = clamped.screenX;
        result[i].screenY = clamped.screenY;
      }
    }

    if (!hasOverlap) break;
  }

  return result;
}

// ─── Helpers ───

function clampToBounds(bubble: BubbleOutput, canvas: CanvasSize): BubbleOutput {
  return {
    ...bubble,
    screenX: Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.screenX)),
    screenY: Math.max(bubble.radius, Math.min(canvas.height - bubble.radius, bubble.screenY)),
  };
}

/** Returns minimum gap distance (negative = overlap) from point to existing bubbles */
function getMinDistance(
  x: number,
  y: number,
  radius: number,
  bubbles: BubbleOutput[]
): number {
  let minGap = Infinity;
  for (const b of bubbles) {
    const dx = x - b.screenX;
    const dy = y - b.screenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const gap = dist - radius - b.radius - 2;
    minGap = Math.min(minGap, gap);
  }
  return minGap;
}

// ─── Time-based Color Interpolation ───

interface ColorStop {
  t: number;
  r: number;
  g: number;
  b: number;
}

const COLOR_STOPS: ColorStop[] = [
  { t: 0,    r: 255, g: 255, b: 255 }, // white - just created
  { t: 1/14, r: 255, g: 248, b: 225 }, // light yellow - ~1 day
  { t: 0.5,  r: 255, g: 152, b: 0   }, // orange - ~1 week
  { t: 1,    r: 244, g: 67,  b: 54  }, // red - 2 weeks
];

const TWO_WEEKS_HOURS = 14 * 24; // 336 hours

/**
 * Get bubble color based on time elapsed since creation.
 * @param createdAt ISO date string
 * @returns hex color string
 */
export function getBubbleColor(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedHours = (now - created) / (1000 * 60 * 60);
  const t = Math.max(0, Math.min(1, elapsedHours / TWO_WEEKS_HOURS));

  return interpolateColor(t);
}

function interpolateColor(t: number): string {
  // Find the two stops to interpolate between
  let lower = COLOR_STOPS[0];
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1];

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (t >= COLOR_STOPS[i].t && t <= COLOR_STOPS[i + 1].t) {
      lower = COLOR_STOPS[i];
      upper = COLOR_STOPS[i + 1];
      break;
    }
  }

  const range = upper.t - lower.t;
  const localT = range > 0 ? (t - lower.t) / range : 0;

  const r = Math.round(lower.r + (upper.r - lower.r) * localT);
  const g = Math.round(lower.g + (upper.g - lower.g) * localT);
  const b = Math.round(lower.b + (upper.b - lower.b) * localT);

  return `rgb(${r},${g},${b})`;
}

/**
 * Get elapsed time label.
 * <24h → "Xh", >=24h → "Xd"
 */
export function getElapsedLabel(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMs = now - created;
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));

  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}
