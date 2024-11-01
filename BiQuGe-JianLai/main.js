const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const baseUrl = 'https://www.biqugebar.cc';
let currentPage = '/12_12505/67550747.html';
let nextPage = '';
let currentUrl = `${baseUrl}${currentPage}`;
let allContent = ['\r\r《剑来》 烽火戏诸侯'];
const filePath = './剑来2.txt';
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

function writeContentToTXT() {
  fs.writeFileSync(filePath, allContent.join('\n'), 'utf-8');
  fs.writeFileSync('./lastSuccessHtml.txt', currentUrl);
  console.log('write success!', n);
}

var n = 0;
function filterHtml($) {
  let chapterName = $('.content h1').text();
  let content = $('#content').html();
  content = content.replace(replaceRegex, '');
  content = content
    .split('<br>')
    .map((s) => s.replace(/^\s+/, ''))
    .filter(Boolean);
  chapterName = `\r\r${chapterName}\r\r`;
  content.unshift(chapterName);
  allContent = allContent.concat(content);
  nextPage = $('.page_chapter ul li').eq(2).find('a').attr('href');

  return writeContentToTXT();
  if (nextPage.indexOf('.html') >= 0) {
    currentUrl = `${baseUrl}${nextPage}`;
    console.log('spider html success!', n);
    setTimeout(() => {
      spiderHtml(currentUrl);
    }, Math.floor(Math.random() * 1500));
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
      console.log(errorText, error);
      console.log('\n');
      writeContentToTXT();
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

getAllContent();
spiderHtml(currentUrl);
