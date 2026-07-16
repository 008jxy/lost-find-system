// API基础地址，通过环境变量配置，默认为本地开发地址
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
