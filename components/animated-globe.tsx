"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedGlobe – mobile‑first, Hi‑DPI canvas globe with hover / touch highlight.
 *
 * ▸ Fully responsive: canvas always fills its parent and accounts for device‑pixel‑ratio.
 * ▸ Dual‑axis rotation for a richer 3‑D feel.
 * ▸ Pointer / touch proximity highlight: dots + connecting lines bloom white when close.
 */

interface Point {
  x: number;
  y: number;
  z: number;
}

export default function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // -----------------------------------------------------------------------
    // Resize handling – keep canvas pixel‑perfect on all screens
    // -----------------------------------------------------------------------
    const dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      const parent = canvas.parentElement ?? document.body;
      const { width: cssW, height: cssH } = parent.getBoundingClientRect();

      // CSS size
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      // Actual pixel buffer size (Hi‑DPI aware)
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;

      // Reset transform then scale so 1 canvas pixel === 1 CSS px
      if ((ctx as any).resetTransform) {
        (ctx as any).resetTransform();
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // -----------------------------------------------------------------------
    // Build static point cloud on a unit sphere
    // -----------------------------------------------------------------------
    const NUM_POINTS = 1000;
    const points: Point[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const theta = Math.random() * Math.PI * 2; // longitude
      const phi = Math.acos(2 * Math.random() - 1); // latitude
      points.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
      });
    }

    // -----------------------------------------------------------------------
    // Animation + interaction state
    // -----------------------------------------------------------------------
    const rotation = { x: 0, y: 0 };
    const speed = { x: 0.0004, y: 0.0008 }; // radians per ms

    // Pointer tracking for highlight (works for mouse + touch)
    const pointer = { x: 0, y: 0, active: false };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerMove); // tap support
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerup", onPointerLeave);

    // -----------------------------------------------------------------------
    // Main render loop
    // -----------------------------------------------------------------------
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Advance rotation
      rotation.x += speed.x;
      rotation.y += speed.y;

      // Pre‑compute trig
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);

      // Canvas metrics (CSS pixels)
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const cx = cssW / 2;
      const cy = cssH / 2;
      const globeR = Math.min(cx, cy) * 0.9;

      ctx.clearRect(0, 0, cssW, cssH);

      // --- Draw particles ---------------------------------------------------
      for (const p of points) {
        // Rotate point
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        if (z2 <= 0) continue; // back hemisphere hidden

        const px = cx + x1 * globeR;
        const py = cy + y1 * globeR;
        const depth = z2; // 0 → rim, 1 → centre

        // Proximity highlight in 2‑D (projection space)
        const proximity = pointer.active
          ? Math.hypot(px - pointer.x, py - pointer.y)
          : Infinity;
        const isHot = proximity < 40;

        ctx.fillStyle = isHot
          ? `rgba(58,58,58,${0.9})`
          : `rgba(211,211,211, ${0.25 + depth * 0.75})`;
        ctx.beginPath();
        ctx.arc(px, py, 1 + depth * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Draw connective lines (limit 3 per point) ------------------------
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const x1 = p1.x * cosY - p1.z * sinY;
        const z1 = p1.x * sinY + p1.z * cosY;
        const y1 = p1.y * cosX - z1 * sinX;
        const zDepth1 = p1.y * sinX + z1 * cosX;
        if (zDepth1 <= 0) continue;

        const px1 = cx + x1 * globeR;
        const py1 = cy + y1 * globeR;

        let links = 0;
        for (let j = i + 1; j < points.length && links < 3; j++) {
          const p2 = points[j];
          const dx3 = p1.x - p2.x;
          const dy3 = p1.y - p2.y;
          const dz3 = p1.z - p2.z;
          const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3 + dz3 * dz3);
          if (dist3 > 0.28) continue; // skip if too far in 3‑D

          const x2 = p2.x * cosY - p2.z * sinY;
          const z2 = p2.x * sinY + p2.z * cosY;
          const y2 = p2.y * cosX - z2 * sinX;
          const zDepth2 = p2.y * sinX + z2 * cosX;
          if (zDepth2 <= 0) continue;

          links++;
          const px2 = cx + x2 * globeR;
          const py2 = cy + y2 * globeR;

          const opacity = (1 - dist3 / 0.28) * 0.18;

          // Highlight line if either endpoint is hot
          const hot =
            pointer.active &&
            (Math.hypot(px1 - pointer.x, py1 - pointer.y) < 40 ||
              Math.hypot(px2 - pointer.x, py2 - pointer.y) < 40);

          ctx.strokeStyle = hot
            ? `rgba(58,58,58,${opacity * 1.5})`
            : `rgba(121,121,121, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }
      }
    };

    animate();

    // -----------------------------------------------------------------------
    // Cleanup on unmount
    // -----------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerup", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full touch-none"
      aria-label="Interactive animated globe"
    />
  );
}
