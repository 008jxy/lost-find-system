// API基础地址，通过环境变量配置，默认为线上部署地址
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://008jxy.pythonanywhere.com';

export default API_BASE_URL;
