const sharp = require('sharp');

const imgPath = 'C:/Users/andre/.gemini/antigravity/brain/08718765-2e56-43a5-93fe-b20dc7816c18/media__1782271561052.jpg';

sharp(imgPath)
  .metadata()
  .then(function(metadata) {
    console.log(metadata);
  });
