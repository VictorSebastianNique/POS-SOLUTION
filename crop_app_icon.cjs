const sharp = require('sharp');
const fs = require('fs');

const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/uploaded_media_1782267983121.png';

async function generateAppIcon() {
  const info = await sharp(imgPath).metadata();
  
  // The Option 1 App Icon is at the bottom left.
  // It has a dark blue background and an orange outline.
  // Let's estimate its position.
  // In a 1024x559 image, the bottom left icon is likely around:
  // left: 28, top: 440, width: 85, height: 85
  
  const iconBuffer = await sharp(imgPath)
    .extract({ left: 28, top: 440, width: 85, height: 85 })
    .png()
    .toBuffer();

  // Create high-res versions for PWA
  await sharp(iconBuffer).resize(192, 192, { kernel: 'lanczos3' }).toFile('public/icon-192x192.png');
  await sharp(iconBuffer).resize(512, 512, { kernel: 'lanczos3' }).toFile('public/icon-512x512.png');
  await sharp(iconBuffer).resize(180, 180, { kernel: 'lanczos3' }).toFile('public/apple-touch-icon.png');

  // Embed the base64 PNG directly into favicon.svg so it always renders perfectly in browsers
  const base64Icon = iconBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 85" width="85" height="85">
    <rect width="85" height="85" rx="18" fill="#0f172a" />
    <image href="data:image/png;base64,${base64Icon}" width="85" height="85" />
  </svg>`;
  
  fs.writeFileSync('public/favicon.svg', svgContent);
  
  console.log("App Icon successfully generated and embedded into SVG!");
}

generateAppIcon();
