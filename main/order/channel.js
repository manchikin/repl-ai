const configs = require('../../configs/bootload');
const MessageManager = require('../../lib/message-manager');
const mm = new MessageManager();
const c = require('../../lib/console');
const DialogueManager = require('../../lib/dialogue-manager');
const dm = new DialogueManager();

class ChannelProcess
{
    constructor(executor)
    {
        this.executor = executor;
        this.db = this.executor.db;
    }
    execute(type, target)
    {
        switch(type) {
            case '+':
                c.log("チャンネル追加", "info");
                if (!target) {
                    this.executor.showHelp(); return;
                };
                this.addChannel(target);
                break;
            case '-':
                c.log("チャンネル削除", "info");
                if (!target) {
                    this.executor.showHelp(); return;
                }
                this.removeChannel(target);
                break;
            default:
                c.log("チャンネル一覧表示", "info");
                this.showChannel();
        }
    }

    addChannel(target)
    {
        c.log("追加対象チャンネルID：", target, "debug");
        if (!this.executor.client.channels.find('id', target)) {
            c.log("対象チャンネルがBOTのアクセス可能なチャンネルに存在しません", "info");
            this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + this._replaceMessage(configs.order.messages.channel.reject, target));
            return;
        };
        this.db.loadDatabase((err) =>{
            if (err) throw err;
            this.db.update({table: 'channels'}, {$addToSet: { availables: target}}, {upsert: true}, (err) => {
                if (err) throw err;
                const messageText = this._replaceMessage(configs.order.messages.channel.add, target);
                this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + messageText);
            });
        });
    }

    removeChannel(target)
    {
        this.db.loadDatabase((err) =>{
            if (err) throw err;
            this.db.update({table: 'channels'}, { $pull: {availables: {$in: [target]}}}, {}, (err) => {
                if (err) throw err;
                c.log("削除対象チャンネルID：", target, "debug");
                const messageText = this._replaceMessage(configs.order.messages.channel.remove, target);
                this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + messageText);
            });
        });

    }

    showChannel()
    {
        this.db.loadDatabase((err) =>{
            if (err) throw err;
            let messageText = configs.order.messages.channel.show + "\n```";
            this.db.find({table: 'channels'}, (err, channels) => {
                if (err) throw err;
                const channelIds = Object.keys(channels).length !== 0 ? channels[0].availables : false;
                if (!channelIds || Object.keys(channelIds).length === 0) {
                    c.log("受付中チャンネルなし", "debug");
                    this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + configs.order.messages.channel.none);
                    return;
                }
                c.log("受付中チャンネル：" + channelIds, "debug");
                channelIds.sort();
                messageText += "ID                  , name\n"
                Object.keys(channelIds).forEach((key) => {
                    const id = channelIds[key];
                    const paddedId = (id + '                    ').slice(0, 20);
                    c.log("チャンネルID" + id, "debug");
                    const name = this._getChannelName(this.executor.client.channels.find('id', id) || false);
                    c.log("チャンネル名：" + name, "debug");
                    messageText += `${paddedId}, ${name}\n`;
                });
                messageText = messageText + "```";
                c.log("表示予定テキスト：\n" + messageText, "debug");
                this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + messageText);
            });
        });
    }

    _getChannelName(channel)
    {
        if (!channel) return "--------------";
        if (!channel.parentID) return channel.name;
        const parentChannelName = this.executor.client.channels.find('id', channel.parentID).name;
        return parentChannelName + " # " + channel.name;
    }

    _replaceMessage(message, target)
    {
        return message.replace("###ID###", target);
    }
}

module.exports = ChannelProcess;
