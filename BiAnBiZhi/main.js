const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const superagent = require('superagent');
const _ = require('lodash');
require('superagent-charset')(superagent);

const failFile = [];

var coverFile = {};
var stop = false;
var totalImg = 0;
var pages = 0;
var fileNum = 0;
var spiderNum = 0;
var successNum = 0;
var downloadImgList = [];
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
        './BiAnBiZhi/failFiles.json',
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
  var page = Number($('.page b').text());
  pages = config.pages;
  var imgList = $('.list ul li a');
  for (var i = 0; i < imgList.length; i++) {
    var imgData = imgList.eq(i).prop('href') || '';
    var imgDatas = imgData.split('/desk/');
    if (imgDatas[1]) {
      var name = imgList.eq(i).find('b').eq(0).text();
      name = name.replace(/\\/g, '');
      var id = imgDatas[1].replace(/.htm/g, '');
      fileNum++;
      downloadImgList.push({
        id: id,
        name: `${name}_${id}`
      });
    }
  }
  console.log(`${page}/${pages}`);
  if (page && pages && page < pages) {
    spiderHtml(`${config.webUrl}index_${page + 1}.htm`, config);
  }
  // return console.log(totalImg);
  if (!startDownload && downloadImgList.length) {
    startDownload = true;
    startDownloadImg(config);
  }
}

function startDownloadImg(config) {
  var img = downloadImgList.shift();
  var fileUrl = config.fileUrl;
  var fileName = `${img.name}.jpg`;
  fileName = fileName.replace(/\|/g, '');
  fileName = fileName.replace(/《|》|:/g, '');
  var saveFilePath = `${config.filePath}/${fileName}`;
  spiderFile(fileUrl, saveFilePath, {
    id: img.id,
    type: undefined
  }).then(function () {
    if (downloadImgList.length) {
      console.log(`剩余${downloadImgList.length}个！`);
      startDownloadImg(config);
    } else {
      startDownload = false;
      finishComputed();
    }
  });
}

function spiderHtml(webUrl, config) {
  setTimeout(function () {
    superagent
      .get(webUrl)
      .set(
        'Cookie',
        `__yjs_duid=1_9e0a8409f6c2ff8613946a8291fbcfb61686811021757; Hm_lvt_0f461eb489c245a31c209d36e41fcc0f=1686811022,1687250247,1687307352; trenvecookieclassrecord=%2C4%2C19%2C1%2C28%2C18%2C12%2C10%2C5%2C11%2C3%2C17%2C8%2C6%2C9%2C13%2C22%2C23%2C; trenvecookieztrecord=%2C6%2C; trenvecookieinforecord=%2C4-31424%2C10-31428%2C; yjs_js_security_passport=2b671e30304313b23797f60005b2edb565a01ad5_1687311369_js; Hm_lpvt_0f461eb489c245a31c209d36e41fcc0f=${Math.floor(
          Date.now() / 1000
        )}`
      )
      .set('Connection', 'keep-alive')
      .set('Host', 'www.netbian.com')
      .set('Referer', 'http://www.netbian.com/')
      .set('Upgrade-Insecure-Requests', '1')
      .charset('gbk')
      .end(function (err, sres) {
        /*
         * res.data是爬取的页面代码
         * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
         * */
        if (err) {
          failHtml = webUrl;
          console.log(err);
          console.log('\n');
          console.log(JSON.stringify(err, null, '\t'));
          console.log('\n');
          var errorText = webUrl + '加载失败';
          console.log(errorText);
          console.log('\n');
          return;
        }
        var html = sres.text;
        var $ = cheerio.load(html, { decodeEntities: false });
        filterHtml($, config);
      });
  }, Math.floor(Math.random() * 1500));
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
                './BiAnBiZhi/failFiles.json',
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
            './BiAnBiZhi/failFiles.json',
            JSON.stringify(failFile, null, '\t')
          );
          resolve();
        }
      })
      .catch(function (error) {
        spiderNum++;
        console.log(error);
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
          './BiAnBiZhi/failFiles.json',
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
      downloadImgList = _.map(spiderData, function (item) {
        return {
          id: item.params.id,
          name: item.fileName.split('.')[0]
        };
      });
      fileNum = downloadImgList.length;
      startDownloadImg(config, 0);
    } else {
      spiderData.forEach((item) => {
        var webUrl = item.webUrl;
        if (item.page && item.page != 1) {
          webUrl = `${item.webUrl}index_${item.page}.htm`;
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
