import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001",
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    console.log("API Request:", {
      method: config.method.toUpperCase(),
      url: config.baseURL + config.url,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Response Error:", error.response || error);
    return Promise.reject(error);
  }
);

export default instance;
