const express = require('express');
const fs = require('fs');
const router = express.Router();
const novelTable = require('../StoryTXTAnalyzing/novelTable.json');
const novelChapterTable = require('../StoryTXTAnalyzing/novelChapterTable.json');
const commonCtrl = (req, res, next) => {
  next();
};

const routers = [
  {
    router: '/fonts/list',
    method: 'get',
    ctrlList: [
      commonCtrl,
      (req, res, next) => {
        const list = require('../StoryTXTAnalyzing/fonts/fonts.json');
        if (list) {
          res.send({
            code: 1,
            message: 'success',
            data: list
          });
        } else {
          res.send({
            code: 1,
            message: 'success',
            data: []
          });
        }
      }
    ]
  },
  {
    router: '/chapterContent/byProgressChapterId',
    method: 'get',
    ctrlList: [
      commonCtrl,
      (req, res, next) => {
        const chapterId = req.query.chapterId;
        const chapter = novelChapterTable.find((item) => item.id === chapterId);
        if (chapter) {
          const preChapter = novelChapterTable.find(
            (item) => item.id === chapter.preChapterId
          );
          const nextChapter = novelChapterTable.find(
            (item) => item.id === chapter.nextChapterId
          );
          res.send({
            code: 1,
            message: 'success',
            data: [preChapter, chapter, nextChapter]
          });
        } else {
          res.send({
            code: 1,
            message: 'success',
            data: []
          });
        }
      }
    ]
  },
  {
    router: '/chapterContent/byChapterId',
    method: 'get',
    ctrlList: [
      commonCtrl,
      (req, res, next) => {
        const chapterId = req.query.chapterId;
        const chapter = novelChapterTable.find((item) => item.id === chapterId);
        if (chapter) {
          res.send({
            code: 1,
            message: 'success',
            data: chapter
          });
        } else {
          res.send({
            code: 1,
            message: 'success',
            data: null
          });
        }
      }
    ]
  },
  {
    router: '/novelData/update',
    method: 'post',
    ctrlList: [
      commonCtrl,
      (req, res, next) => {
        const novelData = req.body;
        const novelIndex = novelTable.findIndex(
          (item) => item.id === novelData.id
        );
        if (novelIndex >= 0) {
          novelTable.splice(novelIndex, 1, novelData);
          fs.writeFileSync(
            './StoryTXTAnalyzing/novelTable.json',
            JSON.stringify(novelTable, null, '\t')
          );
          res.send({
            code: 1,
            message: 'success',
            data: true
          });
        } else {
          res.send({
            code: 1,
            message: 'success',
            data: false
          });
        }
      }
    ]
  }
];
routers.forEach((r) => {
  switch (r.method) {
    case 'get':
      router.get(r.router, ...r.ctrlList);
      break;
    case 'post':
      router.post(r.router, ...r.ctrlList);
      break;
  }
});
module.exports = router;
