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

  const clickTimes = useRef([]);

  const trackKey = (e, type) => {
    const now = performance.now();
    const key = e.key;
  
    if (type === "down") {
      if (lastKeyDown.current.lastUpTime) {
        const flight = (now - lastKeyDown.current.lastUpTime).toFixed(4);
        setMetrics((prev) => ({
          ...prev,
          flight_time: [...prev.flight_time, flight],
        }));
      }
      lastKeyDown.current[key] = now;
    }

    if (type === "up" && lastKeyDown.current[key]) {
      const hold = (now - lastKeyDown.current[key]).toFixed(4);
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
      const velocity = (Math.sqrt(dx * dx + dy * dy) / dt).toFixed(4);
      setMetrics((prev) => ({
        ...prev,
        mouse_velocity: [...prev.mouse_velocity, velocity],
      }));
    }
    lastMove.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const trackClick = () => {
    const now = performance.now();
    clickTimes.current.push(now);

    const cutoff = now - 5000;
    clickTimes.current = clickTimes.current.filter((t) => t >= cutoff);

    const clicksPerSecond = clickTimes.current.length / 5;

    setMetrics((prev) => ({
      ...prev,
      click_frequency: [...prev.click_frequency, clicksPerSecond],
    }));
  };

  const resetMetrics = () => {
    setMetrics({
      hold_time: [],
      flight_time: [],
      mouse_velocity: [],
      click_frequency: [],
    });
  };

  return { metrics, trackKey, trackMouse, trackClick, resetMetrics };
};

export default useBehaviorMetrics;
