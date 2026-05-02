import { parseCpp } from './backend/sandbox/transpiler/parser';

async function main() {
  const { initParser } = await import('./backend/sandbox/transpiler/parser');
  await initParser();
  const tree = parseCpp("Node* newNode = new Node(); Node& ref = n;");
  console.log(tree.rootNode.toString());
}
main().catch(console.error);
