const fs = require('fs');
var path = require('path');
const dir = 'F:/壁纸/';
const getPixels = require('get-pixels');
var delNum = 0;

try {
  const files = fs.readdirSync(dir);
  var test = files.slice(0, 10);
  var num = 0;
  var fileIndex = 0;
  function check(file, index, files) {
    var url = dir + file;
    getPixels(url, function (err, pixels) {
      fileIndex++;
      if (err) {
        num++;
        fs.unlinkSync(url);
        console.log('损坏图片' + url + '已删除！');
      } else {
        // console.log(pixels);
      }
      if (fileIndex == files.length) {
        console.log(
          '共删除' +
            num +
            '个损坏图片！共' +
            (files.length - num) +
            '个正常图片！'
        );
      }
    });
  }
  files.forEach((file, index) => {
    // check(file, index, files);
  });
} catch (err) {
  console.log(err);
}
