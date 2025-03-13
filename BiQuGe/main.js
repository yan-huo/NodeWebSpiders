const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const notifier = require('node-notifier');
const http2Request = require('../http2Request');
const nums = require('../num.json');

// 爬取 章节名、内容、下一章  css选择器
let chapterNameCssSelector = '.content h1';
let contentCssSelector = '#content';
let nextPageCssSelector = '.page_chapter ul li:nth-child(3) a';
let requestHeaders = {};

let request = axios.get;
let baseUrl = 'https://www.biqugebar.cc';
let configInfoPath = './测试.json';
let configInfo = {};
let currentPage = '';
let nextPage = '';
let endPage = '';
let allContent = [];
let filePath = './测试.txt';
let contentSeparator = '<br>';
let continueNextPage = false;
let currentUrl = `${baseUrl}${currentPage}`;
let jumpPage = null;
let chapterNameReplaceRules = [];
let replaceRules = [
  /<script>(.+?)<\/script>/g,
  /　/g,
  /&nbsp;/g,
  /https:\/\/www\.biqugebar\.cc(.+?)\.html/g,
  /\(https:\/\/www\.bqduo\.cc(.+?)\.html\)/g,
  /<!---(.+?)--->/g,
  /（新浪微博关注：飞天鱼的微博）/g,
  /（微信关注：feitianyu5新浪微博关注：飞天鱼的微博）/g,
  /1秒记住笔趣阁网(.+?)手机版阅读网址：wap\.bqduo\.cc/g,
  /请记住本书首发域名(.+?)m\.biqugebar\.cc/g
];
let replaceRegex = new RegExp(
  replaceRules.map((rule) => rule.source).join('|'),
  'g'
);
let chapterNameReplaceRegex =
  chapterNameReplaceRules.length &&
  new RegExp(chapterNameReplaceRules.map((rule) => rule.source).join('|'), 'g');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function consoleNum(n) {
  const numList = String(n)
    .split('')
    .map((i) => Number(i));
  let numStrList = [];
  numList.forEach((m) => {
    if (numStrList.length) {
      for (var i = 0; i < numStrList.length; i++) {
        numStrList[i] += '   ' + nums[m][i];
      }
    } else {
      numStrList = nums[m].map((s) => `          ${s}`);
    }
  });
  numStrList.forEach((s) => {
    console.log(`${colors.red}${s}${colors.reset}`);
  });
}

function writeContentToTXT(error) {
  fs.writeFileSync(filePath, allContent.join('\n'), 'utf-8');
  fs.writeFileSync('./lastSuccessHtml.txt', currentUrl);
  if (!error) {
    fs.writeFileSync('./errorHtml.txt', '');
  }
  configInfo.lastPage = currentPage;
  fs.writeFileSync(configInfoPath, JSON.stringify(configInfo, null, '\t'));
  console.log('\n');
  console.log('\n');
  console.log(`${colors.green}write success!${colors.reset}`);
  console.log('\n');
  console.log('\n');
  consoleNum(n);
  console.log('\n');
  console.log('\n');
  notifier.notify({
    title: `${filePath} 爬取`,
    message: `爬取成功，本次共爬取 ${n} 条`,
    sound: true, // 可选，在Mac上播放声音
    wait: true // 可选，在notification显示时保持程序运行
  });
}

