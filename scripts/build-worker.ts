import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Ensure dist/client directory exists
const distClientDir = join(process.cwd(), "dist/client");
if (!existsSync(distClientDir)) {
  mkdirSync(distClientDir, { recursive: true });
  console.log("✓ Created dist/client directory");
}

// Ensure logo file is copied to dist/client after build
const logoSource = join(process.cwd(), "client/public/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png");
const logoDest = join(process.cwd(), "dist/client/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png");

if (existsSync(logoSource)) {
  copyFileSync(logoSource, logoDest);
  console.log("✓ Logo file copied to dist/client");
} else {
  console.warn("⚠ Logo file not found in client/public");
}

// Copy all other public files
const publicDir = join(process.cwd(), "client/public");
try {
  if (existsSync(publicDir)) {
    const publicFiles = readdirSync(publicDir);
    for (const file of publicFiles) {
      const sourcePath = join(publicDir, file);
      const destPath = join(distClientDir, file);
      if (statSync(sourcePath).isFile() && (!existsSync(destPath) || statSync(sourcePath).mtimeMs > statSync(destPath).mtimeMs)) {
        copyFileSync(sourcePath, destPath);
        console.log(`✓ Copied ${file} to dist/client`);
      }
    }
  }
} catch (error) {
  console.warn("⚠ Could not copy all public files:", error);
}

console.log("✓ Build worker script completed - Wrangler will handle worker bundling during deployment");
