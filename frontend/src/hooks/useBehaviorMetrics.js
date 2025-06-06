import { useRef, useState, useEffect } from "react";

const useBehaviorMetrics = () => {
  const lastKeyDown = useRef({});
  const [metrics, setMetrics] = useState({
    hold_time: [],
    flight_time: [],
    mouse_velocity: [],
    click_frequency: [],
    dwell_time: [],
    scroll_distance: [],
    keypress_rate: [],
    cursor_variation: [],
  });

  const lastMove = useRef({ x: 0, y: 0, time: 0 });
  const clickTimes = useRef([]);
  const keyTimestamps = useRef([]);
  const mouseTrail = useRef([]);
  const scrollStart = useRef(window.scrollY);
  const dwellTimers = useRef({});

  const trackKey = (e, type) => {
    const now = performance.now();
    const key = e.key;

    if (type === "down") {
      keyTimestamps.current.push(now);

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
      mouseTrail.current.push(velocity);
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

  const trackScroll = () => {
    const distance = Math.abs(window.scrollY - scrollStart.current);
    scrollStart.current = window.scrollY;

    setMetrics((prev) => ({
      ...prev,
      scroll_distance: [...prev.scroll_distance, distance],
    }));
  };

  const computeKeypressRate = () => {
    const now = performance.now();
    const cutoff = now - 5000;
    keyTimestamps.current = keyTimestamps.current.filter((t) => t >= cutoff);
    const rate = keyTimestamps.current.length / 5;

    setMetrics((prev) => ({
      ...prev,
      keypress_rate: [...prev.keypress_rate, rate],
    }));
  };

  const computeCursorVariation = () => {
    if (mouseTrail.current.length >= 2) {
      const mean =
        mouseTrail.current.reduce((a, b) => a + b, 0) / mouseTrail.current.length;
      const variance =
        mouseTrail.current.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        mouseTrail.current.length;

      setMetrics((prev) => ({
        ...prev,
        cursor_variation: [...prev.cursor_variation, variance],
      }));

      mouseTrail.current = [];
    }
  };

  const trackDwellStart = (id) => {
    dwellTimers.current[id] = performance.now();
  };

  const trackDwellEnd = (id) => {
    const start = dwellTimers.current[id];
    if (start) {
      const duration = performance.now() - start;
      setMetrics((prev) => ({
        ...prev,
        dwell_time: [...prev.dwell_time, duration],
      }));
      delete dwellTimers.current[id];
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => trackKey(e, "down");
    const handleKeyUp = (e) => trackKey(e, "up");
    const handleMouseMove = (e) => trackMouse(e);
    const handleClick = () => trackClick();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const attachDwellListeners = (el) => {
      if (!el.dataset.trackDwellAttached) {
        const id = el.dataset.trackDwell || el.id || Math.random().toString(36);
        el.dataset.trackDwellAttached = true;

        el.addEventListener("mouseenter", () => trackDwellStart(id));
        el.addEventListener("mouseleave", () => trackDwellEnd(id));
      }
    };

    const scanAll = () => {
      const elements = document.querySelectorAll("[data-track-dwell]");
      elements.forEach(attachDwellListeners);
    };

    const observer = new MutationObserver(scanAll);
    observer.observe(document.body, { childList: true, subtree: true });

    scanAll();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      observer.disconnect();
    };
  }, []);

  const resetMetrics = () => {
    setMetrics({
      hold_time: [],
      flight_time: [],
      mouse_velocity: [],
      click_frequency: [],
      dwell_time: [],
      scroll_distance: [],
      keypress_rate: [],
      cursor_variation: [],
    });
    keyTimestamps.current = [];
    mouseTrail.current = [];
  };

  return {
    metrics,
    trackKey,
    trackMouse,
    trackClick,
    trackDwellStart,
    trackDwellEnd,
    trackScroll,
    computeKeypressRate,
    computeCursorVariation,
    resetMetrics,
  };
};

export default useBehaviorMetrics;
