import fs from 'fs';
import { initParser, parseCpp } from './backend/sandbox/transpiler/parser.js';
import { CppToJsTransformer } from './backend/sandbox/transpiler/transformer.js';
import { CPP_TEMPLATES } from './frontend/codeTemplates.js';

async function testAll() {
  await initParser('./public/web-tree-sitter.wasm');
  const transformer = new CppToJsTransformer();
  for (const t of CPP_TEMPLATES) {
    if (t.name.includes("Dijkstra") || t.name.includes("Merge") || t.name.includes("Knapsack")) {
        console.log("---- Testing: " + t.name + " ----");
        const tree = parseCpp(t.code);
        const { code } = transformer.transform(tree);
        console.log(code);
    }
  }
}
testAll();
