import sharp from "sharp";
import fs from "fs";

const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#0A0A0F"/>
  <rect x="16" y="16" width="480" height="480" rx="80" fill="#10B981"/>
  <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="200" font-weight="bold"
    fill="#0A0A0F" text-anchor="middle">MT</text>
</svg>
`;

if (!fs.existsSync("public/icons")) {
  fs.mkdirSync("public/icons", { recursive: true });
}

sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile("public/icons/icon-192x192.png")
  .then(() => console.log("Created icon-192x192.png"));

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-512x512.png")
  .then(() => console.log("Created icon-512x512.png"));
