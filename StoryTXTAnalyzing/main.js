const fs = require('fs');
const uuidv4 = require('uuid');
const chardet = require('chardet');
const iconv = require('iconv-lite');
const notifier = require('node-notifier');

const txtFilePath = './StoryTXTAnalyzing/测试.txt';
const novelTable = require('./novelTable.json');
let novelChapterTable = require('./novelChapterTable.json');
// let novelChapterTable = [];
const pageContentWidth = 394;
const pageContentHeight = 676;
const fontSize = 17;
const chapterNameFontSize = Math.floor((fontSize * 16) / 12);
const chapterNameLineHeight = Math.floor(chapterNameFontSize * 2.5);
const lineHeight = 25;
const lineFontNum = Math.floor(pageContentWidth / fontSize);
const onePageLineNum = Math.floor(pageContentHeight / lineHeight);
const firstPageLineNum = Math.floor(
  (pageContentHeight - chapterNameLineHeight) / lineHeight
);

function handleChapterPaging(data) {
  if (!data) {
    return [];
  }
  var pages = [
    {
      name: data.name,
      content: []
    }
  ];
  var pageNo = 0;
  var pageLineNum = firstPageLineNum;
  var lineNum = 0;
  function handleParagraph(text, flag) {
    var paragraphLineNum = computedParagraphLineNum(text, flag);
    if (lineNum + paragraphLineNum <= pageLineNum) {
      pages[pageNo].content.push({
        flag: flag,
        text: text
      });
      if (lineNum + paragraphLineNum == pageLineNum) {
        lineNum = 0;
        pageNo++;
        pages.push({ content: [] });
      } else {
        lineNum += paragraphLineNum;
      }
    } else {
      var diffLineNum = pageLineNum - lineNum;
      var subText = text.slice(0, diffLineNum * lineFontNum - (flag ? 2 : 0));
      pages[pageNo].content.push({
        flag: flag,
        text: subText
      });
      lineNum = 0;
      pageNo++;
      pages.push({ content: [] });
      var newText = text.slice(diffLineNum * lineFontNum - (flag ? 2 : 0));
      handleParagraph(newText, false);
    }
  }
  data.content.forEach((paragraph) => {
    if (pageNo) {
      pageLineNum = onePageLineNum;
    }
    handleParagraph(paragraph, true);
  });
  return pages;
}
function computedParagraphLineNum(paragraph, flag) {
  if (!paragraph) {
    return 0;
  }
  var fontNum = paragraph.length;
  if (/\r$/.test(paragraph)) {
    fontNum -= 1;
  }
  return Math.ceil((fontNum + (flag ? 2 : 0)) / lineFontNum);
}
function main(filePath) {
  const filePathSplit = filePath.split('/');
  const fileName = filePathSplit.pop();
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
  var rg = /^\S{1,10}章 \S{1,20}/;
  var txtContent = fileContentData
    .split('\n')
    .map((s) =>
      s
        .replace(/^\s+/, '')
        .replace(/&nbsp;/g, '')
        .replace(/　/g, '')
    )
    .filter(Boolean);
  var chapterList = [];
  var size = 0;
  var pagesNumber = 0;
  const novelData = {
    id: uuidv4(),
    name: fileName.split('.')[0],
    path: filePath,
    wordsNumber: size,
    pagesNumber: pagesNumber,
    chapterNumber: 0,
    progressPageNumber: 1,
    progressChapterId: '',
    progressChapterPageIndex: 0,
    progressTime: null,
    fontSize: fontSize,
    lineHeight: lineHeight
  };
  txtContent.forEach((s, index) => {
    if (rg.test(s)) {
      var chapterItem = {
        index: index,
        name: s,
        content: []
      };
      chapterList.push(chapterItem);
    }
    size += s.length;
  });
  if (chapterList[0] && chapterList[0].index != 0) {
    chapterList.unshift({
      index: 0,
      name: '前言\r',
      content: []
    });
  }
  var activeChapterList = [];
  chapterList.forEach((item, index) => {
    var startIndex = item.index;
    delete item.index;
    if (rg.test(item.name)) {
      startIndex += 1;
    }
    var endIndex =
      (chapterList[index + 1] && chapterList[index + 1].index) ||
      txtContent.length;
    const content = txtContent.slice(startIndex, endIndex);
    const pages = handleChapterPaging({ name: item.name, content: content });
    pagesNumber += pages.length;
    const chapterData = {
      id: uuidv4(),
      name: item.name,
      content: content,
      novelId: novelData.id,
      preChapterId: index && activeChapterList[index - 1].id,
      nextChapterId: null
    };
    activeChapterList.push(chapterData);
  });
  activeChapterList.forEach((item, index) => {
    if (activeChapterList[index + 1]) {
      item.nextChapterId = activeChapterList[index + 1].id;
    }
  });
  novelData.chapterNumber = chapterList.length;
  novelData.wordsNumber = size;
  novelData.pagesNumber = pagesNumber;
  novelData.progressChapterId = activeChapterList[0] && activeChapterList[0].id;
  novelChapterTable = activeChapterList.concat(novelChapterTable);
  novelTable.unshift(novelData);
  fs.writeFileSync(
    './StoryTXTAnalyzing/novelTable.json',
    JSON.stringify(novelTable, null, '\t')
  );
  fs.writeFileSync(
    './StoryTXTAnalyzing/novelChapterTable.json',
    JSON.stringify(novelChapterTable, null, '\t')
  );
  console.log('success');

  notifier.notify({
    title: `${txtFilePath} 解析`,
    message: `解析成功，该文件共计 ${novelData.chapterNumber} 章， ${novelData.wordsNumber} 字`,
    sound: true, // 可选，在Mac上播放声音
    wait: true // 可选，在notification显示时保持程序运行
  });
}

main(txtFilePath);
