const fs = require('fs');
const dir = './Download/BiAnBiZhi/';
const checkImgSize = require('image-size');

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
    var url = dir + file;
    checkImgSize(url, function (err, dimensions) {
      if (err) {
        num++;
        if (fs.existsSync(url)) {
          fs.unlinkSync(url);
          console.log('损坏图片' + url + '已删除！');
        }
      } else {
        // console.log(dimensions);
      }
      if (index == files.length - 1) {
        console.log('共删除' + num + '个损坏图片！');
      }
    });
  });
} catch (err) {
  console.log(err);
}
