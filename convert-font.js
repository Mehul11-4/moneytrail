import fs from "fs";

const fontFile = fs.readFileSync("./NotoSansDevanagari-Regular.ttf");
const base64 = fontFile.toString("base64");

const output = `export const notoSansDevanagariBase64 = "${base64}"\n`;
fs.writeFileSync("./src/utils/notoSansDevanagariFont.js", output);

console.log(
  "Font converted successfully to src/utils/notoSansDevanagariFont.js",
);
