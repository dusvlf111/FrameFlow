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
        // For ICO files, use PNG format but save as ICO
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath.replace('.ico', '.png'));
        
        // Rename to .ico
        const pngPath = outputPath.replace('.ico', '.png');
        if (fs.existsSync(pngPath)) {
          fs.renameSync(pngPath, outputPath);
        }
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
