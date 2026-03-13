import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('placement_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// Profile
export const createProfile = (data) => API.post('/profile/create', data);
export const getProfile = () => API.get('/profile/get');

// Analysis
export const runAnalysis = () => API.post('/analysis/score', {});
export const getAnalysisResult = () => API.get('/analysis/result');

// Resume
export const uploadResume = (file) => {
  const form = new FormData();
  form.append('resume', file);
  return API.post('/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Dashboard
export const getDashboardData = () => API.get('/dashboard/data');

// Roadmap
export const getRoadmap = () => API.get('/roadmap/generate');

// Speech (Whisper)
export const transcribeSpeech = (audioBlob, filename) => {
  const form = new FormData();
  form.append('audio_file', audioBlob, filename);
  return API.post('/speech/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export default API;
