import { useState } from "react";
import api from "../api/axiosInstance";
import {
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Alert
} from "@mui/material";
import { setAccessToken } from "../auth/tokenManager";

const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    setLoading(true);
    setError("");

    e.preventDefault();
    try {
      const res = await api.post(`/login`, { 
        email, 
        password 
      });
      setAccessToken(res.data.access_token);
      onSuccess(email);
    } catch (err) {
      if (err.response) {
          console.log(err.response.data);
          console.log(err.response.status);
          console.log(err.response.headers);
        } else if (err.request) {
            console.log(err.request);
        } else {
            console.log('Error', err.message);
        }
        console.log(err.config);

      setError(err.response.data?.error || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handlePaste = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleLogin}>
      <Stack spacing={2} sx={{ mt: 6, maxWidth: 400, mx: "auto" }} onPaste={handlePaste}>
        <Typography variant="h5" gutterBottom>
          Login to Your Account
        </Typography>

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus 
          required
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          variant="contained"
          type="submit"
          disabled={loading || (email.length < 6) || (password.length < 6)}
        >
          {loading ? <CircularProgress size={24} /> : "Login"}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </form>
  );
};

export default LoginForm;

