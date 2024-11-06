const qs = Qs;
const serviceInstance = axios.create({
  withCredentials: false, // send cookies when cross-domain requests
  timeout: 900000, // request timeout
  baseURL: 'http://localhost:3000/api'
});

serviceInstance.interceptors.request.use((config) => {
  // 让get支持用户配置data传参
  if (config.method === 'get') {
    // loadingInstance = ELEMENT.Loading.service({ fullscreen: true });
    config.params = config.data;
  }
  // post类型，如果是json
  if (config.method === 'post') {
    if (
      config.headers &&
      config.headers['Content-Type'] &&
      (config.headers['Content-Type'] === 'application/json' ||
        config.headers['Content-Type'] === 'multipart/form-data')
    ) {
      //do nothing
    } else {
      config.data = qs.stringify(config.data);
      config.headers['Content-Type'] =
        'application/x-www-form-urlencoded; charset=UTF-8';
    }
  }
  return config;
});

serviceInstance.interceptors.response.use(
  function (response) {
    if (
      response.config.responseType === 'arraybuffer' ||
      response.config.responseType === 'blob'
    ) {
      return response.data;
    }
    return response.data.data;
  },
  function (error) {
    return Promise.reject(error);
  }
);
const request = (options) => {
  return (params) => {
    options.data = params;
    return serviceInstance(options);
  };
};
