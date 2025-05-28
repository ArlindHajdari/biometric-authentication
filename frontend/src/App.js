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
  Box
} from "@mui/material";

const PhaseFlow = () => {
  const [phase, setPhase] = useState("login");
  const [email, setEmail] = useState("");
  const [authResult, setAuthResult] = useState(null);

  const handleLoginSuccess = (userEmail) => {
    setEmail(userEmail);
    setPhase("otp");
  };

  const handleOtpSuccess = () => {
    setPhase("behavioral");
  };

  const handleBehavioralResponse = (data) => {
    if (data.authenticated) {
      setPhase("done");
    } else {
      setPhase("login");
      setEmail("");
    }
    setAuthResult(data);
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
