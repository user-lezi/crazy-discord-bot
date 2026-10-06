const AdmZip = require("adm-zip");

const fs = require("fs");
fs.rmSync("bot.zip", { force: true });

const zip = new AdmZip();
zip.addLocalFile("bot.js");
zip.addLocalFile("package.json");
zip.addLocalFile("README.md");
zip.addLocalFile(".env.example");
zip.addLocalFolder("assets", "assets");
zip.writeZip("bot.zip");
console.log("Created bot.zip");
