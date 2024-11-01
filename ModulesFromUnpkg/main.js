const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

const errorData = [];

const failFile = [];

const coverFile = {};
var cover = false;
var stop = false;

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
      '\n共 ' +
        fileNum +
        '个文件，成功下载 ' +
        successNum +
        '个，失败 ' +
        failNum +
        '个。\n'
    );
    if (failNum) {
      console.log('请执行 node restart 命令重新下载失败文件！');
    } else {
      writeFile(
        './ModulesFromUnpkg/failFiles.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
    }
  }, 1000);
}

function writeFile(saveFilePath, value, callback) {
  try {
    fs.writeFileSync(saveFilePath, value);
    console.log(`writeFile ${saveFilePath} success`);
    callback(true);
  } catch (e) {
    var errorText = `writeFile ${saveFilePath} error`;
    errorData.push(errorText);
    console.error(errorText);
    callback(false);
  }
}

function saveFile(saveFilePath, value, fileUrl) {
  var savePaths = saveFilePath.split('/');
  var fileName = savePaths.pop();
  return new Promise(function (resolve, reject) {
    if (!cover) {
      // 文件不覆盖
      fs.access(saveFilePath, fs.constants.F_OK, function (err) {
        if (err) {
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
        } else {
          if (!coverFile[saveFilePath]) {
            coverFile[saveFilePath] = 1;
          }
          var savePaths = saveFilePath.split('/');
          var fileName = savePaths.pop();
          var fileNames = fileName.split('.');
          fileNames[0] += coverFile[saveFilePath];
          fileName = fileNames.join('.');
          coverFile[saveFilePath]++;
          writeFile(
            `${savePaths.join('/')}/${fileName}`,
            value,
            function (flag) {
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
            }
          );
        }
      });
    } else {
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
    }
  });
}

function filterHtml($, parentUrl, config) {
  if (stop) {
    return;
  }

  var aList = $('table.css-19oireb a');
  var hrefList = [];
  for (var i = 0; i < aList.length; i++) {
    hrefList.push(aList.eq(i).prop('href'));
  }
  hrefList = hrefList.filter((item) => item != '../');
  for (var i = 0; i < hrefList.length; i++) {
    if (stop) {
      return;
    }
    if (hrefList[i].indexOf('/') >= 0) {
      spiderHtml(
        config.webUrl + parentUrl + hrefList[i],
        parentUrl + hrefList[i],
        config
      );
    } else {
      var fileUrl = config.fileUrl + parentUrl + hrefList[i];
      var fileName =
        hrefList[i].indexOf('.') >= 0 ? hrefList[i] : `${hrefList[i]}.txt`;
      var saveFilePath = `${config.filePath}/${parentUrl}${fileName}`;
      spiderFile(fileUrl, saveFilePath);
    }
  }
}

function spiderHtml(webUrl, parentUrl, config) {
  axios
    .get(webUrl)
    .then(function (res) {
      /*
       * res.data是爬取的页面代码
       * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
       * */

      const $ = cheerio.load(res.data);
      if (parentUrl) {
        createPath(`${config.filePath}/${parentUrl}`).then(function (value) {
          filterHtml($, parentUrl, config);
        });
      } else {
        filterHtml($, parentUrl, config);
      }
    })
    .catch(function (error) {
      console.log('\n');
      console.log(JSON.stringify(error, null, '\t'));
      console.log('\n');
      var errorText = webUrl + 'html加载失败';
      errorData.push(errorText);
      console.log(errorText);
      console.log('\n');
    });
}

