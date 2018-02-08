const configs = require('../configs/bootload');


// console.logのラッパー関数
function log(message, mode) {
    switch (mode.toLowerCase()) {
        case "debug":
            if (configs.bot.mode.debug) console.log(message);
            break;
        case "info":
            const formattedMessage = "◆◆◆◆◆◆" + message + "◆◆◆◆◆◆";
            if (configs.bot.mode.info) console.log(formattedMessage);
            break;
        default:
            console.log(`invalid log mode: ${mode}`);
    }
}



module.exports.log = log;
