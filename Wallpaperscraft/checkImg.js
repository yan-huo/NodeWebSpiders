const fs = require('fs');
const dir = './Download/Wallpaperscraft/';
const checkImgSize = require('image-size');
const getPixels = require('get-pixels');

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
try {
  const files = fs.readdirSync(dir);
  var num = 0;
  files.forEach((file, index) => {
    (function check(file, index) {
      var url = dir + file;
      getPixels(url, function (err, pixels) {
        if (err) {
          num++;
          fs.unlinkSync(url);
          console.log('损坏图片' + url + '已删除！');
        } else {
          // console.log(pixels);
        }
        if (index == files.length - 1) {
          console.log(
            '共删除' +
              num +
              '个损坏图片！共' +
              (files.length - num) +
              '个正常图片！'
          );
        }
      });
    })(file, index);
  });
} catch (err) {
  console.log(err);
}
