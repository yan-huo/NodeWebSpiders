const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const http2 = require('http2');

const failFile = [];

var stop = false;
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
      '\n共 ' +
        fileNum +
        '个图片，成功下载 ' +
        successNum +
        '个，失败 ' +
        failNum +
        '个。\n'
    );
    if (failNum) {
      console.log('请执行 node restart 命令重新下载失败图片！');
    } else {
      writeFile(
        './TodayBiYingBiZhi/failFiles.json',
        JSON.stringify([], null, '\t'),
        function (flag) {}
      );
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
  var imgList = $('img.progressive__img');
  var idList = [];
  for (var i = 0; i < imgList.length; i++) {
    var imgData = imgList.eq(i).data('progressive') || '';
    var imgDatas = imgData.split('id=');
    if (imgDatas[1]) {
      idList.push(imgDatas[1].replace(/800x480/, '1920x1080'));
    }
  }
  if (page && pages && page < pages) {
    spiderHtml(`${config.webUrl}?p=${page + 1}`, config);
  }
  for (var i = 0; i < idList.length; i++) {
    if (stop) {
      return;
    }
    var fileUrl = config.fileUrl;
    var fileName = idList[i].indexOf('.') >= 0 ? idList[i] : `${idList[i]}.txt`;
    var saveFilePath = `${config.filePath}/${fileName}`;
    spiderFile(fileUrl, saveFilePath, { id: idList[i], qlt: 100 });
  }
}

function spiderHtml(webUrl, config, params) {
  let res = '';
  let postBody = JSON.stringify(params);
  let baseUrl = 'https://www.todaybing.com';
  let path = '/web/api';
  const client = http2.connect(baseUrl);
  const req = client.request({
    ':Authority': 'www.todaybing.com',
    ':Method': 'POST',
    ':Path': path,
    ':Scheme': 'https',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Content-Length': Buffer.byteLength(postBody),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Cookie:
      'PHPSESSID=1l7caojp2rqhshso30u8c9mv61; Hm_lvt_825e2841aa660d85659ff96b88c6deed=1686903900; __gads=ID=95a7141c56f70264-22bbbfa7a2e100ff:T=1686904140:RT=1686904140:S=ALNI_MaEOH55e438OL_NOgJxts_ky3zLsw; __gpi=UID=00000c4fb5606ab8:T=1686904140:RT=1686904140:S=ALNI_Mak9_SfVhIar2B8wnP98i4vn11EJg; Hm_lpvt_825e2841aa660d85659ff96b88c6deed=1686904399'
  });
  req.on('response', (headers, flags) => {
    for (const name in headers) {
      console.log(`${name}: ${headers[name]}`);
    }
  });
  req.on('data', (chunk) => {
    res = res + chunk;
  });
  req.on('end', () => {
    client.close();
  });

  req.end(postbody);
  return;
  var axiosOptions = {
    headers: {
      Authority: 'www.todaybing.com',
      Method: 'POST',
      Path: '/web/api',
      Scheme: 'https',
      Cookie:
        'PHPSESSID=1l7caojp2rqhshso30u8c9mv61; Hm_lvt_825e2841aa660d85659ff96b88c6deed=1686903900; __gads=ID=95a7141c56f70264-22bbbfa7a2e100ff:T=1686904140:RT=1686904140:S=ALNI_MaEOH55e438OL_NOgJxts_ky3zLsw; __gpi=UID=00000c4fb5606ab8:T=1686904140:RT=1686904140:S=ALNI_Mak9_SfVhIar2B8wnP98i4vn11EJg; Hm_lpvt_825e2841aa660d85659ff96b88c6deed=1686904399'
    }
  };
  axios
    .post(webUrl, params, axiosOptions)
    .then(function (res) {
      /*
       * res.data是爬取的页面代码
       * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
       * */

      return console.log(res);
      const $ = cheerio.load(res.data);
      filterHtml($, config);
    })
    .catch(function (error) {
      console.log(error);
      console.log('\n');
      console.log(JSON.stringify(error, null, '\t'));
      console.log('\n');
      var errorText = webUrl + '数据列表加载失败';
      console.log(errorText);
      console.log('\n');
    });
}

function spiderFile(fileUrl, saveFilePath, params) {
  var axiosOptions = { params: params, responseType: 'stream' };
  var savePaths = saveFilePath.split('/');
  var fileName = savePaths.pop();
  fileNum++;
  axios
    .get(fileUrl, axiosOptions)
    .then(function (res) {
      try {
        let ws = fs.createWriteStream(saveFilePath);
        ws.on('error', function (err) {
          var errorText = `writeFile ${saveFilePath} error, 流存储发生异常`;
          console.error(errorText);
          failFile.push({
            isFile: true,
            fileUrl: fileUrl,
            fileName: fileName,
            params: params,
            saveFilePath: savePaths.join('/')
          });
          saveFile(
            './TodayBiYingBiZhi/failFiles.json',
            JSON.stringify(failFile, null, '\t')
          );
          spiderNum++;
          if (spiderNum === fileNum) {
            finishComputed();
          }
        });
        ws.on('finish', function (fin) {
          successNum++;
          spiderNum++;
          if (spiderNum === fileNum) {
            finishComputed();
          }
          console.log(`writeFile ${saveFilePath} success`);
        });
        res.data.pipe(ws);
      } catch (e) {
        spiderNum++;
        if (spiderNum === fileNum) {
          finishComputed();
        }
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
          './TodayBiYingBiZhi/failFiles.json',
          JSON.stringify(failFile, null, '\t')
        );
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
      var savePaths = saveFilePath.split('/');
      var fileName = savePaths.pop();
      failFile.push({
        isFile: true,
        fileUrl: fileUrl,
        fileName: fileName,
        params: params,
        saveFilePath: savePaths.join('/')
      });
      saveFile(
        './TodayBiYingBiZhi/failFiles.json',
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
        spiderFile(item.fileUrl, saveFilePath, item.params);
      } else {
        createPath(savePath)
          .then(function (value) {
            spiderFile(item.fileUrl, saveFilePath, item.params);
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
      spiderHtml(item.webUrl, item, item.params);
    } else {
      createPath(item.filePath).then(function (value) {
        spiderHtml(item.webUrl, item, item.params);
      });
    }
  }
}

module.exports = function (spiderData) {
  spiderData.forEach((item) => {
    startSpider(item);
  });
};
