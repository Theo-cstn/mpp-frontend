// config.mjs - Configuration finale pour production
export const API_URL = location.hostname.includes("localhost")
  ? "http://localhost:8000"
  : "http://mpp-backend.cluster-ig3.igpolytech.fr:8000";

export const WS_URL = location.hostname.includes("localhost")
  ? "ws://localhost:8000"
  : "ws://mpp-backend.cluster-ig3.igpolytech.fr:8000";

console.log("🔧 Configuration chargée:", { API_URL, WS_URL });