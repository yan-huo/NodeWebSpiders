const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const superagent = require('superagent');
const _ = require('lodash');
require('superagent-charset')(superagent);

const failFile = [];
const failItem = [];

var coverFile = {};
var stop = false;
var totalImg = 0;
var pages = 0;
var fileNum = 0;
var spiderNum = 0;
var successNum = 0;
var downloadImgList = [];
var imgItemList = [];
var innerSpiderHtml = false;
var startDownload = false;
var failHtml = '';

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
        './Wallpaperscraft/failFiles.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
    if (failItem.length) {
      console.log('请重新下载失败图片后重新爬取二级页面！');
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
  var page = Number(
    $('.pager__list .pager__item_selected .pager__link').text()
  );
  pages = Number(
    $('.pager__list .pager__item_last-page .pager__link')
      .eq(0)
      .prop('href')
      .split('/all/page')[1]
  );
  var imgList = $('.wallpapers__list li a');
  for (var i = 0; i < imgList.length; i++) {
    var imgData = imgList.eq(i).prop('href') || '';
    if (imgData) {
      var name = imgData.split('/wallpaper/')[1];
      imgItemList.push({ name: name, imgData: imgData.slice(1) });
    }
  }
  console.log(`${page}/${pages}`);
  if (page && pages && page < 409) {
    spiderHtml(`${config.webUrl}all/page${page + 1}`, config)
      .then(function ($) {
        filterHtml($, config);
      })
      .catch(function () {});
  }
  // return console.log(imgItemList);
  if (!innerSpiderHtml && imgItemList.length) {
    innerSpiderHtml = true;
    startSpiderInnerHtml(config);
  }
}

function startSpiderInnerHtml(config) {
  var imgItem = imgItemList.shift();
  var webUrl = config.webUrl + imgItem.imgData;
  spiderHtml(webUrl)
    .then(function ($) {
      filterInnerHtml($, imgItem, config);
      if (imgItemList.length) {
        startSpiderInnerHtml(config);
      } else {
        // console.log(downloadImgList);
        if (config.innerHTML && !failItem.length) {
          writeFile(
            './Wallpaperscraft/failItem.json',
            JSON.stringify([], null, '\t'),
            function (flag) {}
          );
        }
        innerSpiderHtml = false;
        if (!downloadImgList.length) {
          finishComputed();
        }
      }
    })
    .catch(function () {
      failItem.push({
        innerHTML: true,
        webUrl: config.webUrl,
        filePath: config.filePath,
        fileUrl: config.fileUrl,
        name: imgItem.name,
        imgData: imgItem.imgData
      });
      saveFile(
        './Wallpaperscraft/failItem.json',
        JSON.stringify(failItem, null, '\t')
      );
      if (imgItemList.length) {
        startSpiderInnerHtml(config);
      } else {
        // console.log(downloadImgList);
        innerSpiderHtml = false;
        if (!downloadImgList.length) {
          finishComputed();
        }
      }
    });
}

function filterInnerHtml($, imgItem, config) {
  var imgSizesList = $(
    '.resolutions__section_torn .resolutions__table .resolutions__list .resolutions__link'
  );
  for (var i = 0; i < imgSizesList.length; i++) {
    var size = imgSizesList.eq(i).text();
    if (size && size == '3840x2160') {
      fileNum++;
      downloadImgList.push(`${imgItem.name}_${size}.jpg`);
      break;
    }
  }
  if (!startDownload && downloadImgList.length) {
    startDownload = true;
    startDownloadImg(config);
  }
}

function startDownloadImg(config) {
  var img = downloadImgList.shift();
  var fileUrl = `${config.fileUrl}${img}`;
  var saveFilePath = `${config.filePath}/${img}`;
  spiderFile(fileUrl, saveFilePath, {}).then(function () {
    if (downloadImgList.length) {
      console.log(`剩余${downloadImgList.length}个！`);
      writeFile(
        './Wallpaperscraft/log.json',
        JSON.stringify(downloadImgList, null, '\t'),
        function (flag) {}
      );
      setTimeout(function () {
        startDownloadImg(config);
      }, Math.floor(Math.random() * 1000));
    } else {
      startDownload = false;
      if (!imgItemList.length) {
        finishComputed();
      }
      writeFile(
        './Wallpaperscraft/log.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
  });
}

function spiderHtml(webUrl, config) {
  return new Promise(function (resolve, reject) {
    if (config) {
      writeFile(
        './Wallpaperscraft/interruptPage.txt',
        webUrl,
        function (flag) {}
      );
    }
    setTimeout(function () {
      axios
        .get(webUrl)
        .then(function (res) {
          /*
           * res.data是爬取的页面代码
           * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
           * */

          const $ = cheerio.load(res.data);
          resolve($);
        })
        .catch(function (err) {
          if (config) {
            failHtml = webUrl;
          }
          console.log(err);
          console.log('\n');
          console.log(JSON.stringify(err, null, '\t'));
          console.log('\n');
          var errorText = webUrl + '加载失败';
          console.log(errorText);
          console.log('\n');
          reject();
        });
    }, Math.floor(Math.random() * 1500));
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
                './Wallpaperscraft/failFiles.json',
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
            './Wallpaperscraft/failFiles.json',
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
          './Wallpaperscraft/failFiles.json',
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
      downloadImgList = _.map(spiderData, 'name');
      fileNum = downloadImgList.length;
      startDownloadImg(config, 0);
    } else if (spiderData[0].innerHTML) {
      imgItemList = spiderData;
      startSpiderInnerHtml(spiderData[0]);
    } else {
      spiderData.forEach((item) => {
        var webUrl = item.webUrl;
        if (item.page && item.page != 1) {
          webUrl = `${item.webUrl}all/page${item.page}`;
        }
        if (fs.existsSync(item.filePath)) {
          spiderHtml(webUrl, item)
            .then(function ($) {
              filterHtml($, item);
            })
            .catch(function () {});
        } else {
          createPath(item.filePath).then(function (value) {
            spiderHtml(webUrl, item)
              .then(function ($) {
                filterHtml($, item);
              })
              .catch(function () {});
          });
        }
      });
    }
  } else {
    console.log('未配置爬取数据！');
  }
};
