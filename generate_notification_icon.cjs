const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  try {
    const svgFile = path.join(__dirname, 'public', 'favicon.svg');
    let svgContent = fs.readFileSync(svgFile, 'utf8');
    
    // Android requires notification icons to be pure white silhouettes on transparent background
    svgContent = svgContent.replace(/fill="#ff6b2b"/g, 'fill="#ffffff"');
    const svgBuffer = Buffer.from(svgContent);

    await sharp(svgBuffer)
      .resize(96, 96)
      .png()
      .toFile(path.join(__dirname, 'public', 'notification-icon.png'));
      
    console.log('notification-icon.png created successfully!');
  } catch (err) {
    console.error('Error generating notification icon:', err);
  }
}

generate();
