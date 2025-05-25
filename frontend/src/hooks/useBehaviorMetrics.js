import { useRef, useState } from "react";

const useBehaviorMetrics = () => {
  const lastKeyDown = useRef({});
  const [metrics, setMetrics] = useState({
    hold_time: [],
    flight_time: [],
    mouse_velocity: [],
    click_frequency: [],
  });

  const lastMove = useRef({ x: 0, y: 0, time: 0 });

  const trackKey = (e, type) => {
    const now = performance.now();
    const key = e.key;

    if (type === "down") {
      if (lastKeyDown.current.lastUpTime) {
        const flight = now - lastKeyDown.current.lastUpTime;
        setMetrics((prev) => ({
          ...prev,
          flight_time: [...prev.flight_time, flight],
        }));
      }
      lastKeyDown.current[key] = now;
    }

    if (type === "up" && lastKeyDown.current[key]) {
      const hold = now - lastKeyDown.current[key];
      lastKeyDown.current.lastUpTime = now;
      setMetrics((prev) => ({
        ...prev,
        hold_time: [...prev.hold_time, hold],
      }));
    }
  };

  const trackMouse = (e) => {
    const now = performance.now();
    const dx = e.clientX - lastMove.current.x;
    const dy = e.clientY - lastMove.current.y;
    const dt = now - lastMove.current.time;
    if (dt > 0) {
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
      setMetrics((prev) => ({
        ...prev,
        mouse_velocity: [...prev.mouse_velocity, velocity],
      }));
    }
    lastMove.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const resetMetrics = () => {
    setMetrics({
      hold_time: [],
      flight_time: [],
      mouse_velocity: [],
      click_frequency: [],
    });
  };

  return { metrics, trackKey, trackMouse, resetMetrics };
};

export default useBehaviorMetrics;
