import { useState, useEffect } from "react";

const KeyboardCapture = ({ onMetrics, track = true, resetTrigger }) => {
  const [pressTime, setPressTime] = useState(null);
  const [lastRelease, setLastRelease] = useState(null);
  const [holdTimes, setHoldTimes] = useState([]);
  const [flightTimes, setFlightTimes] = useState([]);

  useEffect(() => {
    const handleKeyDown = () => {
      if (!track) return;
      setPressTime(performance.now());
    };
    const handleKeyUp = () => {
      if (!track) return;
      const release = performance.now();
      if (pressTime) {
        setHoldTimes((prev) => [...prev, release - pressTime]);
        if (lastRelease) {
          setFlightTimes((prev) => [...prev, pressTime - lastRelease]);
        }
        setLastRelease(release);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressTime, lastRelease, track]);

  useEffect(() => {
    if (resetTrigger) {
      setHoldTimes([]);
      setFlightTimes([]);
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (holdTimes.length >= 5 && flightTimes.length >= 4) {
      const avgHold = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
      const avgFlight = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length;
      onMetrics({
        hold_time: avgHold / 1000,
        flight_time: avgFlight / 1000,
      });
    }
  }, [holdTimes, flightTimes, onMetrics]);

  return null;
};

export default KeyboardCapture;
