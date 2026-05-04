const fs = require('fs');

const content = fs.readFileSync('src/app/admin/cardapio/page.tsx', 'utf8');
const lines = content.split('\n');

// Verificar se ha problema de chaves
let braceCount = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const prevChar = i > 0 ? content[i-1] : '';
  
  // Ignorar dentro de strings
  if (!inString && (char === '"' || char === "'" || char === '`')) {
    inString = true;
    stringChar = char;
  } else if (inString && char === stringChar && prevChar !== '\\') {
    inString = false;
  }
  
  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
}

console.log('Brace balance:', braceCount);
console.log('Total lines:', lines.length);

// Verificar se ha algum problema proximo da linha 586
for (let i = 580; i < 600 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i].substring(0, 80));
}
