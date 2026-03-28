const fs = require('fs');
['frontend/templates/jsTemplates.ts', 'frontend/templates/cppTemplates.ts'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\\\`/g, '\`');
  fs.writeFileSync(f, content);
});
