// backend/sandbox/legacy/regexTranspiler.ts
function findMatchingBrace(code, openIndex) {
  let depth = 0;
  let inString = false;
  let inChar = false;
  let stringChar = "";
  for (let i = openIndex; i < code.length; i++) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : "";
    if (!inChar && ch === '"' && prev !== "\\") {
      inString = !inString;
      continue;
    }
    if (!inString && ch === "'" && prev !== "\\") {
      inChar = !inChar;
      continue;
    }
    if (inString || inChar) continue;
    if (ch === "/" && i + 1 < code.length && code[i + 1] === "/") {
      const eol = code.indexOf("\n", i);
      if (eol === -1) return -1;
      i = eol;
      continue;
    }
    if (ch === "/" && i + 1 < code.length && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function parseCoutArgs(argsStr) {
  const parts = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === "(") parenDepth++;
    if (ch === ")") parenDepth--;
    if (parenDepth === 0 && ch === "<" && i + 1 < argsStr.length && argsStr[i + 1] === "<") {
      const trimmed2 = current.trim();
      if (trimmed2) parts.push(trimmed2);
      current = "";
      i++;
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  const filtered = parts.filter((p) => {
    const clean = p.trim().replace(/std::/g, "");
    return clean !== "endl" && clean !== "fixed" && !clean.startsWith("setw") && !clean.startsWith("setprecision");
  });
  return filtered.join(", ");
}
function transpileCppToJs(cppCode) {
  let js = cppCode;
  const queueVars = /* @__PURE__ */ new Set();
  const priorityQueueVars = /* @__PURE__ */ new Map();
  let usesMergeHelper = false;
  const preserveLines = (match2, replacer = "") => {
    const newlines = (match2.match(/\n/g) || []).length;
    return replacer + "\n".repeat(newlines);
  };
  js = js.replace(/#include\s*<[^>]*>/g, (m) => preserveLines(m, "// include placeholder"));
  js = js.replace(/#include\s*"[^"]*"/g, (m) => preserveLines(m, "// include placeholder"));
  js = js.replace(/#define\s+(\w+)\s+(.+)/g, "const $1 = $2;");
  js = js.replace(/using\s+namespace\s+std\s*;/g, (m) => preserveLines(m, "// namespace placeholder"));
  js = js.replace(/typedef\s+[\w\s]+\s+(\w+)\s*;/g, (m) => preserveLines(m, "// typedef placeholder"));
  js = js.replace(/using\s+\w+\s*=\s*[^;]+;/g, (m) => preserveLines(m, "// using alias placeholder"));
  const functionBodies = [];
  let mainBody = "";
  const funcRegex = /(?:^|\n)(\s*)(?:(?:(?:inline|constexpr|static|virtual)\s+)?(?:void|int|float|double|string|bool|char|long|auto|long\s+long|unsigned\s+int|short)\s+)(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  const processedCode = js;
  const functions = [];
  funcRegex.lastIndex = 0;
  while ((match = funcRegex.exec(processedCode)) !== null) {
    const indent = match[1];
    const funcName = match[2];
    const params = match[3];
    const openBraceIndex = processedCode.indexOf("{", match.index + match[0].length - 1);
    if (openBraceIndex === -1) continue;
    const closeBraceIndex = findMatchingBrace(processedCode, openBraceIndex);
    if (closeBraceIndex === -1) continue;
    const body = processedCode.substring(openBraceIndex + 1, closeBraceIndex);
    const fullMatch = processedCode.substring(match.index, closeBraceIndex + 1);
    functions.push({
      name: funcName,
      params,
      body,
      fullMatch,
      startIndex: match.index,
      openBraceIndex,
      closeBraceIndex,
      indent
    });
  }
  functions.sort((a, b) => b.startIndex - a.startIndex);
  for (const func of functions) {
    const { name, params, startIndex, openBraceIndex, closeBraceIndex, indent } = func;
    if (name === "main") {
      const beforeSig = js.substring(0, startIndex);
      const insideBody = js.substring(openBraceIndex + 1, closeBraceIndex);
      const afterBody = js.substring(closeBraceIndex + 1);
      const modifiedBody = insideBody.replace(/return\s+0\s*;/g, "// return 0;");
      js = beforeSig + "\n/* main body */\n" + modifiedBody + "\n/* end main */\n" + afterBody;
    } else {
      const jsParams = params.split(",").map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const parts = trimmed.replace(/&/g, "").trim().split(/\s+/);
        let name2 = parts[parts.length - 1];
        return name2.replace(/\s*\[.*\]\s*/g, "");
      }).filter(Boolean).join(", ");
      const beforeSig = js.substring(0, startIndex);
      const signature = js.substring(startIndex, openBraceIndex + 1);
      const afterSig = js.substring(openBraceIndex + 1);
      const sigNewlines = (signature.match(/\n/g) || []).join("");
      const jsSignature = `${sigNewlines}${indent}function ${name}(${jsParams}) {`;
      js = beforeSig + jsSignature + afterSig;
    }
  }
  js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
    const converted = init.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name} = [${converted}];`;
  });
  js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
    const converted = init.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name} = [${converted}];`;
  });
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^,]+),\s*([^)]+)\)\s*;/g, "let $1 = Array($2).fill($3);");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^)]+)\)\s*;/g, "let $1 = Array($2).fill(0);");
  js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = new Map();");
  js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, (_, name, init) => {
    const converted = init.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name} = new Map([${converted}]);`;
  });
  js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = new Set();");
  js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, "let $1 = new Set([$2]);");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, "let $1 = [$2];");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*\(([^)]*)\)\s*;/g, "let $1 = [$2];");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [0, 0];");
  js = js.replace(/(?:std::)?make_pair\s*\(([^,]+),\s*([^)]+)\)/g, "[$1, $2]");
  js = js.replace(/(?:std::)?stack\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?queue\s*<[^>]+>\s+(\w+)\s*;/g, (_, name) => {
    queueVars.add(name);
    return `let ${name} = [];`;
  });
  js = js.replace(/(?:std::)?priority_queue\s*<([^;]+)>\s+(\w+)\s*;/g, (_, typeSpec, name) => {
    const normalizedType = String(typeSpec).replace(/std::/g, "");
    priorityQueueVars.set(name, /(?:^|[<,\s])greater(?:\s*<|$)/.test(normalizedType));
    return `let ${name} = [];`;
  });
  js = js.replace(/for\s*\(\s*(?:const\s+)?(?:auto|int|float|double|string|char|long|long\s+long|unsigned\s+int|short|bool)\s*&?\s+(\w+)\s*:\s*/g, "for (let $1 of ");
  js = js.replace(/\b(int|long\s+long|long|short|unsigned\s+int)\s+(\w+)\s*=\s*([^;{]+?)\s*;/g, (match2, type, varName, expr) => {
    if (expr.includes('"') || expr.includes("'") || expr.includes("[")) return `let ${varName} = ${expr};`;
    return `let ${varName} = Math.trunc(${expr});`;
  });
  js = js.replace(/(\w+(?:\[[^\]]*\])?)\s*\/\=\s*([^;]+);/g, "$1 = Math.trunc($1 / ($2));");
  js = js.replace(/^(\s*)(\w+)\s*=\s*([^;]*\/[^;]+);/gm, (match2, space, varName, expr) => {
    if (expr.includes("Math.") || expr.includes(".0")) return match2;
    return `${space}${varName} = Math.trunc(${expr});`;
  });
  js = js.replace(/\bconst\s+(?:int|float|double|string|bool|char|auto|long|short|long\s+long|unsigned\s+int)\s+/g, "const ");
  const types = [
    "long\\s+long",
    "unsigned\\s+int",
    "int",
    "float",
    "double",
    "string",
    "bool",
    "char",
    "auto",
    "long",
    "short"
  ];
  const typeRegex = new RegExp(`\\b(${types.join("|")})\\s+`, "g");
  js = js.replace(typeRegex, "let ");
  js = js.replace(
    /let\s+(\w+)\[(\d+)\]\[(\d+)\]\s*;/g,
    "let $1 = Array($2).fill(null).map(() => Array($3).fill(0));"
  );
  js = js.replace(/let\s+(\w+)\[\d+\]\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
    const converted = init.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name} = [${converted}];`;
  });
  js = js.replace(/let\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
    return `let ${name} = [${init.replace(/\{/g, "[").replace(/\}/g, "]")}];`;
  });
  js = js.replace(/let\s+(\w+)\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
    return `let ${name} = [${init.replace(/\{/g, "[").replace(/\}/g, "]")}];`;
  });
  js = js.replace(/let\s+(\w+)\[(\d+)\]\s*;/g, "let $1 = Array($2).fill(0);");
  js = js.replace(/(?:std::)?cout\s*<<\s*(.*?);/gs, (_, args) => {
    const parsed = parseCoutArgs(args);
    if (!parsed) return "// empty cout";
    return `console.log(${parsed});`;
  });
  js = js.replace(/(?:std::)?cerr\s*<<\s*(.*?);/gs, (_, args) => {
    const parsed = parseCoutArgs(args);
    if (!parsed) return "// empty cerr";
    return `console.error(${parsed});`;
  });
  js = js.replace(/(?:std::)?cin\s*>>\s*(.*?);/gs, (_, args) => {
    const vars = args.split(">>").map((v) => v.trim()).filter(Boolean);
    return vars.map((v) => `${v} = __tracer.input();`).join(" ");
  });
  js = js.replace(/printf\s*\(\s*"([^"]*)"(?:\s*,\s*([^)]*))?\)\s*;/g, (_, fmt, args) => {
    if (args) {
      return `console.log(${args.trim()});`;
    }
    return `console.log("${fmt}");`;
  });
  js = js.replace(/scanf\s*\([^)]*\)\s*;/g, "// scanf not supported in visualizer");
  js = js.replace(/\.push_back\s*\(/g, ".push(");
  js = js.replace(/\.pop_back\s*\(\s*\)/g, ".pop()");
  js = js.replace(/\.emplace_back\s*\(/g, ".push(");
  js = js.replace(/\.size\s*\(\s*\)/g, ".length");
  js = js.replace(/\.length\s*\(\s*\)/g, ".length");
  js = js.replace(/(\w+)\.empty\s*\(\s*\)/g, "($1.length === 0)");
  js = js.replace(/\.front\s*\(\s*\)/g, "[0]");
  js = js.replace(/\.back\s*\(\s*\)/g, "[this.length - 1]");
  js = js.replace(/(\w+)\[this\.length - 1\]/g, "$1[$1.length - 1]");
  js = js.replace(/\.clear\s*\(\s*\)/g, ".length = 0");
  js = js.replace(/\.erase\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*\)/g, ".shift()");
  js = js.replace(/\.insert\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*/g, ".unshift(");
  js = js.replace(/(\w+)\.count\s*\(([^)]+)\)/g, "($1.has ? ($1.has($2) ? 1 : 0) : ($2 in $1 ? 1 : 0))");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*!=\s*\1\.end\s*\(\s*\)/g, "$1.has($2)");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*==\s*\1\.end\s*\(\s*\)/g, "!$1.has($2)");
  js = js.replace(/\.insert\s*\((?!(\w+)\.begin)/g, ".add(");
  js = js.replace(/(\w+)\.top\s*\(\s*\)/g, "$1[$1.length - 1]");
  queueVars.forEach((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    js = js.replace(new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"), `${name}.shift()`);
  });
  priorityQueueVars.forEach((isMinQueue, name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    js = js.replace(new RegExp(`\\b${escaped}\\.push\\s*\\(([^()]*(?:\\([^)]*\\)[^()]*)*)\\)`, "g"), `__cppPriorityQueuePush(${name}, $1, ${isMinQueue})`);
    js = js.replace(new RegExp(`\\b${escaped}\\.top\\s*\\(\\s*\\)`, "g"), `__cppPriorityQueueTop(${name}, ${isMinQueue})`);
    js = js.replace(new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"), `__cppPriorityQueuePop(${name}, ${isMinQueue})`);
  });
  js = js.replace(/\.first\b/g, "[0]");
  js = js.replace(/\.second\b/g, "[1]");
  js = js.replace(/(\w+)\.substr\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "$1.substring($2, $2 + $3)");
  js = js.replace(/\.substr\s*\(/g, ".substring(");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)(?!\s*[!=]=)/g, "$1.indexOf($2)");
  js = js.replace(/(?:std::)?string::npos/g, "-1");
  js = js.replace(/to_string\s*\(/g, "String(");
  js = js.replace(/stoi\s*\(/g, "parseInt(");
  js = js.replace(/sto[fd]\s*\(/g, "parseFloat(");
  js = js.replace(/getline\s*\(\s*(?:std::)?cin\s*,\s*(\w+)\s*\)/g, "$1 = __tracer.input()");
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "$1.sort((a, b) => a - b)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(?:std::)?greater\s*<[^>]*>\s*\(\s*\)\s*\)/g,
    "$1.sort((a, b) => b - a)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(\w+)\s*\)/g,
    "$1.sort($2)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\s*,\s*\1\s*\+\s*(\w+)\s*\)/g,
    "$1.sort((a, b) => a - b)"
  );
  js = js.replace(
    /(?:std::)?reverse\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "$1.reverse()"
  );
  js = js.replace(
    /(?:std::)?merge\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\2\.end\s*\(\s*\)\s*,\s*(\w+)\.begin\s*\(\s*\)\s*\)/g,
    (_, left, right, out) => {
      usesMergeHelper = true;
      return `${out}.splice(0, ${out}.length, ...__cppMergeSortedArrays(${left}, ${right}))`;
    }
  );
  js = js.replace(
    /(?:std::)?swap\s*\(\s*(\w+(?:\[[^\]]*\])?)\s*,\s*(\w+(?:\[[^\]]*\])?)\s*\)\s*;/g,
    "[$1, $2] = [$2, $1];"
  );
  js = js.replace(
    /(?:std::)?find\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.indexOf($2)"
  );
  js = js.replace(
    /(?:std::)?accumulate\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.reduce((a, b) => a + b, $2)"
  );
  js = js.replace(
    /\*\s*(?:std::)?min_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "Math.min(...$1)"
  );
  js = js.replace(
    /\*\s*(?:std::)?max_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "Math.max(...$1)"
  );
  js = js.replace(
    /(?:std::)?fill\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.fill($2)"
  );
  js = js.replace(
    /(?:std::)?count\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.filter(x => x === $2).length"
  );
  js = js.replace(/(?:std::)?min\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "Math.min($1, $2)");
  js = js.replace(/(?:std::)?max\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "Math.max($1, $2)");
  js = js.replace(/(?<!\.)(?:\b)abs\s*\(/g, "Math.abs(");
  js = js.replace(/(?<!\.)(?:\b)pow\s*\(/g, "Math.pow(");
  js = js.replace(/(?<!\.)(?:\b)exp\s*\(/g, "Math.exp(");
  js = js.replace(/(?<!\.)(?:\b)sqrt\s*\(/g, "Math.sqrt(");
  js = js.replace(/(?<!\.)(?:\b)ceil\s*\(/g, "Math.ceil(");
  js = js.replace(/(?<!\.)(?:\b)floor\s*\(/g, "Math.floor(");
  js = js.replace(/(?<!\.)(?:\b)log\s*\(/g, "Math.log(");
  js = js.replace(/(?<!\.)(?:\b)log2\s*\(/g, "Math.log2(");
  js = js.replace(/(?<!\.)(?:\b)log10\s*\(/g, "Math.log10(");
  js = js.replace(/\bround\s*\(/g, "Math.round(");
  js = js.replace(/\bsizeof\s*\(([^)]+)\)/g, (_, arg) => {
    const typeArg = arg.trim();
    if (["int", "long", "float", "double", "char", "bool"].includes(typeArg)) return "1";
    return `(${typeArg}.length || 1)`;
  });
  js = js.replace(/\bINT_MAX\b/g, "Number.MAX_SAFE_INTEGER");
  js = js.replace(/\bINT_MIN\b/g, "Number.MIN_SAFE_INTEGER");
  js = js.replace(/\bLLONG_MAX\b/g, "Number.MAX_SAFE_INTEGER");
  js = js.replace(/\bLLONG_MIN\b/g, "Number.MIN_SAFE_INTEGER");
  js = js.replace(/\bnullptr\b/g, "null");
  js = js.replace(/\bNULL\b/g, "null");
  js = js.replace(/\btrue\b/g, "true");
  js = js.replace(/\bfalse\b/g, "false");
  js = js.replace(/std::/g, "");
  js = js.replace(/\blet\s+&(\w+)/g, "let $1");
  js = js.replace(/\bconst\s+&(\w+)/g, "const $1");
  js = js.replace(/\n{3,}/g, "\n\n");
  js = js.trim();
  const helperBlocks = [];
  if (usesMergeHelper) {
    helperBlocks.push(`
function __cppMergeSortedArrays(left, right, comparator) {
    const merged = [];
    let leftIndex = 0;
    let rightIndex = 0;
    const compare = comparator || ((a, b) => a <= b);

    while (leftIndex < left.length && rightIndex < right.length) {
        if (compare(left[leftIndex], right[rightIndex])) {
            merged.push(left[leftIndex++]);
        } else {
            merged.push(right[rightIndex++]);
        }
    }

    while (leftIndex < left.length) merged.push(left[leftIndex++]);
    while (rightIndex < right.length) merged.push(right[rightIndex++]);

    return merged;
}`.trim());
  }
  if (priorityQueueVars.size > 0) {
    helperBlocks.push(`
function __cppComparePriorityQueueValues(left, right) {
    if (Array.isArray(left) && Array.isArray(right)) {
        const length = Math.max(left.length, right.length);
        for (let index = 0; index < length; index++) {
            const leftValue = left[index];
            const rightValue = right[index];
            if (leftValue === rightValue) continue;
            if (leftValue === undefined) return -1;
            if (rightValue === undefined) return 1;
            return leftValue < rightValue ? -1 : 1;
        }
        return 0;
    }

    if (left === right) return 0;
    return left < right ? -1 : 1;
}

function __cppPriorityQueuePush(queue, value, isMinQueue) {
    queue.push(value);
    queue.sort((left, right) => {
        const comparison = __cppComparePriorityQueueValues(left, right);
        return isMinQueue ? comparison : -comparison;
    });
    return queue.length;
}

function __cppPriorityQueueTop(queue, isMinQueue) {
    if (queue.length === 0) return undefined;
    return isMinQueue ? queue[0] : queue[queue.length - 1];
}

function __cppPriorityQueuePop(queue, isMinQueue) {
    if (queue.length === 0) return undefined;
    return isMinQueue ? queue.shift() : queue.pop();
}`.trim());
  }
  if (helperBlocks.length > 0) {
    js = `${helperBlocks.join("\n\n")}

${js}`.trim();
  }
  return js;
}

// test_regex.ts
var snippet3 = `int main() {
    cout << setw(5) << "n"
         << setw(10) << "log(n)"
         << setw(10) << "n"
         << setw(10) << "n^2"
         << setw(15) << "n^n"
         << setw(15) << "e^n" << endl;

    cout << "---------------------------------------------------------------" << endl;

    for (int n = 1; n <= 10; n++) {
        double logn = log(n);
        double square = pow(n, 2);
        double nn = pow(n, n);
        double en = exp(n);

        cout << setw(5) << n
             << setw(10) << fixed << setprecision(2) << logn
             << setw(10) << n
             << setw(10) << square
             << setw(15) << nn
             << setw(15) << en << endl;
    }

    return 0;
}`;
console.log("=== SNIPPET 3 REGEX OUTPUT ===");
console.log(transpileCppToJs(snippet3));
