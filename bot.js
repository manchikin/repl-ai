const configs = require('./configs/bootload');
const Discord = require("discord.js");
const client = new Discord.Client();
const async = require("async");
const c = require('./lib/console');
const MessageManager = require('./lib/message-manager');
const mm = new MessageManager();
const err = require('./lib/error-handler');
const docomoApiBot = require('./main/docomo-api-bot');
const replAiBot = require('./main/repl-ai-bot');
const OE = require('./main/order-executor');

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

client.on("message", (message) => {
    async.waterfall([
        (callback) => {
            if (!mm.isSentTo(configs.bot.id, message)) return;
            if (mm.isOrder(message.content)) {
                const orderExecutor = new OE(message);
                orderExecutor.startUp(message.content);
                return;
            };
            mm.isFromAvailableChannel(message.channel.id, callback)
        },
        (isFromAvailableChannel, callback) => {
            if (!isFromAvailableChannel) return;
            if (configs.bot.use_old) docomoApiBot.startUp(message);
            if (!configs.bot.use_old) replAiBot.startUp(message);
        }
    ], (err) => {
        if (err) throw err;
    });
});

client.login(configs.bot.token);



// システム中断時（Ctrl + C）の処理
if (configs.bot.logout_sigint) {
    process.on("SIGINT", () => {
        c.debug("ログアウトします");
        client.destroy();
    });
}
