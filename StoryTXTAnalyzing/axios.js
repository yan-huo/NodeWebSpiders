const axios = require('axios');

// 创建 Axios 实例
const instance = axios.create({
  baseURL: 'http://192.168.1.153:8888',
  headers: {
    'Content-Type': 'application/json'
  }
});

// POST 请求传递 JSON 数据
instance
  .post('/', {
    name: 'priority_task_play',
    sn: 'ls20://020288407F4C',
    type: 'req',
    params: {
      uid: '90c2ddf88edd4414bfd476361a8d6dd1',
      vol: 50,
      urls: [
        {
          name: '实时采集',
          uri: 'http://192.168.1.29:20006/tieta?DEVICE_ID=ls20://020288407F4C'
        }
      ],
      level: 0,
      name: '实时采集',
      count: 0,
      length: 86400,
      type: 0,
      tid: 'bba4e79b-369f-4f3f-89b4-dc70dfa45656'
    }
  })
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });
