const configs = require('../configs/bootload');
const MessageManager = require('../lib/message-manager');
const mm = new MessageManager();
const Datastore = require('nedb');
const c = require('../lib/console');
const dateFormat = require("dateformat");
const DialogueManager = require('../lib/dialogue-manager');
const dm = new DialogueManager();
const fs = require("fs");
const ChannelProcess = require('./order/channel');

const async = require("async");

class OrderExecutor
{
    constructor(message)
    {
        this.db = new Datastore({
            filename: configs.repl_ai.db.main.path
        });
        this.message = message;
        this.replyeeId = message.author.id;
        this.channelProcess = new ChannelProcess(this);
    }

    startUp(text, client)
    {
        this.client = client;
        c.log("命令受付", "info");
        const escaped_prefix = configs.bot.force_prefix.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
        const reg = new RegExp(`^\\s*<@${configs.credentials.discord_bot.id}>\\s*${escaped_prefix}(.*)$`);
        const order = text.match(reg)[1].trim();
        c.log(order, "debug");
        c.log("命令解析", "info");
        c.log("命令:"+ order, "debug");
        const [, command, type, target]  = order.match(/^(help|channel)?\s*(\+|-)?\s*(.*)?/i);
        c.log("command:" + command, "debug");
        c.log("type:" + type, "debug");
        c.log("target:" + target, "debug");
        if (!command || command.toLowerCase() == "help") {
            c.log("ヘルプ表示命令", "info");
            this.showHelp(); return;
        }
        switch (command.toLowerCase()) {
            case "channel":
                c.log("チャンネル操作命令", "info");
                this.channelProcess.execute(type, target);
                break;
            default:
            this.showHelp();
        };


    }

    showHelp()
    {
        c.log("ヘルプ表示実行", "info");
        const helpMessage = fs.readFileSync('configs/messages/order-help.txt', 'utf8');
        this.send("```" + helpMessage + "```");
    }

    send(message)
    {
        this.message.channel.send(message);
    }
}
module.exports = OrderExecutor;
