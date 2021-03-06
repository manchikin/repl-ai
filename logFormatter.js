// usage node logFormatter.js [debug]

const iconv = require("iconv-lite");
const configs = require('./configs/bootload');
const Datastore = require('nedb');
const dateFormat = require("dateformat");

const writeFile = require('write');
const db = new Datastore({
    filename: configs.repl_ai.db.dialogue_log.path
});

const mode = process.argv[2] || "";
console.log(mode);
console.log("Loading DB");
db.loadDatabase((err) => {
    if (err) throw err;
    console.log("Finished Loading DB. Start Sorting...");
    db.find({}).sort({ dialogue_created: 1 }).exec((err, docs) => {
        if (err) throw err;
        let output = "日付\t時間\tdiscord id\tリクエスト\tレスポンス\n";
        if (mode==="debug") console.log(docs);
        Object.keys(docs).forEach((key) => {
            const doc = docs[key];
            output = output.concat(dateFormat(doc.dialogue_created, "yyyy-mm-dd") + "\t" + dateFormat(doc.dialogue_created, "HH:MM:ss") + "\t" + doc.discord_id + "\t" + doc.request_message + "\t" + doc.response_message + "\n");
        });
        if (mode==="debug") console.log(output);
        console.log("Converting character code to SJIS.");
        const encodedOutput = iconv.encode(output, "Shift_JIS");
        console.log("Outputting");
        writeFile('output/dialogue_log.tsv', encodedOutput);
        console.log("Finished");
    });
});
