const spiderUtil = require('./main');
const innerHtml = require('./failItem.json') || [];
const startConfig = [
  {
    isFile: false, // 是否是直接抓取文件
    filePath: './Download/Wallpaperscraft', // 存储目录
    currentPage: 410,
    page: 275,
    webUrl: 'https://wallpaperscraft.com/', // 爬取页面基础路径
    fileUrl: 'https://images.wallpaperscraft.com/image/single/' // 爬取文件基础路径
  }
];
if (innerHtml.length) {
  spiderUtil(innerHtml);
} else {
  spiderUtil(startConfig);
}
