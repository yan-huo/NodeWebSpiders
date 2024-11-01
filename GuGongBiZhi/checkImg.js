const fs = require('fs');
const dir = './Download/GuGongBiZhi/';
const checkImgSize = require('image-size');
const getPixels = require('get-pixels');

try {
  function checkImgBySize() {
    var files = fs.readdirSync(dir);
    console.log(files.length);
    var num = 0;
    var fileIndex = 0;
    files.forEach((file) => {
      var url = dir + file;
      checkImgSize(url, function (err, pixels) {
        fileIndex++;
        if (err) {
          num++;
          fs.unlinkSync(url);
          console.log('损坏图片' + url + '已删除！');
        } else {
          // console.log(fileIndex);
        }
        if (fileIndex == files.length) {
          console.log(
            '共删除' +
              num +
              '个损坏图片！共' +
              (files.length - num) +
              '个正常图片！'
          );
          checkImgByPixels();
          return;
        }
      });
    });
  }
  function checkImgByPixels() {
    var files = fs.readdirSync(dir);
    var num = 0;
    var fileIndex = 0;
    files.forEach((file) => {
      var url = dir + file;
      getPixels(url, function (err, pixels) {
        fileIndex++;
        if (err) {
          num++;
          fs.unlinkSync(url);
          console.log('损坏图片' + url + '已删除！');
        } else {
          // console.log(fileIndex);
        }
        if (fileIndex == files.length) {
          console.log(
            '共删除' +
              num +
              '个损坏图片！共' +
              (files.length - num) +
              '个正常图片！'
          );
          return;
        }
      });
    });
  }
  checkImgBySize();
} catch (err) {
  console.log(err);
}
