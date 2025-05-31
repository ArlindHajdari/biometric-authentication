import { useState, useRef, useEffect } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const PhaseFlow = ({
  phase,
  email,
  authResult,
  onLogout,
  onLoginSuccess,
  onOTPSuccess,
  onBehavioralResponse
}) => {
  return (
    <>
      {phase === "login" && <LoginForm onSuccess={onLoginSuccess} />}
      {phase === "otp" && <MFAForm email={email} onValidate={onOTPSuccess} />}
      {phase === "behavioral" && (
        <BehavioralMonitor email={email} onProcess={onBehavioralResponse} />
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
            <Button variant="contained" color="primary" onClick={onLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

const App = () => {
  const getInitialEmail = () => {
    return localStorage.getItem("user_email") || "";
  };

  const getInitialPhase = () => {
    const stored = localStorage.getItem("auth_phase");
    return stored || "login";
    };

  const getInitialAuthResult = () => {
    return JSON.parse(localStorage.getItem("auth_result")) || null;
  };

  const [phase, setPhase] = useState(getInitialPhase());
  const [email, setEmail] = useState(getInitialEmail());
  const [authResult, setAuthResult] = useState(getInitialAuthResult());
  
  const updatePhase = (nextPhase) => {
    setPhase(nextPhase);
    localStorage.setItem("auth_phase", nextPhase);
  };

  const updateEmail = (local_email) => {
    setEmail(local_email);
    localStorage.setItem("user_email", local_email);
  };

  const updateAuthResult = (auth_result) => {
    setAuthResult(auth_result);
    localStorage.setItem("auth_result", JSON.stringify(auth_result));
  };

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

  const inactivityLimitMs = parseInt(process.env.REACT_APP_INACTIVITY_LIMIT_MS || "30000", 10);
  const countdownSeconds = parseInt(process.env.REACT_APP_COUNTDOWN_SECONDS || "10", 10);
  console.log("Inactivity limit:", inactivityLimitMs, "ms");
  console.log("Countdown seconds:", countdownSeconds);
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const countdownRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(countdownSeconds);
    countdownRef.current = setInterval(() => {
      console.log("Countdown tick:", countdown);
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
          console.log("Countdown finished, logging out");
          handleLogout();
          return 0;
        }
        console.log("Countdown decremented:", prev - 1);
        return prev - 1;
      });
    }, 1000);
  };


  const handleStay = () => {
    clearInterval(countdownRef.current);
    setShowInactivityDialog(false);
    setCountdown(countdownSeconds);
  };

  useEffect(() => {
    if (phase !== "done") {
      setShowInactivityDialog(false);
      clearInterval(countdownRef.current);
      clearTimeout(inactivityTimerRef.current);
      setCountdown(countdownSeconds);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    console.log("Setting up inactivity timer for phase:", phase);
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimerRef.current);
      console.log("Resetting inactivity timer");
      inactivityTimerRef.current = setTimeout(() => {
        console.log("Inactivity limit reached, showing dialog");
        setShowInactivityDialog(true);
        console.log("Inactivity dialog shown"); 
      }, inactivityLimitMs);

      console.log("Inactivity timer set for", inactivityLimitMs, "ms");
    };

    const handleActivity = () => {
      if (!showInactivityDialog) resetInactivityTimer();
      console.log("User activity detected, resetting inactivity timer");
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    resetInactivityTimer();
    console.log("Inactivity timer initialized");
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      console.log("Cleaning up inactivity timer");
      clearTimeout(inactivityTimerRef.current);
      clearInterval(countdownRef.current);
      console.log("Inactivity timer cleaned up");
    };
  }, [phase, showInactivityDialog]);

  useEffect(() => {
    if (showInactivityDialog) {
      setCountdown(countdownSeconds);
      startCountdown();
    }
  }, [showInactivityDialog]);

  return (
    <Router>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Routes>
            <Route path="/" element={<PhaseFlow
                                      phase={phase}
                                      email={email}
                                      authResult={authResult}
                                      setPhase={updatePhase}
                                      setEmail={updateEmail}
                                      setAuthResult={setAuthResult}
                                      onLogout={handleLogout}
                                      onLoginSuccess={handleLoginSuccess}
                                      onOTPSuccess={handleOtpSuccess}
                                      onBehavioralResponse={handleBehavioralResponse}
                                    />} />
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
          <Dialog open={showInactivityDialog}>
            <DialogTitle>Are you still there?</DialogTitle>
            <DialogContent>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: countdown <= 5 ? "error.main" : "text.primary",
                  transition: "color 0.3s ease"
                }}
              >
                You'll be logged out in {countdown} second{countdown !== 1 ? "s" : ""}.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleStay} variant="contained" color="primary">
                I'm still here
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Router>
    
  );
};

export default App;
