const spiderUtil = require('./main')
const spiderData = require('./failFiles.json') || []
spiderUtil({cover: true, spiderData})