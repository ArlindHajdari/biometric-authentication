import { useState, useEffect } from "react";
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
import axios from "axios";

import useBehaviorMetrics from "../hooks/useBehaviorMetrics";

const BehavioralMonitor = ({ email, onProcess }) => {
  const [typingText, setTypingText] = useState("");
  const [status, setStatus] = useState("Authenticated");
  const { metrics, trackKey, trackMouse, trackClick, trackDwellStart, trackDwellEnd, trackScroll, computeKeypressRate, computeCursorVariation, resetMetrics } = useBehaviorMetrics();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const isEmpty =
          !metrics ||
          Object.keys(metrics).length === 0 ||
          Object.values(metrics).every((value) =>
            Array.isArray(value) ? value.length === 0 : !value
          );

        if (isEmpty) {
          setStatus("Authenticated");
          onProcess({ confidence: 1.0, authenticated: true }); 
          return;
        }

        let res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/authenticate`, {
          email,
          metrics
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
    }, 5_000);

    return () => clearInterval(interval);
  }, [metrics]);

  

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
          onMouseEnter={() => trackDwellStart("simulation-slider")}
          onMouseLeave={() => trackDwellEnd("simulation-slider")}
          defaultValue={50}
          aria-label="Sensitivity"
        />
      </Box>

      <Box textAlign="center">
        <Typography gutterBottom>Click the button a few times:</Typography>
        <Button
          data-track-dwell
          id="simulation-button"
          onMouseEnter={() => trackDwellStart("simulation-button")}
          onMouseLeave={() => trackDwellEnd("simulation-button")}
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
