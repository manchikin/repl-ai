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

    startUp(text)
    {
        const escaped_prefix = configs.bot.force_prefix.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
        const reg = new RegExp(`^\\s*<@${configs.bot.id}>\\s*${escaped_prefix}(.*)$`);
        const order = text.match(reg)[1].trim();
        console.log("order:", order);
        const [, command, type, target]  = order.match(/^(help|channel)?\s*(\+|-)?\s*(.*)?/i);
        console.log("command:", command);
        console.log("type:", type);
        console.log("target:", target);
        if (!command || command.toLowerCase() == "help") {
            this.showHelp(); return;
        }
        switch (command.toLowerCase()) {
            case "channel":
                this.channelProcess.execute(type, target);
                break;
            default:
            this.showHelp();
        };


    }

    showHelp()
    {
        console.log("showHelp");
        const helpMessage = fs.readFileSync('configs/order-help.txt', 'utf8');
        this.send("```" + helpMessage + "```");
    }

    send(message)
    {
        this.message.channel.send(message);
    }
}
module.exports = OrderExecutor;
