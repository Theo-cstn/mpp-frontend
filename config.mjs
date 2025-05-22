// config.mjs - Configuration dynamique pour production/développement

// Détection automatique de l'environnement
const isProduction = window.location.hostname.includes('igpolytech.fr');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configuration selon l'environnement
const CONFIG = {
  development: {
    API_URL: 'http://localhost:8000',
    WS_URL: 'ws://localhost:8000',
    FRONTEND_URL: 'http://localhost:3000'
  },
  production: {
    API_URL: 'https://mpp-backend.cluster-ig3.igpolytech.fr', 
    WS_URL: 'wss://mpp-backend.cluster-ig3.igpolytech.fr',
    FRONTEND_URL: 'https://mpp-frontend.cluster-ig3.igpolytech.fr'
  }
};

// Sélection de la configuration
const currentConfig = isProduction ? CONFIG.production : CONFIG.development;

// Export des URLs
export const API_URL = currentConfig.API_URL;
export const WS_URL = currentConfig.WS_URL;
export const FRONTEND_URL = currentConfig.FRONTEND_URL;

// Utilitaires
export const IS_PRODUCTION = isProduction;
export const IS_DEVELOPMENT = !isProduction;

// Configuration des requêtes
export const FETCH_CONFIG = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
};

// Configuration WebSocket
export const WS_CONFIG = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
};

// Debug en développement
if (IS_DEVELOPMENT) {
  console.log('🔧 Configuration Frontend:', {
    environment: isProduction ? 'production' : 'development',
    api: API_URL,
    ws: WS_URL,
    frontend: FRONTEND_URL
  });
}

// Fonction pour construire les URLs d'API
export function buildApiUrl(endpoint) {
  return `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

// Fonction pour construire les URLs WebSocket
export function buildWsUrl(endpoint = '/ws') {
  return `${WS_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}