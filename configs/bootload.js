const fs = require("fs");
let configs = JSON.parse(fs.readFileSync('configs/configs.json', 'utf8'));
configs.main = {};
configs.main.welcome = JSON.parse(fs.readFileSync('configs/main/welcome.json', 'utf8'));
configs.main.welcome.message = fs.readFileSync('configs/messages/welcome.txt', 'utf8');


module.exports = configs;
