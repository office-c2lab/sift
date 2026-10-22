import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.');
}

const api = axios.create({
  baseURL,
});

export default api;
