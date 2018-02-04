const fs = require("fs");
let configs = JSON.parse(fs.readFileSync('configs/configs.json', 'utf8'));
configs.main = {};
configs.main.channel_info = JSON.parse(fs.readFileSync('configs/main/channel_info.json', 'utf8'));
configs.main.message = {};
configs.main.message.welcome = fs.readFileSync('configs/messages/welcome.txt', 'utf8');
configs.main.message.login = JSON.parse(fs.readFileSync('configs/messages/login.json', 'utf8')).messages;


module.exports = configs;
