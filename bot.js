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
        c.log("ログインしました", "info");
        c.log("ログイン時メッセージ表示", "info");
        client.channels.find('id', configs.main.channel_info.login.channel_id).send(mm.getLoginMessage());
    }

], function(err, results) {
    if (err) throw err;

});

client.on("guildMemberAdd", (member) => {
    c.log("ギルドメンバー追加", "info");
    console.log(member);
    client.channels.find('id', configs.main.channel_info.welcome.channel_id).send(mm.replyeeString(member.id) + "\n" + configs.main.message.welcome);
});

client.on("message", (message) => {
    async.waterfall([
        (callback) => {
            if (!mm.isSentTo(configs.credentials.discord_bot.id, message)) return;
            c.log("メッセージ受付", "info");
            if (mm.isOrder(message.content)) {
                const orderExecutor = new OE(message);
                orderExecutor.startUp(message.content, client);
                return;
            };
            c.log('受付中チャンネル？', "info")
            mm.isFromAvailableChannel(message.channel.id, callback)
        },
        (isFromAvailableChannel, callback) => {
            if (!isFromAvailableChannel) return;
            c.log("受付中チャンネルIDであることを確認", "info");
            if (configs.bot.use_old) docomoApiBot.startUp(message);
            if (!configs.bot.use_old) replAiBot.startUp(message);
        }
    ], (err) => {
        if (err) throw err;
    });
});

client.login(configs.credentials.discord_bot.token);



// システム中断時（Ctrl + C）の処理
if (configs.bot.logout_sigint) {
    process.on("SIGINT", () => {
        c.log("ログアウトします", "debug");
        client.destroy();
    });
}
