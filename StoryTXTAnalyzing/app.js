const vm = new Vue({
  el: '#app',
  data() {
    return {
      pageMainHeight: 0,
      pageMainWidth: 0,
      allChapterData: [],
      currentChapterIndex: 0,
      currentPageIndex: 0,
      name: '',
      size: 0,
      fontSizeList: [],
      fontSizeIndex: 5
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
    },
    prePages() {
      return [];
      return this.handleChapterPaging(
        this.allChapterData[this.currentChapterIndex - 1]
      );
    },
    currentPages() {
      return this.handleChapterPaging(
        this.allChapterData[this.currentChapterIndex]
      );
    },
    nextPages() {
      return [];
      return this.handleChapterPaging(
        this.allChapterData[this.currentChapterIndex + 1]
      );
    },
    activePages() {
      return [].concat(this.prePages, this.currentPages, this.nextPages);
    }
  },
  created() {
    for (var i = 12; i <= 40; i++) {
      this.fontSizeList.push({
        value: i,
        lineHeight: Math.floor(i * 1.5)
      });
    }
  },
  mounted() {
    this.pageMainHeight = this.$refs.pageMain.clientHeight - 40;
    this.pageMainWidth = this.$refs.pageMain.clientWidth - 20;
    var self = this;
    fetch('txtFileData.json')
      .then((res) => res.json())
      .then((jsonContent) => {
        self.allChapterData = jsonContent[0].chapterList;
        self.name = jsonContent.name;
        self.size = jsonContent.size;
      });
  },
  methods: {
    handleChapterPaging(data) {
      if (!data) {
        return [];
      }
      var pages = [
        {
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
            pages.push({ content: [] });
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
          pages.push({ content: [] });
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
  watch: {}
});
