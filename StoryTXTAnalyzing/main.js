const fs = require('fs');
const chardet = require('chardet');
const iconv = require('iconv-lite');
const txtFilePath = './StoryTXTAnalyzing/武动乾坤.txt';

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
  var rg = /^\S{1,10}章 \S{1,20}\r$/;
  var txtContent = fileContentData
    .split('\n')
    .map((s) => s.replace(/^\s+/, ''))
    .filter(Boolean);
  var chapterList = [];
  var size = 0;
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
  chapterList.forEach((item, index) => {
    var startIndex = item.index;
    delete item.index;
    if (startIndex) {
      startIndex += 1;
    }
    var endIndex =
      (chapterList[index + 1] && chapterList[index + 1].index) ||
      txtContent.length;
    item.content = txtContent.slice(startIndex, endIndex);
  });
  const txtFileData = {
    name: fileName.split('.')[0],
    EXT: fileName.split('.')[1],
    size: size,
    chapterList: chapterList
  };
  fs.writeFileSync(
    './StoryTXTAnalyzing/txtFilesData.json',
    JSON.stringify(txtFileData, null, '\t')
  );
  fs.writeFileSync(
    './StoryTXTAnalyzing/chapterJson.json',
    JSON.stringify(chapterList, null, '\t')
  );
  fs.writeFileSync(
    './StoryTXTAnalyzing/txtJson.json',
    JSON.stringify(txtContent, null, '\t')
  );
  console.log('success');
}

main(txtFilePath);
