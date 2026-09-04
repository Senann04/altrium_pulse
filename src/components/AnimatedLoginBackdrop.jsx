import { useEffect, useRef } from "react";

// React Bits-inspired ambient canvas, tuned to the Altrium black-and-gold system.
function AnimatedLoginBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let isVisible = !document.hidden;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const paintGlow = ({ x, y, radius, stretch = 1, rgb, alpha }) => {
      context.save();
      context.translate(x, y);
      context.scale(1, stretch);

      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
      gradient.addColorStop(0.42, `rgba(${rgb}, ${alpha * 0.46})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const draw = (timestamp = 0) => {
      const time = reducedMotion.matches ? 0 : timestamp * 0.00012;
      const shortestSide = Math.min(width, height);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";

      paintGlow({
        x: width * (0.24 + Math.sin(time * 1.15) * 0.08),
        y: height * (0.38 + Math.cos(time * 0.82) * 0.09),
        radius: Math.max(shortestSide * 0.74, 500),
        stretch: 0.76,
        rgb: "252, 180, 0",
        alpha: 0.17,
      });

      paintGlow({
        x: width * (0.78 + Math.cos(time * 0.7) * 0.07),
        y: height * (0.68 + Math.sin(time * 1.08) * 0.08),
        radius: Math.max(shortestSide * 0.68, 460),
        stretch: 0.84,
        rgb: "167, 105, 0",
        alpha: 0.11,
      });

      paintGlow({
        x: width * (0.52 + Math.sin(time * 0.55) * 0.14),
        y: height * (0.05 + Math.cos(time * 0.9) * 0.05),
        radius: Math.max(shortestSide * 0.52, 340),
        stretch: 0.62,
        rgb: "103, 211, 145",
        alpha: 0.045,
      });

      context.globalCompositeOperation = "source-over";

      if (!reducedMotion.matches && isVisible) {
        frameId = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && !reducedMotion.matches) {
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(draw);
      }
    };

    const handleMotionChange = () => {
      window.cancelAnimationFrame(frameId);
      draw(0);
    };

    resize();
    draw(0);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) draw(0);
    });
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-backdrop-canvas" aria-hidden="true" />;
}

export default AnimatedLoginBackdrop;
