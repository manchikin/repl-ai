const dateFormat = require('dateformat');

function error_handler() {
    process.on('uncaughtException',  (code)=> {
        console.log('ERROR OCCURRED:');
        console.log(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"));
        console.log(code);
    });
}
module.exports.error_handler = error_handler;
