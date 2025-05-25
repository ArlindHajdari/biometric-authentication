import { useState } from "react";
import LoginForm from "./components/LoginForm";
import MFAForm from "./components/MFAForm";
import { Container, Paper, Typography, Box } from "@mui/material";
import { authenticateBehavior } from "./services/api";
import BehavioralMonitor from "./components/BehavioralMonitor";

const App = () => {
  const [phase, setPhase] = useState("login");
  const [email, setEmail] = useState("");
  const [metrics, setMetrics] = useState({});
  const [authResult, setAuthResult] = useState(null);

  const handleLoginSuccess = (userEmail) => {
    setEmail(userEmail);
    setPhase("otp");
  };

  const handleOtpSuccess = () => {
    setPhase("behavioral");
  };

 const handleReAuthFail = (data) => {
    setPhase("login");
    setEmail("");
    setAuthResult(data);
  };

  const handleReAuthSuccess = (data) => {
    setPhase("done");
    setAuthResult(data);
  };
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        {phase === "login" && (
          <LoginForm onSuccess={handleLoginSuccess} />
        )}

        {phase === "otp" && (
          <MFAForm email={email} onValidate={handleOtpSuccess} />
        )}

        {phase === "behavioral" && (
          <BehavioralMonitor email={email} onReAuthFail={handleReAuthFail} onReAuthSuccess={handleReAuthSuccess} />
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
  );
};

export default App;
