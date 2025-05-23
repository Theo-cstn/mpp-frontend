// config.mjs - Configuration finale pour production
export const API_URL = location.hostname.includes("localhost")
  ? "http://localhost:8000"
  : "https://mpp-backend.cluster-ig3.igpolytech.fr";  

export const WS_URL = location.hostname.includes("localhost")
  ? "ws://localhost:8000"
  : "wss://mpp-backend.cluster-ig3.igpolytech.fr";  

console.log("🔧 Configuration chargée:", { API_URL, WS_URL });