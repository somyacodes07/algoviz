import * as wts from 'web-tree-sitter';

async function main() {
  const Parser = wts.default || wts;
  await Parser.init();
  const parser = new Parser();
  const Lang = await Parser.Language.load('./public/tree-sitter-cpp.wasm');
  parser.setLanguage(Lang);

  const code = `
bool findPair(int a[],int n,int z) {
  return false;
}
class MyClass {
public:
  int myMethod() { return 1; }
};
`;
  const tree = parser.parse(code);
  console.log(tree.rootNode.toString());
}
main().catch(console.error);
