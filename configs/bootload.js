const fs = require("fs");
const configs = JSON.parse(fs.readFileSync('configs/configs.json', 'utf8'));

module.exports = configs;
