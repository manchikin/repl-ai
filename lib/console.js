const configs = require('../configs/bootload');


// console.logのラッパー関数
function debug(debugMessage) {

    if (configs.bot.mode.debug) console.log(debugMessage);
}

// console.logのラッパー関数
function info(infoMessage) {
    const formattedMessage = "◆◆◆◆◆◆" + infoMessage + "◆◆◆◆◆◆";
    if (configs.bot.mode.info) console.log(formattedMessage);
}

module.exports.debug = debug;
module.exports.info = info;
