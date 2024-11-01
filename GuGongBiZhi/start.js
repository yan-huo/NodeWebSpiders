const spiderUtil = require('./main');
const startConfig = [
  {
    isFile: false, // 是否是直接抓取文件
    filePath: './Download/GuGongBiZhi', // 存储目录
    webUrl: 'https://www.dpm.org.cn/lights/royal/p/1.html?', // 爬取页面基础路径
    fileUrl:
      'https://www.dpm.org.cn/download/lights_image/id/img_id/img_size/4.html' // 爬取文件基础路径
  }
];
spiderUtil(startConfig);
