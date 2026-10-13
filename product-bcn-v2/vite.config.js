import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import fs from 'fs'
import path from 'path'

function copyAssetsPlugin() {
  return {
    name: 'copy-bcn-assets',
    buildStart() {
      const srcBlack = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e70cb848-9b79-4dd1-87b6-17604e35fad3\\.user_uploaded\\media_1791444894912.jpg';
      const srcWhite = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e70cb848-9b79-4dd1-87b6-17604e35fad3\\.user_uploaded\\media_1791444903181.jpg';
      const targetDir = path.resolve(process.cwd(), 'public/images');
      const assetsDir = path.resolve(process.cwd(), 'src/assets');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      if (fs.existsSync(srcBlack)) {
        fs.copyFileSync(srcBlack, path.join(targetDir, 'bcn-black-sheet.jpg'));
        fs.copyFileSync(srcBlack, path.join(assetsDir, 'bcn-black-sheet.jpg'));
      }
      if (fs.existsSync(srcWhite)) {
        fs.copyFileSync(srcWhite, path.join(targetDir, 'bcn-white-sheet.jpg'));
        fs.copyFileSync(srcWhite, path.join(assetsDir, 'bcn-white-sheet.jpg'));
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
})
