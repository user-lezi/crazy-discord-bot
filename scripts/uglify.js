const fs = require("node:fs");
const UglifyJS = require("uglify-js");

const input = fs.readFileSync("bot.js", "utf8");

const result = UglifyJS.minify(input, {
  compress: {
    passes: 3,
    drop_console: false,
    unsafe: true,
    toplevel: true,
  },
  mangle: {
    toplevel: true,
  },
  output: {
    comments: false,
  },
});

if (result.error) {
  throw result.error;
}

fs.writeFileSync("bot.js", result.code);

let orignal = input.length / 1024,
  compressed = result.code.length / 1024;
console.log(
  `Compressed bot.js: ${orignal.toFixed(2)} KB → ${compressed.toFixed(2)} KB (${((100 * compressed) / orignal).toFixed(2)}%)`,
);
