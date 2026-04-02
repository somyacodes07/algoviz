const fs = require('fs');
const babel = require('@babel/core');

function parse(js) {
    try {
        babel.parseSync(js, { plugins: ['@babel/plugin-syntax-jsx'] });
        console.log("Valid JS");
    } catch (e) {
        console.log("Syntax Error:", e.message);
    }
}
parse(fs.readFileSync(0, 'utf8'));
