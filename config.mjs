// URL de l'API backend à utiliser
export const API_URL = location.hostname.includes("localhost")
  ? "http://localhost:8000"
  : "https://votre-backend-url.cluster-ig3.igpolytech.fr:8000";

// URL WebSocket à utiliser  
export const WS_URL = location.hostname.includes("localhost")
  ? "ws://localhost:8000"
  : "wss://votre-backend-url.cluster-ig3.igpolytech.fr:8000";
