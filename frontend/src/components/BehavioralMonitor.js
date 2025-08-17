import { useState, useEffect, useRef } from "react";
import {
  Typography,
  TextField,
  Stack,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Slider
} from "@mui/material";
import api from "../api/axiosInstance";

import useBehaviorMetrics from "../hooks/useBehaviorMetrics";

const BehavioralMonitor = ({ email, onProcess }) => {
  const [typingText, setTypingText] = useState("");
  const [status, setStatus] = useState("Authenticated");
  const { metrics, computeKeypressRate, computeCursorVariation ,resetMetrics } = useBehaviorMetrics(process.env.METRICS_THROTTLE_MS);
  const frequencyOfMetrics = process.env.FREQUENCY_OF_METRICS_MS || 10000;
  const metricsRef = useRef(metrics);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const isEmptyMetrics = (metrics) => {
    if (!metrics || Object.keys(metrics).length === 0) return true;

    return Object.values(metrics).every((arr) => {
      if (!Array.isArray(arr)) return true;
      if (arr.length === 0) return true;
      return arr.every((num) => !num);
    });
  };

  useEffect(() => {
    const computeInterval = setInterval(() => {
      computeKeypressRate();
      computeCursorVariation();
    }, 1000);

    const sendInterval = setInterval(async () => {
      try {
        const currentMetrics = metricsRef.current;

        if (isEmptyMetrics(currentMetrics)) {
          setStatus("Authenticated");
          onProcess({ confidence: 1.0, authenticated: true });
          resetMetrics();
          return;
        }

        let res = await api.post(`/authenticate`, {
          email,
          metrics: currentMetrics
        });
        
        if (!res.data.authenticated) {
          setStatus("Session Suspicious");
        } else {
          setStatus("Authenticated");
        }

        onProcess(res.data);
      } catch (err) {
        const err_data = { authenticated: false, confidence: 0 };
        setStatus("Error validating session");
        onProcess(err_data);        
      }
      resetMetrics();
    }, frequencyOfMetrics);

    return () => 
      {
        clearInterval(sendInterval);
        clearInterval(computeInterval);
      };
  }, []);

  return (
    <Stack spacing={3} sx={{ mt: 6, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {email.split("@")[0]}!
      </Typography>

      <TextField
        data-track-dwell
        label="Search"
        placeholder="Start typing..."
        value={typingText}
        onChange={(e) => {
          setTypingText(e.target.value);
        }}
        fullWidth
      />

      <FormControlLabel
        data-track-dwell
        control={<Switch />}
        label="Enable biometric auto-verification"
      />

      <Box>
        <Typography gutterBottom>Adjust Sensitivity</Typography>
        <Slider
          data-track-dwell
          id="simulation-slider"
          defaultValue={50}
          aria-label="Sensitivity"
        />
      </Box>

      <Box textAlign="center">
        <Typography gutterBottom>Click the button a few times:</Typography>
        <Button
          data-track-dwell
          id="simulation-button"
          variant="contained"
        >
          Simulate Action
        </Button>
      </Box>

      <Box>
        <Typography variant="body2" color="textSecondary" data-track-dwell>
          Status:{" "}
          {status === "Authenticated" ? (
            <span style={{ color: "green" }}>✅ Authenticated</span>
          ) : status === "Session Suspicious" ? (
            <span style={{ color: "orange" }}>⚠️ Suspicious Behavior</span>
          ) : (
            <span style={{ color: "red" }}>❌ Error</span>
          )}
        </Typography>
      </Box>
    </Stack>
  );
};

export default BehavioralMonitor;
