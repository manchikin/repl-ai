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
            if (!target) {
                this.executor.showHelp(); return;
            };
            this.addChannel(target);
            break;
            case '-':
            if (!target) {
                this.executor.showHelp(); return;
            }
            this.removeChannel(target);
            break;
            default:
            this.showChannel();
        }
    }

    addChannel(target)
    {
        this.db.loadDatabase((err) =>{
            if (err) throw err;
            this.db.update({table: 'channels'}, {$addToSet: { availables: target}}, {upsert: true}, (err) => {
                if (err) throw err;
                const messageText = configs.order.messages.channel.add.replace("###ID###", target);
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
                console.log(target);
                const messageText = configs.order.messages.channel.remove.replace("###ID###", target);
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
                const docs = channels[0].availables;
                console.log(docs);
                if (!docs || Object.keys(docs).length === 0) {
                    this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + configs.order.messages.channel.none);
                    return;
                }
                Object.keys(docs).forEach((key) => {
                    const doc = docs[key];
                    messageText = messageText + " " + doc+ "\n";
                });
                messageText = messageText + "```";
                console.log(messageText);
                this.executor.send(mm.replyeeString(this.executor.replyeeId) + " " + messageText);
            });
        });
    }
}

module.exports = ChannelProcess;
