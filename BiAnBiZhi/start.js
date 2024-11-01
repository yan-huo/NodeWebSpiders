const spiderUtil = require('./main');
const startConfig = [
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   totalPages: 212, // 页数
  //   page: 12,
  //   pages: 212, // 页数
  //   webUrl: 'http://www.netbian.com/fengjing/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 2,
  //   pages: 20, // 页数
  //   webUrl: 'http://www.netbian.com/qiche/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 1,
  //   pages: 50, // 页数
  //   webUrl: 'http://www.netbian.com/dongwu/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 1,
  //   pages: 48, // 页数
  //   webUrl: 'http://www.netbian.com/huahui/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 1,
  //   pages: 8, // 页数
  //   webUrl: 'http://www.netbian.com/jianzhu/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 1,
  //   pages: 8, // 页数
  //   webUrl: 'http://www.netbian.com/s/huyan/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // },
  // {
  //   isFile: false, // 是否是直接抓取文件
  //   filePath: './Download/BiAnBiZhi', // 存储目录
  //   page: 1,
  //   pages: 53, // 页数
  //   webUrl: 'http://www.netbian.com/youxi/', // 爬取页面基础路径
  //   fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  // }
  {
    isFile: false, // 是否是直接抓取文件
    filePath: './Download/BiAnBiZhi', // 存储目录
    page: 1,
    pages: 50, // 页数
    webUrl: 'http://www.netbian.com/weimei/', // 爬取页面基础路径
    fileUrl: 'http://www.netbian.com/down.php' // 爬取文件基础路径
  }
];
spiderUtil(startConfig);
