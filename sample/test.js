var remove_defender = require("../remove_defender");


var watcher = new remove_defender({
    sourcePath: "D:\\source",
    outputPath: "D:\\output",
    timeout: 10000,
    exts: ["txt", "jpg"],
    ifDefendUpdating:1
});

watcher.watch();

watcher
    .on("ready", (settings) => {
        console.log("ready!",settings)
    })
    .on("added", (xPath) => {
        console.log("added:",xPath)
    })
    .on("saved", (xPath) => {
        console.log("saved:",xPath)
    })
    .on("timeout", (xPath) => {
        console.log("timeout:",xPath)
    })
    .on("err", (err) => {
        console.log("err:",err)
    });


//watch.close()