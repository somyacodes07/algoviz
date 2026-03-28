const fs = require('fs');
const content = fs.readFileSync('frontend/codeTemplates.ts', 'utf-8');
const jsMatches = content.match(/name:\s*['"](.*?)['"]/g);
console.log(jsMatches.length, "Templates total");
console.log(jsMatches.join('\n'));
