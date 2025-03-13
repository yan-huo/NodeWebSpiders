module.exports = {
  cover: true, // 是否覆盖写入,不覆盖仅适用于同批次爬取或1次文件名拼接1
  spiderData: [
    // {
    //   isFile: false, // 是否是直接抓取文件
    //   filePath: './Download/Element-Ui', // 存储目录  Download是所有下载根目录
    //   webUrl: 'https://unpkg.com/browse/element-ui@2.15.13/', // 爬取页面基础路径
    //   fileUrl: 'https://unpkg.com/element-ui@2.15.13/' // 爬取文件基础路径
    // },
    // {
    //   isFile: false, // 是否是直接抓取文件
    //   filePath: './Download/vue-masked-input', // 存储目录  Download是所有下载根目录
    //   webUrl: 'https://unpkg.com/browse/vue-masked-input@0.5.2/', // 爬取页面基础路径
    //   fileUrl: 'https://unpkg.com/vue-masked-input@0.5.2/' // 爬取文件基础路径
    // },
    {
      isFile: false, // 是否是直接抓取文件
      filePath: './Download/xlsx', // 存储目录  Download是所有下载根目录
      webUrl: 'https://unpkg.com/browse/xlsx@0.18.5/', // 爬取页面基础路径
      fileUrl: 'https://unpkg.com/xlsx@0.18.5/' // 爬取文件基础路径
    }
  ]
};
