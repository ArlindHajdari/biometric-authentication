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
  Stack
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
  const [authenticated, setAuthentication] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(3);
  const countdownRef = useRef(null);

  const handleBehavioralVerification = (data) => {
    setAuthentication(data.authenticated);
    if (!authenticated && !showLogoutDialog) {
      setShowLogoutDialog(true);
      startLogoutCountdown();
    }
  };

  const startLogoutCountdown = () => {
    setLogoutCountdown(3);
    countdownRef.current = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
          setShowLogoutDialog(false);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <>
      {phase === "login" && <LoginForm onSuccess={onLoginSuccess} />}
      {phase === "otp" && <MFAForm email={email} onValidate={onOTPSuccess} />}
      {phase === "done" && (
        <Stack spacing={3}>
          <Typography variant="h5">Dashboard</Typography>

          <BehavioralMonitor
            email={email}
            onProcess={handleBehavioralVerification}
          />

          <Typography variant="body1">
            Welcome back! You are being continuously verified.
          </Typography>

          <Button variant="outlined" onClick={onLogout}>
            Logout
          </Button>
        </Stack>
      )}
      <Dialog open={showLogoutDialog}>
        <DialogTitle>Session Security Warning</DialogTitle>
        <DialogContent>
          <Typography>
            Low confidence detected. Logging out in {logoutCountdown} second{logoutCountdown !== 1 ? "s" : ""}.
          </Typography>
        </DialogContent>
      </Dialog>
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
    updatePhase("done");
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
  
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const countdownRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(countdownSeconds);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
          handleLogout();
          return 0;
        }
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
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimerRef.current);
      
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityDialog(true); 
      }, inactivityLimitMs);
    };

    const handleActivity = () => {
      if (!showInactivityDialog) resetInactivityTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    resetInactivityTimer();
    
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      
      clearTimeout(inactivityTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [phase, showInactivityDialog]);

  useEffect(() => {
    if (showInactivityDialog) {
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
