const spiderUtil = require('./main');
const startConfig = [
  {
    isFile: false, // 是否是直接抓取文件
    filePath: './Download/TodayBiYingBiZhi', // 存储目录
    webUrl: 'https://www.todaybing.com/web/api', // 爬取页面基础路径
    params: { append: 'list-home', paged: 2, action: 'ajax_load_posts' },
    fileUrl: 'https://bing.com/th' // 爬取文件基础路径
  }
];
spiderUtil(startConfig);
