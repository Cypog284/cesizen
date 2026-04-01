import axios from 'axios';

// Pour un appareil physique, remplace par l'IP de ta machine : http://192.168.x.x:3000/api
// Pour le simulateur iOS : http://localhost:3000/api
// Pour l'émulateur Android : http://10.0.2.2:3000/api
export const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
