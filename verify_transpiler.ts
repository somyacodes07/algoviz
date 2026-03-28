import { initParser, parseCpp } from './backend/sandbox/transpiler/parser';
import { CppToJsTransformer } from './backend/sandbox/transpiler/transformer';
import { CPP_TEMPLATES } from './frontend/codeTemplates';

async function verify() {
  await initParser('./public/web-tree-sitter.wasm');
  const transformer = new CppToJsTransformer();
  for (const t of CPP_TEMPLATES) {
    if (t.name.includes("Dijkstra") || t.name.includes("Merge") || t.name.includes("Knapsack") || t.name.includes("Frequency")) {
        console.log("---- Testing: " + t.name + " ----");
        const tree = parseCpp(t.code);
        const { code } = transformer.transform(tree);
        console.log(code);
    }
  }
}
verify();
