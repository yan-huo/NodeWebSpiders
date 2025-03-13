function readJsonByFile(fileNamePath) {
  // 只能用于安卓 导入java类
  const File = plus.android.importClass('java.io.File');
  const BufferedReader = plus.android.importClass('java.io.BufferedReader');
  const FileReader = plus.android.importClass('java.io.FileReader');
  const FileWriter = plus.android.importClass('java.io.FileWriter');
  // 安卓11以下 /sdcard/自己的文件夹/1.txt	// 安卓11 建议用 /storage/emulated/0/Download/自己的文件夹/1.txt	// 读取txt文件 readFile ("/sdcard/修止符/配置.json")
  const readFile = (fileName) => {
    const readFr = new File(fileName);
    try {
      const reader = new BufferedReader(new FileReader(readFr));
      let txt;
      let retxt = '';
      let flag = true;
      while (flag) {
        txt = reader.readLine();
        // 读取文件
        if (txt == null) {
          flag = false;
          break;
        }
        retxt = retxt + txt;
      }
      return retxt;
    } catch (e) {
      console.log(e);
      return '';
    }
  };
  const settingJsonPath = '/sdcard/wisdomApp/settingJson.txt';
  const json = readFile(fileNamePath);
  return json;
}

function getFileEncoding(filePath, callback) {
  plus.io.resolveLocalFileSystemURL(
    filePath,
    function (entry) {
      entry.file(
        function (file) {
          var reader = new plus.io.FileReader();
          reader.onloadend = function (e) {
            var arrayBuffer = e.target.result;
            var dataView = new DataView(arrayBuffer);
            var BOM = '';
            if (
              dataView.getUint8(0) === 0xef &&
              dataView.getUint8(1) === 0xbb &&
              dataView.getUint8(2) === 0xbf
            ) {
              BOM = 'UTF-8';
            } else if (
              dataView.getUint8(0) === 0xff &&
              dataView.getUint8(1) === 0xfe
            ) {
              BOM = 'UTF-16 LE';
            } else if (
              dataView.getUint8(0) === 0xfe &&
              dataView.getUint8(1) === 0xff
            ) {
              BOM = 'UTF-16 BE';
            } else {
              BOM = 'None';
            }
            callback(BOM);
          };
          reader.onerror = function (e) {
            console.log('Read file failed: ' + e.message);
          };
          reader.readAsArrayBuffer(file);
        },
        function (e) {
          console.log('Read file error: ' + e.message);
        }
      );
    },
    function (e) {
      console.log('Resolve file URL failed: ' + e.message);
    }
  );
}

// 使用方法
var filePath = '_www/somefile.txt'; // 这里请替换为你的文件路径
getFileEncoding(filePath, function (encoding) {
  console.log('File encoding: ' + encoding);
});

function readFileContent(filePath, callback) {
  const file = new plus.android.File(filePath);
  const fileInputStream = new plus.android.FileInputStream(file);
  const bufferedReader = new plus.android.BufferedReader(
    new plus.android.InputStreamReader(fileInputStream),
    1024
  );

  let content = '';
  let line;

  const readLine = () => {
    line = bufferedReader.readLine();
    if (line === null) {
      bufferedReader.close();
      fileInputStream.close();
      callback(content);
    } else {
      content += line + '\n';
      readLine(); // 递归调用读取下一行，可以在此处添加进度监听逻辑
    }
  };

  readLine(); // 开始读取文件内容
}

// 使用示例
const filePath = '_doc/somefile.txt'; // 替换为你的文件路径
readFileContent(filePath, (content) => {
  console.log(content); // 文件内容
});
