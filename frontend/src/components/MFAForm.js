import {
  Button,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Box,
  TextField
} from "@mui/material";
import api from "../api/axiosInstance";
import { useEffect, useState, useRef } from "react";

const MFAForm = ({ email, onValidate }) => {
  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    
    const joinedOtp = otp.join("");
    try {
      const res = await api.post(`/verify_otp`, { email, otp: joinedOtp });
      if (res.data.verified) {
        onValidate();
      }
    } catch (err) {
      console.error(err);
    }

    setError("Failed to verify OTP.");
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (otp.every((d) => d !== "")) {
        handleVerify();
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [otp]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <Stack spacing={2} sx={{ mt: 6, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Enter OTP sent to <strong>{email}</strong>
      </Typography>

      <Box display="flex" justifyContent="space-between" gap={1} onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <TextField
            key={i}
            inputRef={(el) => (inputRefs.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            inputProps={{
              maxLength: 1,
              style: { textAlign: "center", fontSize: "1.5rem" },
            }}
            variant="outlined"
          />
        ))}
      </Box>

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={loading || otp.includes("")}
      >
        {loading ? <CircularProgress size={24} /> : "Verify OTP"}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
};

export default MFAForm;
