import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/refresh`, { token: refreshToken });
        
        if (res.status === 200) {
          localStorage.setItem("token", res.data.accessToken);
          API.defaults.headers.common["Authorization"] = `Bearer ${res.data.accessToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default API;