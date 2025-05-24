import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

export const authenticateBehavior = async (metrics) => {
  return await api.post('/authenticate', metrics);
};

export const verifyOTP = (email, otp, biometrics = {}) =>
  api.post("/verify-otp", { email, otp, ...biometrics });

