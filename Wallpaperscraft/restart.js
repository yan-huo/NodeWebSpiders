const spiderUtil = require('./main');
const _ = require('lodash');
var spiderData = require('./failFiles.json') || [];
spiderData = _.map(spiderData, function (item) {
  return {
    isFile: true, // 是否是直接抓取文件
    name: item.fileName,
    saveFilePath: './Download/Wallpaperscraft', // 存储目录
    fileUrl: 'https://images.wallpaperscraft.com/image/single/' // 爬取文件基础路径
  };
});
var logData = require('./log.json') || [];
logData = _.map(logData, function (item) {
  return {
    isFile: true, // 是否是直接抓取文件
    name: item,
    saveFilePath: './Download/Wallpaperscraft', // 存储目录
    fileUrl: 'https://images.wallpaperscraft.com/image/single/' // 爬取文件基础路径
  };
});
var filesData = spiderData.concat(logData);
spiderUtil(filesData);
