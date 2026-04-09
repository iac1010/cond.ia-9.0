import fs from 'fs';
const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/aspect-square/g, '');
content = content.replace(/aspect-\[2\/1\]/g, '');
fs.writeFileSync(path, content);
