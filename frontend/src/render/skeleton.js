/**
 * skeleton.js — G7. Port of docs/03_legacy.md D2 (`drawing.py:draw_skeleton`
 * + exercise_runner.py's colour-selection rule + its angle-text overlay).
 * JS/Canvas2D only — no CSS, no HTML, no DOM structure (draws into a
 * `<canvas>` 2D context the caller owns).
 *
 * Colour rule (verbatim, docs/03_legacy.md D2): the ENTIRE skeleton turns
 * red if ANY alert is active that frame, else green. There is no per-limb
 * colour logic in the legacy system — a per-limb highlight would be a new
 * feature, not a port, and is deliberately NOT done here.
 */

// Palette — BGR (OpenCV) source values converted to RGB per D2's instruction.
const C_BGR = {
  green: [0, 220, 100],
  red: [30, 60, 240],
  white: [240, 240, 240],
  shadow: [15, 15, 15],
};
const bgrToRgbCss = ([b, g, r]) => `rgb(${r}, ${g}, ${b})`;

export const COLOR = {
  green: bgrToRgbCss(C_BGR.green),
  red: bgrToRgbCss(C_BGR.red),
  white: bgrToRgbCss(C_BGR.white),
  shadow: bgrToRgbCss(C_BGR.shadow),
};

import { SKELETON_CONNECTIONS } from "../lib/landmarks.js";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object<string,[number,number]>} pts - name -> [x,y] pixel coords (worker's `pts` output)
 * @param {string[]} alerts - this frame's active alert strings
 * @param {Object<string,number>} [jointAngles] - display_name -> angle, for the optional text overlay
 * @param {Object<string,[number,number]>} [jointVertexPts] - display_name -> [x,y] vertex to draw the angle text at (caller supplies since joint_checks map display_name, not landmark name; see notes)
 */
export function drawSkeleton(ctx, pts, alerts, jointAngles, jointVertexPts) {
  const skelColor = alerts && alerts.length > 0 ? COLOR.red : COLOR.green;

  ctx.lineCap = "round";

  // Lines: shadow pass (5px), then colour pass (3px) — D2 exact order.
  for (const [a, b] of SKELETON_CONNECTIONS) {
    if (!(a in pts) || !(b in pts)) continue;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    ctx.strokeStyle = COLOR.shadow;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();

    ctx.strokeStyle = skelColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Joints: shadow disc (r7) -> colour disc (r6) -> white outline (r8, 1px stroke).
  for (const [x, y] of Object.values(pts)) {
    ctx.fillStyle = COLOR.shadow;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skelColor;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLOR.white;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Optional: live angle text at each checked joint's vertex, D2's
  // exercise_runner.py overlay (offset +10,-10, same colour as skeleton).
  if (jointAngles && jointVertexPts) {
    ctx.font = "12px monospace"; // FONT_HERSHEY_SIMPLEX ~0.5 scale approximation
    ctx.fillStyle = skelColor;
    for (const [name, angle] of Object.entries(jointAngles)) {
      const v = jointVertexPts[name];
      if (!v || angle == null) continue;
      ctx.fillText(String(Math.trunc(angle)), v[0] + 10, v[1] - 10);
    }
  }

  return skelColor;
}
