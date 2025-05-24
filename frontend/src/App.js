import { useState } from "react";
import LoginForm from "./components/LoginForm";
import MFAForm from "./components/MFAForm";
import KeyboardCapture from "./components/KeyboardCapture";
import MouseTracker from "./components/MouseTracker";
import { authenticateBehavior } from "./services/api";

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

  const handlePartialMetrics = (partial) => {
    setMetrics((prev) => ({ ...prev, ...partial }));
  };

  const handleBehavioralSubmit = async () => {
    try {
      const res = await authenticateBehavior(metrics);
      setAuthResult(res.data);
      setPhase("done");
    } catch {
      alert("Authentication failed.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Secure Behavioral Authentication</h1>
      {phase === "login" && <LoginForm onSuccess={handleLoginSuccess} />}
      {phase === "otp" && <MFAForm email={email} onValidate={handleOtpSuccess} />}
      {phase === "behavioral" && (
        <>
          <KeyboardCapture onMetrics={handlePartialMetrics} />
          <MouseTracker onMetrics={handlePartialMetrics} />
          <button onClick={handleBehavioralSubmit}>Submit Behavioral Data</button>
        </>
      )}
      {phase === "done" && authResult && (
        <>
          <h3>Authentication Result</h3>
          <p>Status: {authResult.authenticated ? "✅ Authorized" : "❌ Denied"}</p>
          <p>Confidence: {authResult.confidence}</p>
        </>
      )}
    </div>
  );
};

export default App;
