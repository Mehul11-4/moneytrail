import sharp from "sharp";
import fs from "fs";

// Wallet icon + "MoneyTrail" text, stacked
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#0A0A0F"/>
  <rect x="16" y="16" width="480" height="480" rx="80" fill="#10B981"/>

  <g transform="translate(156, 110)" stroke="#0A0A0F" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 36 C0 16.1 16.1 0 36 0 H164 C183.9 0 200 16.1 200 36 V150 C200 169.9 183.9 186 164 186 H36 C16.1 186 0 169.9 0 150 Z" />
    <path d="M200 76 H148 C129.2 76 114 91.2 114 110 C114 128.8 129.2 144 148 144 H200" fill="#0A0A0F" stroke="none"/>
    <circle cx="148" cy="110" r="12" fill="#10B981" stroke="none"/>
  </g>

  <text x="50%" y="88%" font-family="Arial, sans-serif" font-size="52" font-weight="bold"
    fill="#0A0A0F" text-anchor="middle">MoneyTrail</text>
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
