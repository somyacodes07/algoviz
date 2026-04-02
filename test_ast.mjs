import { transpileCppToJs } from './backend/sandbox/transpiler/index.js';

const snippet1 = `bool findPair(int a[], int n, int z)
{
    return false;
}
int main()
{
    return 0;
}`;

async function run() {
    try {
        const js = await transpileCppToJs(snippet1);
        console.log("AST Output Valid.");
    } catch(e) {
        console.log("AST Error:", e.message);
    }
}
run();
