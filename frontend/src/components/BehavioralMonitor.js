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
import axios from "axios";

// Helper for biometric tracking
import useBehaviorMetrics from "../hooks/useBehaviorMetrics";

const BehavioralMonitor = ({ email, onProcess }) => {
  const [typingText, setTypingText] = useState("");
  const [status, setStatus] = useState("Authenticated");
  const { metrics, trackKey, trackMouse, trackClick, resetMetrics } = useBehaviorMetrics();

  const inputRef = useRef();

  // Re-authenticate every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        let res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/authenticate`, {
          email,
          metrics
        });
        console.log("Re-auth response:", res.data);
        
        if (!res.data.authenticated) {
          setStatus("Session Suspicious");
        } else {
          setStatus("Authenticated");
        }

        onProcess(res.data);
      } catch (err) {
        console.error("Re-auth error", err);
        setStatus("Error validating session");
      }
      resetMetrics();
    }, 10_000);

    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <Stack spacing={3} sx={{ mt: 6, maxWidth: 600, mx: "auto" }} onMouseMove={trackMouse} onClick={trackClick}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {email.split("@")[0]}!
      </Typography>

      <TextField
        label="Search"
        placeholder="Start typing..."
        inputRef={inputRef}
        value={typingText}
        onChange={(e) => {
          setTypingText(e.target.value);
        }}
        onKeyDown={(e) => trackKey(e, "down")}
        onKeyUp={(e) => trackKey(e, "up")}
        fullWidth
      />

      <FormControlLabel
        control={<Switch />}
        label="Enable biometric auto-verification"
      />

      <Box>
        <Typography gutterBottom>Adjust Sensitivity</Typography>
        <Slider
          defaultValue={50}
          aria-label="Sensitivity"
        />
      </Box>

      <Box textAlign="center">
        <Typography gutterBottom>Click the button a few times:</Typography>
        <Button
          variant="contained"
        >
          Simulate Action
        </Button>
      </Box>

      <Box>
        <Typography variant="body2" color="textSecondary">
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
