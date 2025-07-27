import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.join(__dirname, '../public/icon-template.svg');
const PUBLIC_PATH = path.join(__dirname, '../public');

async function fixFavicon() {
  try {
    console.log('Fixing favicon...');
    
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    // Generate multiple favicon sizes
    const faviconSizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'favicon.ico', size: 32 }
    ];
    
    for (const { name, size } of faviconSizes) {
      const outputPath = path.join(PUBLIC_PATH, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: ${name} (${size}x${size})`);
    }
    
    console.log('Favicon fix completed!');
  } catch (error) {
    console.error('Error fixing favicon:', error);
  }
}

fixFavicon();
