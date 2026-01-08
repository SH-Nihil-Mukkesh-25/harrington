// API Base URL - reads from environment variable or falls back to localhost for dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

