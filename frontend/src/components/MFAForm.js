import { useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Alert
} from "@mui/material";

const MFAForm = ({ email, onValidate }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/verify_otp`, { email, otp });
      onValidate();
    } catch (err) {
      if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
          console.log(err.response.data);
          console.log(err.response.status);
          console.log(err.response.headers);
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the 
            // browser and an instance of
            // http.ClientRequest in node.js
            console.log(err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', err.message);
        }
        console.log(err.config);
        setError("Failed to verify OTP.");
    }
    setLoading(false);
  };

  return (
    <Stack spacing={2} sx={{ mt: 6, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Enter OTP sent to <strong>{email}</strong>
      </Typography>

      <TextField
        label="One-Time Password"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        inputProps={{ maxLength: 6 }}
        required
      />

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
      >
        {loading ? <CircularProgress size={24} /> : "Verify OTP"}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
};

export default MFAForm;
