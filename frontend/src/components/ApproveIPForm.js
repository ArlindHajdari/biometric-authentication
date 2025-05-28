import { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Box
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const ApproveIPForm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing or invalid token.");
      return;
    }
    
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/approve-ip`, { token })
      .then(res => {
        setStatus("success");
        setMessage(res.data.message || "IP address trusted successfully.");
      })
      .catch(err => {
        setStatus("error");
        const msg = err?.response?.data?.error || "Failed to approve IP.";
        setMessage(msg);
      });
  }, [searchParams]);

  return (
    <Stack spacing={2} sx={{ mt: 6, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        IP Trust Approval
      </Typography>

      {status === "loading" && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {status === "success" && (
        <Alert severity="success">{message}</Alert>
      )}

      {status === "error" && (
        <Alert severity="error">{message}</Alert>
      )}
    </Stack>
  );
};

export default ApproveIPForm;
