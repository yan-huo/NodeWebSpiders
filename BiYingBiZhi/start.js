const spiderUtil = require('./main');
const startConfig = [
  {
    isFile: false, // 是否是直接抓取文件
    page: 31,
    filePath: './Download/BiYingBiZhi', // 存储目录
    webUrl: 'https://bing.ioliu.cn/', // 爬取页面基础路径
    fileUrl: 'https://bing.com/th' // 爬取文件基础路径
  }
];
// spiderUtil(startConfig);
