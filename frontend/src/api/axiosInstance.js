// src/api/axiosInstance.js
import axios from "axios";
import { getAccessToken, setAccessToken, clearTokens } from "../auth/tokenManager";
import { getCookie } from "../utils/cookies"; // read csrf_refresh_token cookie

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,   // Adjust to your Flask backend
  withCredentials: true                   // Needed for HttpOnly refresh cookie
});

// Flag to avoid multiple refresh attempts at once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor – attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request failed with 401 and hasn't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while token refreshes
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrf = getCookie("csrf_refresh_token");
        console.log("Refreshing token with CSRF:", csrf);
        const res = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/token/refresh`,
          {},
          { 
            withCredentials: true,
            headers: { "X-CSRF-TOKEN": csrf || "" }
          }
        );
        const newToken = res.data.access_token;
        setAccessToken(newToken);
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
