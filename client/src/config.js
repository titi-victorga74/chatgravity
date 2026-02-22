// API base URL configuration
// In development: uses the current hostname with port 3001
// In production: uses the VITE_API_URL environment variable
const hostname = window.location.hostname;
export const API_URL = import.meta.env.VITE_API_URL || `http://${hostname}:3001`;
