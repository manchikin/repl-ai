const configs = require('./configs/bootload');
const Discord = require("discord.js");
const client = new Discord.Client();
const async = require("async");
const c = require('./lib/console');
const mm = require('./lib/message-manager');
const err = require('./lib/error-handler');

err.error_handler();

// ログイン準備
async.series([
    function (callback) {
        client.on("ready", callback);
    },
    function (callback) {
        c.info("ログインしました");
    }

], function(err, results) {
    if (err) throw err;

});

if (configs.bot.use_old) {
    require('./main/docomo-api-bot').startUp(client);
}

if (!configs.bot.use_old) {
    require('./main/repl-ai-bot').startUp(client);
}

client.login(configs.bot.token);



// システム中断時（Ctrl + C）の処理
if (configs.bot.logout_sigint) {
    process.on("SIGINT", () => {
        c.debug("ログアウトします");
        client.destroy();
    });
}
