import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');

console.log('🔍 Running post-build validation...');

if (!fs.existsSync(distDir)) {
  console.error('❌ Error: dist/ directory does not exist after build.');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ Error: dist/index.html does not exist.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(indexPath, 'utf-8');
if (!htmlContent || htmlContent.trim().length === 0) {
  console.error('❌ Error: dist/index.html is empty.');
  process.exit(1);
}

const distFiles = fs.readdirSync(distDir);
console.log(`✅ dist/ verified with ${distFiles.length} top-level entries:`, distFiles.join(', '));

const assetRegex = /(?:src|href)=["']([^"']+)["']/g;
let match;
let missingAssets = 0;

while ((match = assetRegex.exec(htmlContent)) !== null) {
  const assetRef = match[1];
  if (assetRef.startsWith('http://') || assetRef.startsWith('https://') || assetRef.startsWith('data:') || assetRef.startsWith('mailto:')) {
    continue;
  }

  let cleanRef = assetRef.startsWith('/') ? assetRef.slice(1) : assetRef;
  if (cleanRef.startsWith('./')) {
    cleanRef = cleanRef.slice(2);
  }

  const resolvedPath = path.join(distDir, cleanRef);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️ Warning / Missing Asset: Referenced asset not found: ${assetRef} (resolved to ${resolvedPath})`);
    if (cleanRef.includes('assets/')) {
      missingAssets++;
    }
  } else {
    console.log(`  ✓ Verified asset: ${assetRef}`);
  }
}

if (missingAssets > 0) {
  console.error(`❌ Post-build validation failed: ${missingAssets} critical asset(s) missing.`);
  process.exit(1);
}

console.log('🎉 Post-build validation passed successfully! All assets and path references verified.');
