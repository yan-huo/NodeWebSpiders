const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

const failFile = [];

var stop = false;
var startDownload = false;
var downloadImgList = [];
var failHtml = '';
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
        './BiYingBiZhi/failFiles.json',
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
  var pageText = $('.page span').text();
  var pageTexts = pageText.split('/');
  var page = Number(pageTexts[0] || 0);
  pages = Number(pageTexts[1] || 0);
  var imgList = $('.container .item .progressive');
  for (var i = 0; i < imgList.length; i++) {
    var download = imgList.eq(i).find('.options a.download');
    if (download.length) {
      for (var j = 0; j < download.length; j++) {
        var fileUrl = download.eq(j).prop('href');
        var fileName = download.eq(j).prop('title');
        if (!fileName) {
          var photo = download.eq(j).prop('photo');
          fileName = `${photo}.jpg`;
        }
        if (fileUrl) {
          fileNum++;
          downloadImgList.push({
            fileName: fileName,
            fileUrl: fileUrl
          });
        }
      }
    }
  }
  console.log(`${page}/${pages}`);
  // return console.log(downloadImgList);
  if (page && pages && page < pages) {
    spiderHtml(`${config.webUrl}?p=${page + 1}`, config);
  }
  if (!startDownload && downloadImgList.length) {
    startDownload = true;
    startDownloadImg(config);
  }
}

function startDownloadImg(config, index) {
  if (index === 0) {
    console.log('开始下载，共' + downloadImgList.length + '个！');
  }
  var img = downloadImgList.shift();
  var fileUrl = img.fileUrl;
  var fileName = img.fileName;
  var saveFilePath = `${config.filePath}/${fileName}`;
  spiderFile(fileUrl, saveFilePath, {}).then(function () {
    if (downloadImgList.length) {
      console.log(`剩余${downloadImgList.length}个！`);
      writeFile(
        './BiYingBiZhi/log.json',
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
        './BiYingBiZhi/log.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
  });
}

function spiderHtml(webUrl, config) {
  axios
    .get(webUrl)
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
      var errorText = webUrl + 'html加载失败';
      console.log(errorText);
      console.log('\n');
    });
}

function spiderFile(fileUrl, saveFilePath, params) {
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
                './BiYingBiZhi/failFiles.json',
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
            './BiYingBiZhi/failFiles.json',
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
          './BiYingBiZhi/failFiles.json',
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
          webUrl = `${webUrl}?p=${item.page}`;
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