var n = 0;
let prevChapterName = '';
function filterHtml($) {
  let chapterName = $(chapterNameCssSelector).text();
  if (chapterNameReplaceRegex) {
    chapterName = chapterName.replace(chapterNameReplaceRegex, '');
  }
  let content = $(contentCssSelector).html();
  content = content.replace(replaceRegex, '');
  content = content
    .split(contentSeparator)
    .map((s) => s.replace(/^\s+/, ''))
    .filter(Boolean)
    .filter((s) => s !== chapterName && s !== chapterName.split(' ').join(''));
  if (!prevChapterName || chapterName !== prevChapterName) {
    content.unshift(`\r\r${chapterName}\r\r`);
  }

  allContent = allContent.concat(content);
  nextPage = $(nextPageCssSelector).attr('href');
  if (jumpPage && jumpPage[currentPage]) {
    nextPage = jumpPage[currentPage];
  }
  prevChapterName = chapterName;
  if (
    (!endPage || endPage !== currentPage) &&
    continueNextPage &&
    nextPage.indexOf('.html') >= 0
  ) {
    currentPage = nextPage;
    console.log('\x1B[2J\x1B[0;0H');
    console.log(`${colors.green}spider html success!${colors.reset}`);
    console.log('\n');
    console.log('\n');
    consoleNum(n);
    currentUrl = `${baseUrl}${nextPage}`;
    setTimeout(() => {
      spiderHtml(currentUrl);
    }, Math.floor(Math.random() * 1000));
  } else {
    writeContentToTXT();
  }
}
function spiderHtml(webUrl) {
  request(`${webUrl}?st=${Date.now()}`, {
    responseType: 'arraybuffer',
    responseEncoding: 'utf8',
    headers: requestHeaders
  })
    .then(function (res) {
      /*
       * res.data是爬取的页面代码
       * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
       * */
      // console.log(res.data);
      n++;
      let charset = 'utf-8';
      const contentType = res.headers['content-type'];
      if (contentType && contentType.includes('charset=')) {
        charset = contentType.split('charset=')[1];
      }
      var decoder = new TextDecoder(charset);
      var htmlContent = decoder.decode(new Uint8Array(res.data));
      const $ = cheerio.load(htmlContent);
      filterHtml($);
    })
    .catch(function (error) {
      console.log('\n');
      var errorText = webUrl + ' 加载失败';
      fs.writeFileSync('./errorHtml.txt', webUrl);
      console.log(`${colors.red}${errorText}${colors.reset}`, error);
      console.log('\n');
      writeContentToTXT(true);
    });
}

function getAllContent() {
  var txtContent = [];
  try {
    const fromEncoding = chardet.detectFileSync(filePath);
    const buffer = fs.readFileSync(filePath);
    var fileContentData;
    if (fromEncoding.toUpperCase().indexOf('utf') >= 0) {
      fileContentData = buffer.toString('utf8');
    } else {
      const converted = iconv.decode(buffer, fromEncoding);
      const resultBuffer = iconv.encode(converted, 'utf8');
      fileContentData = resultBuffer.toString('utf8');
    }
    txtContent = fileContentData.split('\n');
  } catch (e) {}
  if (txtContent.length) {
    allContent = txtContent;
  }
}

module.exports = function start(path) {
  configInfoPath = path;
  configInfo = require(configInfoPath);
  if (configInfo.chapterNameReplaceRules) {
    try {
      chapterNameReplaceRules = chapterNameReplaceRules.concat(
        configInfo.chapterNameReplaceRules.map((rule) => eval(rule))
      );
    } catch (e) {
      console.error('chapterNameReplaceRules error', e);
    }
    if (chapterNameReplaceRules.length) {
      chapterNameReplaceRegex =
        chapterNameReplaceRules.length &&
        new RegExp(
          chapterNameReplaceRules.map((rule) => rule.source).join('|'),
          'g'
        );
    }
  }

  if (configInfo.replaceRules) {
    try {
      replaceRules = replaceRules.concat(
        configInfo.replaceRules.map((rule) => eval(rule))
      );
    } catch (e) {
      console.error('replaceRules error', e);
    }
    replaceRegex = new RegExp(
      replaceRules.map((rule) => rule.source).join('|'),
      'g'
    );
  }
  endPage = configInfo.endPage || endPage;
  contentSeparator = configInfo.contentSeparator || contentSeparator;
  jumpPage = configInfo.jumpPage;
  baseUrl = configInfo.baseUrl || baseUrl;
  chapterNameCssSelector =
    configInfo.chapterNameCssSelector || chapterNameCssSelector;
  contentCssSelector = configInfo.contentCssSelector || contentCssSelector;
  nextPageCssSelector = configInfo.nextPageCssSelector || nextPageCssSelector;
  requestHeaders = configInfo.requestHeaders || requestHeaders;
  if (configInfo.http2Request) {
    request = http2Request;
  }
  currentPage = configInfo.currentPage || currentPage;
  allContent = configInfo.allContent || allContent;
  filePath = configInfo.filePath || filePath;
  continueNextPage = configInfo.continueNextPage;

  getAllContent();
  currentUrl = `${baseUrl}${currentPage}`;
  spiderHtml(currentUrl);
};
