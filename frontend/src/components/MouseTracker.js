import { useEffect, useRef } from "react";

const MouseTracker = ({ onMetrics, active = true }) => {
  const lastPos = useRef(null);
  const lastTime = useRef(null);
  const velocitySum = useRef(0);
  const moveCount = useRef(0);
  const clickCount = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!active) return;
      const now = performance.now();
      if (lastPos.current && lastTime.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        const dt = now - lastTime.current;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const velocity = dist / dt;
        velocitySum.current += velocity;
        moveCount.current++;
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = performance.now();
    };

    const handleClick = () => {
      if (active) clickCount.current++;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    const interval = setInterval(() => {
      if (moveCount.current > 0) {
        onMetrics({
          mouse_velocity: velocitySum.current / moveCount.current,
          click_frequency: clickCount.current / 5,
        });
      }
      velocitySum.current = 0;
      moveCount.current = 0;
      clickCount.current = 0;
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      clearInterval(interval);
    };
  }, [active, onMetrics]);

  return null;
};

export default MouseTracker;
