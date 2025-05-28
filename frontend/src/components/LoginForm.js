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
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/login`, { 
        email, 
        password 
      });

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

      setError("Invalid email or password.");
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
          disabled={loading || !email || !password}
        >
          {loading ? <CircularProgress size={24} /> : "Login"}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </form>
  );
};

export default LoginForm;

