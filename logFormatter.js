// usage node logFormatter.js [debug]

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
    db.find({}).sort({ dialogueCreated: 1 }).exec((err, docs) => {
        if (err) throw err;
        let output = "";
        if (mode==="debug") console.log(docs);
        Object.keys(docs).forEach((key) => {
            const doc = docs[key];
            output = output.concat(dateFormat(doc.dialogueCreated, "yyyy-mm-dd HH:MM:ss") + "\t" + doc.discordId + "\t" + doc.requestMessage + "\t" + doc.responseMessage + "\n");
        });
        if (mode==="debug") console.log(output);
        console.log("Outputting");
        writeFile('test.tsv', output);
        console.log("Finished");
    });
});
