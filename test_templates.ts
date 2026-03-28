import fs from 'fs';
import { initParser, parseCpp } from './backend/sandbox/transpiler/parser';
import { CppToJsTransformer } from './backend/sandbox/transpiler/transformer';
import { CPP_TEMPLATES } from './frontend/codeTemplates';

async function testAll() {
  const wasmCachePath = './public/web-tree-sitter.wasm';
  await initParser(wasmCachePath);

  let passed = 0;
  let failed = 0;

  for (const template of CPP_TEMPLATES) {
    if (template.language !== 'c++') continue;

    console.log(`\nTesting: \${template.name}`);
    try {
      const tree = parseCpp(template.code);
      const transformer = new CppToJsTransformer();
      const { code, warnings } = transformer.transform(tree);

      if (warnings.length > 0) {
        console.log(`  ❌ FAILED: \${warnings.length} Warnings`);
        warnings.forEach(w => console.log(`    - \${w}`));
        failed++;
      } else if (!code || code.trim() === '') {
        console.log(`  ❌ FAILED: Empty output code!`);
        failed++;
      } else {
        console.log(`  ✅ PASSED`);
        passed++;
      }
    } catch (e) {
      console.log(`  ❌ CRASH: \${e}`);
      failed++;
    }
  }

  console.log(`\nResults: \${passed} passed, \${failed} failed.`);
}

testAll();
