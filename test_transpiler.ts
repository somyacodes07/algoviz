import { transpileCppToJs } from './backend/sandbox/transpiler/index';
import { initParser } from './backend/sandbox/transpiler/parser';

async function test() {
  await initParser();
  const cpp = `
#include <iostream>
using namespace std;

bool findPair(int a[],int n,int z)
{
    for (int i=0;i<n;i++){
        for (int j=i+1;j<n;j++){
            if(a[i]+a[j]==z){
                return true;
            }
        }
    }
    return false;
};

class User {
public:
  int id;
  User() { id = 0; }
  void printId() { cout << id << endl; }
};

int main(){
    int a[]= {1,-2,1,0,5};
    int z = -1;
    int n = sizeof(a)/sizeof(a[0]);

    if (findPair(a,n,z)){
        cout<<"Pair found";
    }
    else{
        cout<<"Pair not found";
    }

    User u;
    u.id = 1;
    u.printId();
}
  `;
  const js = transpileCppToJs(cpp);
  console.log("=== TRANPILED JS ===");
  console.log(js);
}
test().catch(console.error);
