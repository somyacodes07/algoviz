# Security Policy

## How AlgoViz runs code

AlgoViz runs the code you give it, so isolation matters:

- **JavaScript** runs in a Web Worker, with a step limit and a time limit. The website runs it in your browser, and the VS Code extension runs it in the sidebar webview.
- **C++** is compiled to WebAssembly by a bundled Clang and runs in the same sandboxed environment. There is a step limit here too.
- **Remote compiler (optional):** if you choose the remote compiler (`algoviz.cppCompiler: api` in VS Code, or the API option on the website), your C++ source is sent to Compiler Explorer to be compiled.
- **VS Code extension:** the webview has a strict content security policy. It only reads the file you ask it to visualize.

## Supported versions

| Component | Supported |
| --- | --- |
| Website ([algoviz.somyacodes.in](https://algoviz.somyacodes.in)) | Latest deployment |
| VS Code extension | Latest Marketplace release |

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Report it privately through GitHub: go to the [Security tab](https://github.com/somyacodes07/algoviz/security) and choose **Report a vulnerability**. Include:

- what the problem is, and where (website, extension, or both)
- steps or code to reproduce it
- the impact you expect

You'll get a reply within a week. Once a fix ships, you'll be credited in the changelog unless you'd rather not be.
