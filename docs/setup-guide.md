# Setup & Installation Guide

AlgoViz relies on a heavily optimized React frontend powered by Vite, parsing tools like Acorn, and an encapsulated WebWorker execution engine.

## Prerequisites

To run AlgoViz locally, you need a functioning Node.js environment:

- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm or yarn

## Local Installation

1. **Clone the Source Code**
   \`\`\`bash
   git clone https://github.com/ssgamingop/algoviz.git
   cd algoviz
   \`\`\`

2. **Install Dependencies**
   The project has dependencies on Monaco Editor, Tailwind CSS, Framer Motion, and Acorn AST parsing libraries.
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   The application will instantly launch at \`http://localhost:3000\`.

## Production Build

AlgoViz compiles down to purely static HTML, JS, and CSS files. The heavy C++ transpilation and Acorn AST instrumentation happens entirely client-side via Web Workers, meaning you can host this strictly as a static website on GitHub Pages, Vercel, or Netlify without any heavy backend database requirements.

To assemble the production build, run:
\`\`\`bash
npm run build
npm run preview
\`\`\`
