
const configs = require('./configs/bootload');
const ReplAI = require('./repl-ai');
const replAi = new ReplAI(configs.repl_ai.x_api_key, configs.repl_ai.bot_id, configs.repl_ai.init_topic_id);
const Datastore = require('nedb');
const async = require("async");
const dateFormat = require("dateformat");


const args = process.argv.slice(2)
const appUserId = args[0];
const text      = args[1];
const now       = new Date();

replAi.createDialogue(
      appUserId
    , false
    , text
    , dateFormat(now, "yyyy-mm-dd HH:MM:ss")
    , (err, data) => {
        if (err) throw err;
        console.log(":> " + data.systemText.expression);
        process.exit(0);
    }
);
