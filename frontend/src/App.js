import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import MFAForm from "./components/MFAForm";
import BehavioralMonitor from "./components/BehavioralMonitor";
import ApproveIPForm from "./components/ApproveIPForm";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button
} from "@mui/material";

const PhaseFlow = () => {
  const getInitialPhase = () => {
    const stored = localStorage.getItem("auth_phase");
    return stored || "login";
    };
  
  const updatePhase = (nextPhase) => {
    setPhase(nextPhase);
    localStorage.setItem("auth_phase", nextPhase);
  };

  const getInitialEmail = () => {
    return localStorage.getItem("user_email") || "";
  };

  const updateEmail = (local_email) => {
    setEmail(local_email);
    localStorage.setItem("user_email", local_email);
  };

  const getInitialAuthResult = () => {
    return JSON.parse(localStorage.getItem("auth_result")) || null;
  };

  const updateAuthResult = (auth_result) => {
    setAuthResult(auth_result);
    localStorage.setItem("auth_result", JSON.stringify(auth_result));
  };

  const [phase, setPhase] = useState(getInitialPhase());
  const [email, setEmail] = useState(getInitialEmail());
  const [authResult, setAuthResult] = useState(getInitialAuthResult());

  const handleLoginSuccess = (userEmail) => {
    updateEmail(userEmail);
    updatePhase("otp");
  };

  const handleOtpSuccess = () => {
    updatePhase("behavioral");
  };

  const handleBehavioralResponse = (data) => {
    if (data.authenticated) {
      updatePhase("done");
    } else {
      updatePhase("login");
      updateEmail("");
    }
    console.log(data);
    updateAuthResult(data);
  };

  const handleLogout = () => {
    updateEmail("");
    updateAuthResult(null);
    updatePhase("login");
  };

  return (
    <>
      {phase === "login" && <LoginForm onSuccess={handleLoginSuccess} />}
      {phase === "otp" && <MFAForm email={email} onValidate={handleOtpSuccess} />}
      {phase === "behavioral" && (
        <BehavioralMonitor email={email} onProcess={handleBehavioralResponse} />
      )}
      {phase === "done" && authResult && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h5" gutterBottom>
            Authentication Result
          </Typography>
          <Typography variant="body1">
            Status: {authResult.authenticated ? "✅ Authorized" : "❌ Denied"}
          </Typography>
          <Typography variant="body1">
            Confidence: {authResult.confidence}
          </Typography>

          <Box mt={4}>
            <Button variant="contained" color="primary" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Routes>
            <Route path="/" element={<PhaseFlow />} />
            <Route path="/approve-ip" element={<ApproveIPForm />} />
          </Routes>

          <Box mt={4}>
            <Typography
              variant="caption"
              color="textSecondary"
              align="center"
              display="block"
            >
              © 2025 BehavioralAuth Inc.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Router>
  );
};

export default App;
