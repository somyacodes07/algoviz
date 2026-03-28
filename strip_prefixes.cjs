const fs = require('fs');

['frontend/templates/jsTemplates.ts', 'frontend/templates/cppTemplates.ts'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/name:\s*'\[.*?\]\s*/g, "name: '");
  fs.writeFileSync(f, content);
});
