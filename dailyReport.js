const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
function saveFile(saveFilePath, file) {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFileSync(saveFilePath, file);
      console.log(`writeFile ${saveFilePath} success`);
      resolve(true);
    } catch (e) {
      var errorText = `writeFile ${saveFilePath} error`;
      console.error(errorText);
      reject(false);
    }
  });
}

Promise.all([
  axios.get(
    'http://219.141.205.210:48086/assmApi/assm/common/report/generalDaily/page',
    {
      params: {
        pageSize: 100,
        pageNo: 1,
        reportDateStart: '2024-10-01',
        reportDateEnd: '2024-12-31',
        authCode: 'LOOK_myOaReport',
        token: 'dd51a67891ef494e86674e9191567198',
        userId: 'dd51a67891ef494e86674e9191567198',
        reportType: 'assm_report_general_daily'
      }
    }
  ),
  axios.get(
    'http://219.141.205.210:48086/assmApi/assm/common/report/generalTrip/page',
    {
      params: {
        pageSize: 100,
        pageNo: 1,
        reportDateStart: '2024-10-01',
        reportDateEnd: '2024-12-31',
        authCode: 'LOOK_myOaReport',
        token: 'dd51a67891ef494e86674e9191567198',
        userId: 'dd51a67891ef494e86674e9191567198',
        reportType: 'assm_report_general_trip'
      }
    }
  )
]).then((result) => {
  var data0 = result[0].data.data.rows;
  var data1 = result[1].data.data.rows;
  var reportList = [];
  _.forEach(data0, function (item) {
    axios
      .get(
        'http://219.141.205.210:48086/assmApi/assm/common/report/generalDaily/get/complete',
        {
          params: {
            id: item.id,
            token: 'dd51a67891ef494e86674e9191567198'
          }
        }
      )
      .then((res) => {
        var itemData = res.data.data.items[0];
        var itemReport = {
          date: item.reportDate,
          content: itemData.workContent
        };
        reportList.push(itemReport);
        if (reportList.length == data0.length + data1.length) {
          handleReportData(reportList);
        }
      });
  });
  _.forEach(data1, function (item) {
    axios
      .get(
        'http://219.141.205.210:48086/assmApi/assm/common/report/generalTrip/get/complete',
        {
          params: {
            id: item.id,
            token: 'dd51a67891ef494e86674e9191567198'
          }
        }
      )
      .then((res) => {
        var itemData = res.data.data.items[0];
        var itemReport = {
          date: item.reportDate,
          content: itemData.workContent
        };
        reportList.push(itemReport);
        if (reportList.length == data0.length + data1.length) {
          handleReportData(reportList);
        }
      });
  });
});

function handleReportData(data) {
  data.sort((a, b) => a.date - b.date);
  _.forEach(data, (item) => {
    item.date = moment(item.date).format('YYYY-MM-DD');
    item.content = item.content.split('\n').filter(Boolean);
  });
  console.log(`共计：${data.length}条`);
  saveFile('./dailyReportRecords.json', JSON.stringify(data, null, '\t'));
}
