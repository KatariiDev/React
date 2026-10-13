const fs = require('fs');
const path = require('path');

const srcBlack = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e70cb848-9b79-4dd1-87b6-17604e35fad3\\.user_uploaded\\media_1791444894912.jpg';
const srcWhite = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e70cb848-9b79-4dd1-87b6-17604e35fad3\\.user_uploaded\\media_1791444903181.jpg';

const targetDir = 'c:\\Users\\ADMIN\\Desktop\\React\\product-bcn-v2\\public\\images';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(srcBlack, path.join(targetDir, 'bcn-black-sheet.jpg'));
fs.copyFileSync(srcWhite, path.join(targetDir, 'bcn-white-sheet.jpg'));
console.log('Images successfully copied to public/images');