function spiderFile(fileUrl, saveFilePath, responseType) {
  var axiosOptions = {};
  if (responseType) {
    axiosOptions.responseType = responseType;
  }
  var savePaths = saveFilePath.split('/');
  var fileName = savePaths.pop();
  fileNum++;
  axios
    .get(fileUrl, axiosOptions)
    .then(function (res) {
      if (responseType !== 'stream') {
        var value = res.data;
        if (typeOf(value) !== 'string') {
          value = JSON.stringify(value, null, '\t');
        }
        saveFile(saveFilePath, value, fileUrl)
          .then(function () {
            successNum++;
            spiderNum++;
            if (spiderNum === fileNum) {
              finishComputed();
            }
          })
          .catch(function (errorData) {
            spiderNum++;
            if (spiderNum === fileNum) {
              finishComputed();
            }
            if (errorData) {
              failFile.push(errorData);
              saveFile(
                './ModulesFromUnpkg/failFiles.json',
                JSON.stringify(failFile, null, '\t')
              );
            }
          });
      } else {
        spiderNum++;
        if (spiderNum === fileNum) {
          finishComputed();
        }
        try {
          let ws = fs.createWriteStream(saveFilePath);
          ws.on('error', function (err) {
            var errorText = `writeFile ${saveFilePath} error, 流存储发生异常`;
            errorData.push(errorText);
            console.error(errorText);
            failFile.push({
              isFile: true,
              fileUrl: fileUrl,
              fileName: fileName,
              saveFilePath: savePaths.join('/')
            });
            saveFile(
              './ModulesFromUnpkg/failFiles.json',
              JSON.stringify(failFile, null, '\t')
            );
          });
          ws.on('finish', function (fin) {
            console.log(`writeFile ${saveFilePath} success`);
          });
          res.data.pipe(ws);
        } catch (e) {
          console.log(e);
          var errorText = `writeFile ${saveFilePath} error`;
          errorData.push(errorText);
          console.error(errorText);
          failFile.push({
            isFile: true,
            fileUrl: fileUrl,
            fileName: fileName,
            saveFilePath: savePaths.join('/')
          });
          saveFile(
            './ModulesFromUnpkg/failFiles.json',
            JSON.stringify(failFile, null, '\t')
          );
        }
      }
    })
    .catch(function (error) {
      spiderNum++;
      if (spiderNum === fileNum) {
        finishComputed();
      }
      console.log('\n');
      console.log(JSON.stringify(error, null, '\t'));
      console.log('\n');
      var errorText = fileUrl + ' 文件加载失败';
      errorData.push(errorText);
      var savePaths = saveFilePath.split('/');
      var fileName = savePaths.pop();
      failFile.push({
        isFile: true,
        fileUrl: fileUrl,
        fileName: fileName,
        saveFilePath: savePaths.join('/')
      });
      saveFile(
        './ModulesFromUnpkg/failFiles.json',
        JSON.stringify(failFile, null, '\t')
      );
      console.log(errorText);
      console.log('\n');
    });
}

function startSpider(item) {
  if (item.isFile) {
    if (item.fileUrl) {
      var fileName = item.fileName;
      if (!fileName) {
        fileName = '未知文件.txt';
      }
      var savePath = item.saveFilePath;
      if (!savePath) {
        savePath = './未知文件夹';
      }
      savePath = savePath
        .split('/')
        .filter((x) => !!x)
        .join('/');
      var saveFilePath = `${savePath}/${fileName}`;
      if (fs.existsSync(savePath)) {
        spiderFile(item.fileUrl, saveFilePath, item.responseType);
      } else {
        createPath(savePath)
          .then(function (value) {
            spiderFile(item.fileUrl, saveFilePath, item.responseType);
          })
          .catch(function () {
            console.log('目录结构复杂，未自动创建成功，请手动创建！');
          });
      }
    } else {
      console.log('无抓取路径');
    }
  } else {
    if (fs.existsSync(item.filePath)) {
      spiderHtml(item.webUrl, '', item);
    } else {
      createPath(item.filePath).then(function (value) {
        spiderHtml(item.webUrl, '', item);
      });
    }
  }
}

module.exports = function (config) {
  var spiderData = config.spiderData;
  cover = config.cover;
  spiderData.forEach((item) => {
    startSpider(item);
  });
};
