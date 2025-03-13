const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};
const nums = require('../num.json');
function consoleNum(n) {
  const numList = String(n)
    .split('')
    .map((i) => Number(i));
  let numStrList = [];
  numList.forEach((m) => {
    if (numStrList.length) {
      for (var i = 0; i < numStrList.length; i++) {
        numStrList[i] += '   ' + nums[m][i];
      }
    } else {
      numStrList = nums[m].map((s) => `          ${s}`);
    }
  });
  numStrList.forEach((s) => {
    console.log(`${colors.red}${s}${colors.reset}`);
  });
}
consoleNum(12345);
console.log('\n');
consoleNum(67890);
