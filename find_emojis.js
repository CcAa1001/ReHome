const fs = require('fs');
const path = require('path');

function findEmojis(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findEmojis(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const emojiRegex = /\p{Emoji_Presentation}/gu;
      let match;
      const matches = new Set();
      while ((match = emojiRegex.exec(content)) !== null) {
        matches.add(match[0]);
      }
      if (matches.size > 0) {
        console.log(`Found emojis in ${fullPath}:`, Array.from(matches).join(', '));
      }
    }
  }
}

findEmojis('d:\\Desktop\\flutter\\TugasFigma');
