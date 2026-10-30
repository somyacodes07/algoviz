import { AppLanguage, AppPage, getPathForState, ROUTES } from './routes';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  robots: string;
  type: 'website' | 'article';
  schema: Array<Record<string, unknown>>;
}

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is AlgoViz used for?',
    answer:
      'AlgoViz is an interactive code visualizer and algorithm debugger that helps students, developers, and educators visualize JavaScript and C++ code execution step by step. It renders live variables, call stack frames, supported data-structure diagrams, and console logs.',
  },
  {
    question: 'Can AlgoViz visualize recursion and sorting algorithms?',
    answer:
      'Use the templates to explore recursion, sorting, binary search trees, graph traversal, and matrix algorithms one execution step at a time.',
  },
  {
    question: 'Does AlgoViz support C++ code execution as well as JavaScript?',
    answer:
      'Yes. JavaScript runs natively in the browser execution sandbox, while C++ code is compiled locally using a WebAssembly build of Clang and instrumented via Tree-sitter AST parsing for line-by-line step debugging.',
  },
  {
    question: 'Is AlgoViz free to use?',
    answer:
      'Yes. AlgoViz is free to use and does not require an account. Its source code is available in the public GitHub repository.',
  },
  {
    question: 'How does the binary tree and linked list visualizer work?',
    answer:
      'As your code runs, AlgoViz detects supported tree and linked-list structures from runtime state and draws diagrams with node connections and pointer markers.',
  },
  {
    question: 'How does AlgoViz estimate time complexity?',
    answer:
      'AlgoViz gives a pattern-based complexity estimate from the source and execution trace, alongside line hit counts. Treat it as a learning aid, not a proof of worst-case Big-O.',
  },
  {
    question: 'Can I share a link to my algorithm visualization session?',
    answer:
      'Yes! Click the "Share Link" button in the editor toolbar to encode your current code and language state directly into a shareable URL hash.',
  },
  {
    question: 'Is there a VS Code extension for AlgoViz?',
    answer:
      'Yes, the AlgoViz VS Code extension allows developers to launch code visualization sessions directly inside Visual Studio Code.',
  },
];

function buildAbsoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}

function getEditorLabels(language: AppLanguage): {
  title: string;
  description: string;
} {
  if (language === 'c++') {
    return {
      title: 'C++ Code Visualizer | AlgoViz',
      description:
        'Compile and step through C++ code in your browser with WebAssembly. Inspect variables, recursion, vectors, linked lists, trees, and algorithm execution.',
    };
  }

  return {
    title: 'JavaScript Code Visualizer | AlgoViz',
    description:
      'Trace JavaScript code step by step in your browser. Inspect variables, recursion, arrays, trees, linked lists, sorting, and console output.',
  };
}

export function getSeoConfig(origin: string, page: AppPage, language: AppLanguage): SeoConfig {
  const baseOrigin = origin.includes('localhost') || origin.includes('127.0.0.1') ? origin : 'https://algoviz.somyacodes.in';
  const imageUrl = buildAbsoluteUrl(baseOrigin, '/og-image.png');
  const robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  if (page === 'docs') {
    const canonicalUrl = buildAbsoluteUrl(baseOrigin, ROUTES.docs);
    const title = 'AlgoViz Documentation | How the Code Visualizer Works';
    const description =
      'Learn how to use AlgoViz to step through JavaScript and C++ programs, inspect runtime state, and visualize common data structures and algorithms.';

    return {
      title,
      description,
      canonicalUrl,
      imageUrl,
      robots,
      type: 'article',
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          '@id': `${canonicalUrl}#documentation`,
          name: 'AlgoViz Technical Documentation',
          url: canonicalUrl,
          headline: 'How AlgoViz Visualizes JavaScript & C++ Algorithms in Real Time',
          description,
          author: {
            '@type': 'Person',
            name: 'Somyajeet',
            url: 'https://github.com/somyacodes07'
          },
          about: [
            'JavaScript code visualization',
            'C++ algorithm visualization',
            'Execution tracing',
            'Tree-sitter transpilation',
            'Educational debugging',
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: buildAbsoluteUrl(baseOrigin, ROUTES.home),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Documentation',
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

  if (page === 'editor') {
    const labels = getEditorLabels(language);
    const canonicalUrl = buildAbsoluteUrl(baseOrigin, getPathForState('editor', language));

    return {
      title: labels.title,
      description: labels.description,
      canonicalUrl,
      imageUrl,
      robots,
      type: 'website',
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          '@id': `${canonicalUrl}#application`,
          name: `AlgoViz ${language === 'c++' ? 'C++' : 'JavaScript'} Visualizer Workbench`,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          url: canonicalUrl,
          image: imageUrl,
          description: labels.description,
          featureList: [
            'Step-by-step code execution controls',
            'Variable state tracking & trend sparklines',
            'Call stack recursion frame visualizer',
            'Console output playback',
            'Interactive Binary Search Tree (BST) & Linked List rendering',
            'Templates for common data structures and algorithms',
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: buildAbsoluteUrl(baseOrigin, ROUTES.home),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: language === 'c++' ? 'C++ Visualizer' : 'JavaScript Visualizer',
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

  const canonicalUrl = buildAbsoluteUrl(baseOrigin, ROUTES.home);
  const title = 'AlgoViz | JavaScript & C++ Code Visualizer for Learning Algorithms';
  const description =
    'Step through JavaScript and C++ code in your browser. Inspect variables and call stacks, and visualize arrays, trees, linked lists, graphs, and algorithms.';

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    robots,
    type: 'website',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${canonicalUrl}#website`,
        name: 'AlgoViz',
        url: canonicalUrl,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AlgoViz JavaScript and C++ Code Visualizer',
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: 'Code Visualizer',
        operatingSystem: 'Web browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        url: canonicalUrl,
        image: imageUrl,
        sameAs: ['https://github.com/somyacodes07/algoviz'],
        featureList: [
          'Step-by-step execution debugger for JavaScript and C++',
          'Interactive Binary Search Tree (BST) visualizer',
          'Linked List visualizer with cycle detection',
          'Recursion call stack frames inspector',
          'Stack & Queue LIFO / FIFO visualizer',
          'Sorting algorithm visualizers (Bubble, Selection, Insertion, Merge, Quick Sort)',
          'Graph pathfinding visualizers (DFS, BFS, Dijkstra)',
          'Pattern-based time-complexity estimates and line hit counts',
          'In-browser C++ compilation via WebAssembly Clang'
        ],
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: HOME_FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: canonicalUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'JavaScript Visualizer',
            item: buildAbsoluteUrl(baseOrigin, ROUTES.visualizerJavascript),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'C++ Visualizer',
            item: buildAbsoluteUrl(baseOrigin, ROUTES.visualizerCpp),
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'Documentation',
            item: buildAbsoluteUrl(baseOrigin, ROUTES.docs),
          },
        ],
      },
    ],
  };
}

