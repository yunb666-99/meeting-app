import axios from 'axios';
import { message } from 'antd';
import { getToken, clearToken } from './token';

const api = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code && data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        clearToken();
        message.error('登录已过期，请重新登录');
        window.location.href = '/admin/login';
      } else if (status === 403) {
        message.error('没有权限执行此操作');
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试');
      } else {
        const msg = error.response.data?.message || '请求失败';
        message.error(msg);
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  },
);

export { getToken, setToken, clearToken } from './token';

export default api;
