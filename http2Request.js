const http2 = require('http2');
const axios = require('axios');

const http2Request = (url, config = {}) => {
  // 创建HTTP/2代理
  const http2Agent = new http2.Agent({});

  // 配置axios实例
  const axiosInstance = axios.create({
    httpsAgent: http2Agent // 使用HTTP/2代理
    // 其他axios配置选项...
  });

  // 发送GET请求
  return axiosInstance.get(url, config);
};

module.exports = http2Request;
