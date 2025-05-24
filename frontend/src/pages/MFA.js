import { useState } from "react";
import { verifyOTP } from "../services/api";

const MFA = ({ email, onValidate }) => {
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    try {
      const res = await verifyOTP(email, otp);
      if (res.data.verified) {
        onValidate();
      } else {
        alert("Invalid OTP");
      }
    } catch {
      alert("Error verifying OTP");
    }
  };

  return (
    <div>
      <h4>Enter OTP sent to {email}</h4>
      <input
        type="text"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
};

export default MFA;
