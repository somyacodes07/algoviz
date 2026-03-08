import { transpileCppToJs } from './backend/sandbox/cppTranspiler.ts';
import { CPP_TEMPLATES } from './frontend/codeTemplates.ts';

const tpl = CPP_TEMPLATES[0].code;
console.log("=== ORIGINAL ===\n" + tpl);
console.log("=== TRANSPILED ===\n" + transpileCppToJs(tpl));
