import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.join(__dirname, '../public/icon-template.svg');
const PUBLIC_PATH = path.join(__dirname, '../public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

async function generateIcons() {
  try {
    console.log('Starting icon generation...');
    
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    for (const { name, size } of sizes) {
      const outputPath = path.join(PUBLIC_PATH, name);
      
      if (name.endsWith('.ico')) {
        // For ICO files, generate multiple sizes (16x16, 32x32, 48x48)
        const icoSizes = [16, 32, 48];
        const icoBuffers = [];
        
        for (const icoSize of icoSizes) {
          const buffer = await sharp(svgBuffer)
            .resize(icoSize, icoSize)
            .png()
            .toBuffer();
          icoBuffers.push(buffer);
        }
        
        // Use the 32x32 version as the main favicon
        await sharp(svgBuffer)
          .resize(32, 32)
          .png()
          .toFile(outputPath);
      } else {
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);
      }
      
      console.log(`Generated: ${name} (${size}x${size})`);
    }
    
    console.log('Icon generation completed successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
