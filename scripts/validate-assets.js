import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');
const indexHtmlPath = path.join(rootDir, 'index.html');
const manifestPath = path.join(publicDir, 'manifest.json');

console.log('🔍 [KAOS Pre-Build Asset Validator] Checking asset integrity...');

let errorsCount = 0;
let verifiedCount = 0;

function assertFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing ${description}: ${filePath}`);
    errorsCount++;
    return false;
  }
  console.log(`  ✓ ${description} verified: ${path.relative(rootDir, filePath)}`);
  verifiedCount++;
  return true;
}

// 1. Validate Essential Public Directory Assets
const essentialPublicFiles = [
  'manifest.json',
  'favicon.svg',
  'app-icon.svg',
  'app-icon.png',
  'icon-192.png',
  'icon-192.svg',
  'icon-512.png',
  'icon-512.svg',
  'icon-maskable-512.png',
  'sw.js',
];

console.log('\n[1/4] Checking essential public files...');
essentialPublicFiles.forEach((file) => {
  const fullPath = path.join(publicDir, file);
  assertFileExists(fullPath, `Public asset (${file})`);
});

// 2. Validate index.html References
console.log('\n[2/4] Validating index.html references...');
if (assertFileExists(indexHtmlPath, 'index.html entry point')) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  const assetRegex = /(?:src|href)=["']([^"']+)["']/g;
  let match;

  while ((match = assetRegex.exec(indexHtml)) !== null) {
    const assetRef = match[1];
    if (
      assetRef.startsWith('http://') ||
      assetRef.startsWith('https://') ||
      assetRef.startsWith('data:') ||
      assetRef.startsWith('mailto:') ||
      assetRef === '#'
    ) {
      continue;
    }

    let cleanRef = assetRef.startsWith('/') ? assetRef.slice(1) : assetRef;
    if (cleanRef.startsWith('./')) {
      cleanRef = cleanRef.slice(2);
    }

    // Check if it exists in public/ or src/ or root
    const publicPath = path.join(publicDir, cleanRef);
    const rootPath = path.join(rootDir, cleanRef);

    if (fs.existsSync(publicPath)) {
      console.log(`  ✓ index.html asset resolved in public/: ${assetRef}`);
      verifiedCount++;
    } else if (fs.existsSync(rootPath)) {
      console.log(`  ✓ index.html asset resolved in root: ${assetRef}`);
      verifiedCount++;
    } else {
      console.error(`❌ index.html references missing file: ${assetRef} (looked in ${publicPath} and ${rootPath})`);
      errorsCount++;
    }
  }
}

// 3. Validate Web App Manifest Icons
console.log('\n[3/4] Validating Web App Manifest icons...');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (Array.isArray(manifest.icons)) {
      manifest.icons.forEach((icon) => {
        if (icon.src) {
          let cleanSrc = icon.src.startsWith('/') ? icon.src.slice(1) : icon.src;
          const iconPath = path.join(publicDir, cleanSrc);
          assertFileExists(iconPath, `Manifest icon (${icon.src})`);
        }
      });
    }
  } catch (err) {
    console.error(`❌ Error parsing manifest.json:`, err.message);
    errorsCount++;
  }
}

// 4. Validate Critical Data Seeds
console.log('\n[4/4] Validating data seeds and schemas...');
const criticalDataFiles = [
  path.join(srcDir, 'data', 'mcpSpots.json'),
  path.join(srcDir, 'data', 'kaosData.ts'),
  path.join(rootDir, 'metadata.json'),
  path.join(rootDir, 'firebase-blueprint.json'),
  path.join(rootDir, 'firestore.rules'),
];

criticalDataFiles.forEach((f) => {
  assertFileExists(f, `Data/Config file (${path.basename(f)})`);
});

// Final Result Summary
console.log('\n====================================================');
if (errorsCount > 0) {
  console.error(`❌ Pre-build Asset Validation FAILED with ${errorsCount} error(s).`);
  console.error('   Please ensure all referenced public/asset files exist.');
  console.log('====================================================\n');
  process.exit(1);
} else {
  console.log(`🎉 Pre-build Asset Validation PASSED! Verified ${verifiedCount} assets/files.`);
  console.log('====================================================\n');
  process.exit(0);
}
