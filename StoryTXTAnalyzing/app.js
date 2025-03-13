let diffX = 0,
  moveX = 0,
  left = null,
  dragElClass = null,
  dragEl = null,
  stopTouch = false,
  startTouch = false;
const vm = new Vue({
  el: '#app',
  data() {
    return {
      pageMainHeight: 0,
      pageMainWidth: 0,
      name: '',
      size: 0,
      fontSizeList: [],
      fontSizeIndex: 5,
      readPageData: [],
      unreadPageData: [],
      hasPrev: false,
      hasNext: false,
      dataItemIndex: 0,
      dataItem1: {},
      dataItem2: {},
      dataItem3: {},
      changeDataItemKey: '',
      novelProcessData: {
        id: 'd4cdd6fc-71d5-4269-ac59-3e2f0bfd7a80',
        name: '测试',
        path: './StoryTXTAnalyzing/测试.txt',
        wordsNumber: '11563',
        pagesNumber: '24',
        chapterNumber: '1',
        progressPageNumber: 1,
        progressChapterId: '655f2e97-56e1-48be-9d1a-db0a2a8ed518',
        progressChapterPageIndex: 0,
        progressTime: '1730872537330',
        fontSize: '17',
        lineHeight: '25'
      },
      currentChapterPageData: {},
      prevChapterPages: [],
      currentChapterPages: [],
      nextChapterPages: [],
      prevChapterId: '',
      currentChapterId: '',
      nextChapterId: '',
      fontsList: [],
      iframeSrc: ''
    };
  },
  computed: {
    activeFontSize() {
      return (
        this.fontSizeList[this.fontSizeIndex] || { value: 12, lineHeight: 20 }
      );
    },
    chapterNameFontSize() {
      return Math.floor((this.activeFontSize.value * 16) / 12);
    },
    chapterNameLineHeight() {
      return Math.floor(this.chapterNameFontSize * 2.5);
    },
    chapterNameStyle() {
      return {
        fontSize: this.chapterNameFontSize + 'px',
        lineHeight: this.chapterNameLineHeight + 'px'
      };
    },
    chapterParagraphStyle() {
      return {
        fontSize: this.activeFontSize.value + 'px',
        lineHeight: this.activeFontSize.lineHeight + 'px'
      };
    },
    lineFontNum() {
      return Math.floor(this.pageMainWidth / this.activeFontSize.value);
    },
    onePageLineNum() {
      return Math.floor(this.pageMainHeight / this.activeFontSize.lineHeight);
    },
    firstPageLineNum() {
      return Math.floor(
        (this.pageMainHeight - this.chapterNameLineHeight) /
          this.activeFontSize.lineHeight
      );
    }
  },
  created() {
    this.novelProcessDataStr = JSON.stringify(this.novelProcessData);
    for (var i = 12; i <= 40; i++) {
      this.fontSizeList.push({
        value: i,
        lineHeight: Math.floor(i * 1.5)
      });
    }
  },
  mounted() {
    request({
      url: 'http://192.168.1.94:50020/platform/user/loginVerify',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    })({ userName: 'root', password: 'f01a2fccc8b477a5' }).then((res) => {
      console.log(res);
      this.iframeSrc = `http://192.168.1.29:8880/outline/plan/stencil?token=${res.token}`;
    });
    // this.pageMainHeight = this.$refs.pageMain.clientHeight - 60;
    // this.pageMainWidth = this.$refs.pageMain.clientWidth - 20;
    // this.getChapterProcessData();
    // request({ url: '/fonts/list', method: 'get' })().then((data) => {
    //   const style = document.createElement('style');
    //   style.type = 'text/css';
    //   let htmlText = '';
    //   data.forEach((item) => {
    //     item.list.forEach((font) => {
    //       htmlText += `@font-face {
    //         font-family: '${item.type}_${font.code}';
    //         src: url('./fonts/${item.type}/${font.code}.${
    //         font.suffix
    //       }') format('${
    //         font.suffix.toLowerCase() === 'otf' ? 'opentype' : 'truetype'
    //       }');
    //       }\n`;
    //       htmlText += `.${item.type}_${font.code}{
    //         font-family: '${item.type}_${font.code}';
    //       }\n`;
    //     });
    //   });
    //   style.innerHTML = htmlText;
    //   document.head.appendChild(style);
    //   this.$nextTick(() => {
    //     this.fontsList = data;
    //   });
    // });
  },
  methods: {
    getChapterProcessData() {
      request({ url: '/chapterContent/byProgressChapterId', method: 'get' })({
        chapterId: this.novelProcessData.progressChapterId
      }).then((data) => {
        if (!this.novelProcessData.progressPageNumber) {
          this.novelProcessData.progressPageNumber = 1;
        }
        this.prevChapterId = data[0] && data[0].id;
        this.currentChapterId = data[1] && data[1].id;
        this.nextChapterId = data[2] && data[2].id;
        var prevChapterPages = this.handleChapterPaging(data[0]);
        this.prevChapterPages = prevChapterPages;
        var currentChapterPages = this.handleChapterPaging(data[1]);
        this.currentChapterPages = currentChapterPages;
        var nextChapterPages = this.handleChapterPaging(data[2]);
        this.nextChapterPages = nextChapterPages;
        var currentPageIndex = this.novelProcessData.progressChapterPageIndex;
        this.readPageData = prevChapterPages.concat(
          currentChapterPages.slice(0, currentPageIndex)
        );
        this.unreadPageData = currentChapterPages
          .slice(currentPageIndex)
          .concat(nextChapterPages);
        this.dataItem1 = this.readPageData.pop() || null;
        this.dataItem2 = this.unreadPageData.shift();
        this.currentChapterPageData = this.dataItem2;
        this.dataItem3 = this.unreadPageData.shift() || null;
        this.hasPrev = !!this.dataItem1;
        this.hasNext = !!this.dataItem3;
        const pageMainEl = this.$refs.pageMain;
        pageMainEl.addEventListener('touchstart', this.handleTouchstart);
        pageMainEl.addEventListener('touchend', this.handleTouchend);
      });
    },
    getChapterData(chapterId) {
      if (chapterId) {
        return request({ url: '/chapterContent/byChapterId', method: 'get' })({
          chapterId: chapterId
        }).then((data) => {
          return this.handleChapterPaging(data);
        });
      } else {
        return Promise.resolve([]);
      }
    },
    updateNovelProcessData() {
      request({ url: '/novelData/update', method: 'post' })(
        Object.assign({}, this.novelProcessData, { progressTime: Date.now() })
      );
    },
    handlePageMainClick(e) {
      console.log(e);
    },
    handleTouchstart(touchEvent) {
      if (stopTouch) {
        return;
      }
      if (startTouch) {
        return;
      }
      startTouch = true;
      diffX = touchEvent.targetTouches[0].clientX;
      document.addEventListener('touchmove', this.handleTouchmove);
    },
    handleTouchmove(moveEvent) {
      if (stopTouch) {
        return;
      }
      moveX = moveEvent.targetTouches[0].clientX - diffX;
      if (!dragEl) {
        if (moveX > 0 && this.hasPrev) {
          dragEl = document.querySelector('.prev-page');
          dragElClass = 'prev-page';
        } else if (moveX < 0 && this.hasNext) {
          dragEl = document.querySelector('.next-page');
          dragElClass = 'next-page';
        }
      }
      if (dragEl) {
        if (left === null) {
          left = Number(
            getComputedStyle(dragEl).getPropertyValue('left').replace('px', '')
          );
        }
        let moveLeft = left + moveX;
        if (moveX > 0 && moveLeft >= 0) {
          moveLeft = 0;
        } else if (moveX < 0 && moveLeft <= 0) {
          moveLeft = 0;
        }
        dragEl.setAttribute('style', `left: ${moveLeft}px`);
      }
    },
    handleTouchend() {
      if (stopTouch) {
        return;
      }
      if (dragEl) {
        stopTouch = true;
        let moveLeft = left;
        const moveXSize = Math.abs(moveX);
        dragEl.classList.add('transition-left');
        if (moveXSize > 40) {
          moveLeft = 0;
        }
        dragEl.setAttribute('style', `left: ${moveLeft}px`);
        setTimeout(() => {
          dragEl.classList.remove('transition-left');
          if (moveXSize > 40) {
            dragEl.classList.remove(dragElClass);
            const currEl = document.querySelector('.current-page');
            currEl.classList.remove('current-page');
            if (moveX > 0) {
              const nextEl = document.querySelector('.next-page');
              nextEl.classList.remove('next-page');
              currEl.classList.add('next-page');
              nextEl.classList.add('prev-page');
              this.dataItemIndex--;
              var n = (this.dataItemIndex + 1) % 3;
              if (n <= 0) {
                n += 3;
              }
              var dataItemKey = 'dataItem' + n;
              this.changeDataItemKey = dataItemKey;
              if (this[dataItemKey]) {
                this.unreadPageData.unshift(this[dataItemKey]);
              }
              this[dataItemKey] = this.readPageData.pop();
              this.hasPrev = !!this[dataItemKey];
              this.hasNext = true;
              n = (n + 1) % 3;
              if (n === 0) {
                n = 3;
              }
              dataItemKey = 'dataItem' + n;
              this.currentChapterId =
                this[dataItemKey] && this[dataItemKey].chapterId;
              this.currentChapterPageData = this[dataItemKey];
              this.novelProcessData.progressPageNumber--;
              this.novelProcessData.progressChapterPageIndex--;
            } else if (moveX < 0) {
              const prevEl = document.querySelector('.prev-page');
              prevEl.classList.remove('prev-page');
              currEl.classList.add('prev-page');
              prevEl.classList.add('next-page');
              this.dataItemIndex++;
              var n = this.dataItemIndex % 3;
              if (n <= 0) {
                n += 3;
              }
              var dataItemKey = 'dataItem' + n;
              this.changeDataItemKey = dataItemKey;
              if (this[dataItemKey]) {
                this.readPageData.push(this[dataItemKey]);
              }
              this[dataItemKey] = this.unreadPageData.shift();
              this.hasNext = !!this[dataItemKey];
              this.hasPrev = true;
              n = (n - 1) % 3;
              if (n === 0) {
                n = 3;
              }
              dataItemKey = 'dataItem' + n;
              this.currentChapterId =
                this[dataItemKey] && this[dataItemKey].chapterId;
              this.currentChapterPageData = this[dataItemKey];
              this.novelProcessData.progressPageNumber++;
              this.novelProcessData.progressChapterPageIndex++;
            }
            dragEl.classList.add('current-page');
          }
          dragEl.setAttribute('style', ``);
          setTimeout(() => {
            stopTouch = false;
            startTouch = false;
          });
          diffX = 0;
          moveX = 0;
          left = null;
          dragElClass = null;
          dragEl = null;
        }, 300);
      } else {
        startTouch = false;
        diffX = 0;
        moveX = 0;
        left = null;
        dragElClass = null;
      }
      document.removeEventListener('touchmove', this.handleTouchmove);
    },
    handleChapterPaging(data) {
      if (!data) {
        return [];
      }
      var pages = [
        {
          chapterId: data.id,
          prevChapterId: data.preChapterId,
          nextChapterId: data.nextChapterId,
          name: data.name,
          content: []
        }
      ];
      var pageNo = 0;
      var pageLineNum = this.firstPageLineNum;
      var lineNum = 0;
      var self = this;
      function handleParagraph(text, flag) {
        var paragraphLineNum = self.computedParagraphLineNum(text, flag);
        if (lineNum + paragraphLineNum <= pageLineNum) {
          pages[pageNo].content.push({
            flag: flag,
            text: text
          });
          if (lineNum + paragraphLineNum == pageLineNum) {
            lineNum = 0;
            pageNo++;
            pages.push({
              chapterId: data.id,
              prevChapterId: data.preChapterId,
              nextChapterId: data.nextChapterId,
              content: []
            });
          } else {
            lineNum += paragraphLineNum;
          }
        } else {
          var diffLineNum = pageLineNum - lineNum;
          var subText = text.slice(
            0,
            diffLineNum * self.lineFontNum - (flag ? 2 : 0)
          );
          pages[pageNo].content.push({
            flag: flag,
            text: subText
          });
          lineNum = 0;
          pageNo++;
          pages.push({
            chapterId: data.id,
            prevChapterId: data.preChapterId,
            nextChapterId: data.nextChapterId,
            content: []
          });
          var newText = text.slice(
            diffLineNum * self.lineFontNum - (flag ? 2 : 0)
          );
          handleParagraph(newText, false);
        }
      }
      data.content.forEach((paragraph) => {
        if (pageNo) {
          pageLineNum = self.onePageLineNum;
        }
        handleParagraph(paragraph, true);
      });
      return pages;
    },
    computedParagraphLineNum(paragraph, flag) {
      if (!paragraph) {
        return 0;
      }
      var fontNum = paragraph.length;
      if (/\r$/.test(paragraph)) {
        fontNum -= 1;
      }
      return Math.ceil((fontNum + (flag ? 2 : 0)) / this.lineFontNum);
    }
  },
  watch: {
    currentChapterId(val) {
      this.novelProcessData.progressChapterId = val;
      if (val === this.nextChapterId) {
        if (this.prevChapterId) {
          this.readPageData = this.readPageData.filter(
            (item) => item.chapterId !== this.prevChapterId
          );
        }
        this.prevChapterId = this.currentChapterPageData.prevChapterId;
        this.nextChapterId = this.currentChapterPageData.nextChapterId;
        this.novelProcessData.progressChapterPageIndex = 0;
        this.prevChapterPages = this.currentChapterPages;
        this.currentChapterPages = this.nextChapterPages;
        this.getChapterData(this.nextChapterId).then((data) => {
          this.nextChapterPages = data;
          this.unreadPageData = this.unreadPageData.concat(data);
          if (this.changeDataItemKey && !this.hasNext) {
            this[this.changeDataItemKey] = this.unreadPageData.shift();
            this.hasNext = !!this[this.changeDataItemKey];
          }
        });
      } else if (val === this.prevChapterId) {
        if (this.nextChapterId) {
          this.unreadPageData = this.unreadPageData.filter(
            (item) => item.chapterId !== this.nextChapterId
          );
        }
        this.prevChapterId = this.currentChapterPageData.prevChapterId;
        this.nextChapterId = this.currentChapterPageData.nextChapterId;
        this.novelProcessData.progressChapterPageIndex =
          this.prevChapterPages.length - 1;
        this.nextChapterPages = this.currentChapterPages;
        this.currentChapterPages = this.prevChapterPages;
        this.getChapterData(this.prevChapterId).then((data) => {
          this.prevChapterPages = data;
          this.readPageData = data.concat(this.readPageData);
          if (this.changeDataItemKey && !this.hasPrev) {
            this[this.changeDataItemKey] = this.readPageData.pop();
            this.hasPrev = !!this[this.changeDataItemKey];
          }
        });
      }
    },
    novelProcessData: {
      handler(val) {
        console.log(JSON.stringify(val));
        this.updateNovelProcessData();
      },
      deep: true
    }
  }
});
