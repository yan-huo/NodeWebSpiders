const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const notifier = require('node-notifier');

// 爬取 章节名、内容、下一章  css选择器
const chapterNameCssSelector = '.content h1';
const contentCssSelector = '#content';
const nextPageCssSelector = '.page_chapter ul li:nth-child(3) a';

const baseUrl = 'https://www.biqugebar.cc';
let configInfoPath = './测试.json';
let configInfo = {};
let currentPage = '';
let nextPage = '';
let allContent = [];
let filePath = './测试.txt';
let continueNextPage = false;
let currentUrl = `${baseUrl}${currentPage}`;
const replaceRules = [
  /<script>(.+?)<\/script>/g,
  /　/g,
  /&nbsp;/g,
  /https:\/\/www\.biqugebar\.cc(.+?)\.html/g,
  /请记住本书首发域名(.+?)m\.biqugebar\.cc/g
];
const replaceRegex = new RegExp(
  replaceRules.map((rule) => rule.source).join('|'),
  'g'
);
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
  console.log(
    `${colors.green}write success!${colors.reset}`,
    `${colors.red}${n}${colors.reset}`
  );
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
function filterHtml($) {
  let chapterName = $(chapterNameCssSelector).text();
  let content = $(contentCssSelector).html();
  content = content.replace(replaceRegex, '');
  content = content
    .split('<br>')
    .map((s) => s.replace(/^\s+/, ''))
    .filter(Boolean);
  chapterName = `\r\r${chapterName}\r\r`;
  content.unshift(chapterName);
  allContent = allContent.concat(content);
  nextPage = $(nextPageCssSelector).attr('href');

  if (continueNextPage && nextPage.indexOf('.html') >= 0) {
    currentPage = nextPage;
    console.log(
      `${colors.green}spider html success!${colors.reset}`,
      `${colors.red}${n}${colors.reset}`
    );
    currentUrl = `${baseUrl}${nextPage}`;
    setTimeout(() => {
      spiderHtml(currentUrl);
    }, Math.floor(Math.random() * 1000));
  } else {
    writeContentToTXT();
  }
}
function spiderHtml(webUrl) {
  axios
    .get(`${webUrl}?st=${Date.now()}`, {
      responseType: 'arraybuffer',
      responseEncoding: 'utf8'
    })
    .then(function (res) {
      /*
       * res.data是爬取的页面代码
       * 使用cheerio.load()方法转换后就可以使用jQuery语法操作
       * */
      // console.log(res.data);
      n++;
      var decoder = new TextDecoder('GBK');
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
  currentPage = configInfo.currentPage || currentPage;
  allContent = configInfo.allContent || allContent;
  filePath = configInfo.filePath || filePath;
  continueNextPage = configInfo.continueNextPage;

  getAllContent();
  currentUrl = `${baseUrl}${currentPage}`;
  spiderHtml(currentUrl);
};
