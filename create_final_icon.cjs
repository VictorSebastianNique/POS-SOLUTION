const sharp = require('sharp');
const fs = require('fs');

const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/media__1782271561052.jpg';

async function generateFinalIcon() {
  // Read the original image and strip metadata to avoid ICC profile issues on Windows Desktop Shortcuts
  const iconBuffer = await sharp(imgPath).withMetadata(false).toColorspace('srgb').toBuffer();

  // Create high-res versions for PWA. Force PNG format without alpha if not needed, or just plain RGB.
  await sharp(iconBuffer).resize(192, 192, { kernel: 'lanczos3' }).png({ force: true, palette: false }).toFile('public/icon-192x192.png');
  await sharp(iconBuffer).resize(512, 512, { kernel: 'lanczos3' }).png({ force: true, palette: false }).toFile('public/icon-512x512.png');
  await sharp(iconBuffer).resize(180, 180, { kernel: 'lanczos3' }).png({ force: true, palette: false }).toFile('public/apple-touch-icon.png');

  // Embed a smaller base64 PNG directly into favicon.svg so it renders perfectly
  const smallIconBuffer = await sharp(iconBuffer).resize(256, 256, { kernel: 'lanczos3' }).png({ force: true }).toBuffer();
  const base64Icon = smallIconBuffer.toString('base64');
  
  // Create an SVG that acts as a container for the image
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <image href="data:image/png;base64,${base64Icon}" width="256" height="256" />
  </svg>`;
  
  fs.writeFileSync('public/favicon.svg', svgContent);
  
  console.log("FINAL ICONS GENERATED SUCCESSFULLY WITH NO METADATA!");
}

generateFinalIcon();
