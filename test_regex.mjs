import { transpileCppToJs } from './backend/sandbox/legacy/regexTranspiler.js';

const cpp = `bool findPair(int a[],int n,int z)
{
    return false;
}
int main() {
  bool x = findPair(1,2,3);
}`;

console.log(transpileCppToJs(cpp));
