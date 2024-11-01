const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const imgSizeList = [
  { size: '4000x2250', value: 13 },
  { size: '2560x1440', value: 12 },
  { size: '1920x1080', value: 4 },
  { size: '1680x1050', value: 3 },
  { size: '1280x800', value: 2 },
  { size: '2048x2048', value: 9 },
  { size: '2732x2732', value: 8 },
  { size: '800x600', value: 10 },
  { size: '1248x2778', value: 11 },
  { size: '1125x2436', value: 7 },
  { size: '1080x1920', value: 6 }
];

const failFile = [];

var coverFile = {};
var downloadImgList = [];
var failHtml = '';
var stop = false;
var startDownload = false;
var pages = 0;
var fileNum = 0;
var spiderNum = 0;
var successNum = 0;

function createPath(name) {
  return new Promise(function (resolve, reject) {
    if (stop) {
      reject(false);
    } else {
      fs.mkdir(name, { recursive: true }, function (err) {
        if (err) {
          stop = true;
          console.log(`create ${name} 目录 error`);
          reject(false);
        } else {
          resolve(true);
        }
      });
    }
  });
}

function typeOf(value) {
  var toString = Object.prototype.toString;
  var map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object'
  };
  return map[toString.call(value)];
}

function finishComputed() {
  var failNum = fileNum - successNum;
  setTimeout(function () {
    console.log(
      `\n共${fileNum}个图片，成功下载${successNum}个，失败${failNum}个。\n`
    );
    if (failNum) {
      console.log('请执行 node restart 命令重新下载失败图片！');
    } else {
      writeFile(
        './GuGongBiZhi/failFiles.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
    if (failHtml) {
      console.log(failHtml + ' 失败！');
    }
  }, 1000);
}

function writeFile(saveFilePath, value, callback) {
  try {
    fs.writeFileSync(saveFilePath, value);
    console.log(`70-writeFile ${saveFilePath} success`);
    return callback(true);
  } catch (e) {
    console.log(e);
    var errorText = `73-writeFile ${saveFilePath} error`;
    console.error(errorText);
    return callback(false);
  }
}

function saveFile(saveFilePath, value, fileUrl) {
  var savePaths = saveFilePath.split('/');
  var fileName = savePaths.pop();
  return new Promise(function (resolve, reject) {
    writeFile(saveFilePath, value, function (flag) {
      if (flag) {
        resolve(true);
      } else {
        if (fileUrl) {
          reject({
            isFile: true,
            fileUrl: fileUrl,
            fileName: fileName,
            saveFilePath: savePaths.join('/')
          });
        } else {
          reject();
        }
      }
    });
  });
}

function filterHtml($, config) {
  if (stop) {
    return;
  }
  var page = Number($('.pages .now').text());
  var pageList = $('.pages a');
  pages = Number(pageList.eq(pageList.length - 2).text());
  var imgList = $('.list .item');
  for (var i = 0; i < imgList.length; i++) {
    var a = imgList.eq(i).find('.pic a').eq(0);
    var imgData = a.prop('href') || '';
    var imgDatas = imgData.split('/light/');
    if (imgDatas[1]) {
      var sizeEl = imgList.eq(i).find('.mask .a3').eq(0);
      var size = 0;
      for (var j = 0; j < imgSizeList.length; j++) {
        if (sizeEl.prop(`litpic${imgSizeList[j].value}`)) {
          size = imgSizeList[j].value;
          break;
        }
      }
      var img = a.find(':first-child').eq(0);
      var fileUrl = config.fileUrl;
      if (size) {
        fileNum++;
        fileUrl = fileUrl
          .replace(/img_id/, imgDatas[1])
          .replace(/4/, String(size));
        downloadImgList.push({
          fileName: `${img.prop('alt').replace(/\t/g, '')}_${imgDatas[1]}.jpg`,
          fileUrl: fileUrl
        });
      }
    }
  }
  // return console.log(downloadImgList);
  console.log(`${page}/${pages}`);
  if (page && pages && page < pages) {
    spiderHtml(config.webUrl.replace(/1/, String(page + 1)), config);
  }
  if (!startDownload && downloadImgList.length) {
    startDownload = true;
    startDownloadImg(config);
  }
}

function startDownloadImg(config) {
  var img = downloadImgList.shift();
  var fileUrl = img.fileUrl;
  var fileName = img.fileName;
  var saveFilePath = `${config.filePath}/${fileName}`;
  spiderFile(fileUrl, saveFilePath, {}).then(function () {
    if (downloadImgList.length) {
      console.log(`剩余${downloadImgList.length}个！`);
      writeFile(
        './GuGongBiZhi/log.json',
        JSON.stringify(downloadImgList, null, '\t'),
        function (flag) {}
      );
      setTimeout(function () {
        startDownloadImg(config);
      }, Math.floor(Math.random() * 1000));
    } else {
      startDownload = false;
      finishComputed();
      writeFile(
        './GuGongBiZhi/log.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
  });
}

function spiderHtml(webUrl, config) {
  axios
    .get(webUrl + Math.random())
    .then(function (res) {
      /*
       * res.data是爬取的页面代码
       * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
       * */

      const $ = cheerio.load(res.data);
      filterHtml($, config);
    })
    .catch(function (error) {
      if (config) {
        failHtml = webUrl;
      }
      console.log(error);
      console.log('\n');
      console.log(JSON.stringify(error, null, '\t'));
      console.log('\n');
      var errorText = webUrl + '加载失败';
      console.log(errorText);
      console.log('\n');
    });
}

function spiderFile(fileUrl, saveFilePath, params) {
  params.type = undefined;
  return new Promise(function (resolve, reject) {
    var axiosOptions = { params: params, responseType: 'stream' };
    var savePaths = saveFilePath.split('/');
    var fileName = savePaths.pop().replace(/\t/g, '');
    axios
      .get(fileUrl, axiosOptions)
      .then(function (res) {
        try {
          if (res.data) {
            var ws = fs.createWriteStream(saveFilePath);
            ws.on('error', function (err) {
              var errorText = `writeFile ${saveFilePath} error, 流存储发生异常`;
              console.error(errorText);
              console.error(err);
              failFile.push({
                isFile: true,
                fileUrl: fileUrl,
                fileName: fileName,
                params: params,
                saveFilePath: savePaths.join('/')
              });
              saveFile(
                './GuGongBiZhi/failFiles.json',
                JSON.stringify(failFile, null, '\t')
              );
              spiderNum++;
              resolve();
            });
            ws.on('finish', function (fin) {
              successNum++;
              spiderNum++;
              console.log(`writeFile ${saveFilePath} success`);
              resolve();
            });
            res.data.pipe(ws);
          } else {
            spiderNum++;
            resolve();
          }
        } catch (e) {
          spiderNum++;
          console.log(e);
          var errorText = `writeFile ${saveFilePath} error`;
          console.error(errorText);
          failFile.push({
            isFile: true,
            fileUrl: fileUrl,
            fileName: fileName,
            params: params,
            saveFilePath: savePaths.join('/')
          });
          saveFile(
            './GuGongBiZhi/failFiles.json',
            JSON.stringify(failFile, null, '\t')
          );
          resolve();
        }
      })
      .catch(function (error) {
        spiderNum++;
        console.log(error);
        console.log(fileUrl);
        console.log('\n');
        console.log(JSON.stringify(error, null, '\t'));
        console.log('\n');
        var savePaths = saveFilePath.split('/');
        var fileName = savePaths.pop();
        var errorText = fileName + ' 文件爬取失败';
        failFile.push({
          isFile: true,
          fileUrl: fileUrl,
          fileName: fileName,
          params: params,
          saveFilePath: savePaths.join('/')
        });
        saveFile(
          './GuGongBiZhi/failFiles.json',
          JSON.stringify(failFile, null, '\t')
        );
        console.log(errorText);
        console.log('\n');
        resolve();
      });
  });
}

module.exports = function (spiderData) {
  if (spiderData[0]) {
    if (spiderData[0].isFile) {
      var config = {
        fileUrl: spiderData[0].fileUrl,
        filePath: spiderData[0].saveFilePath
      };
      downloadImgList = spiderData;
      fileNum = downloadImgList.length;
      startDownloadImg(config, 0);
    } else {
      spiderData.forEach((item) => {
        var webUrl = item.webUrl;
        if (item.page && item.page != 1) {
          webUrl = config.webUrl.replace(/1/, String(item.page));
        }
        if (fs.existsSync(item.filePath)) {
          spiderHtml(webUrl, item);
        } else {
          createPath(item.filePath).then(function (value) {
            spiderHtml(webUrl, item);
          });
        }
      });
    }
  } else {
    console.log('未配置爬取数据！');
  }
};
