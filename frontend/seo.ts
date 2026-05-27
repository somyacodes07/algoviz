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
  keywords: string[];
  robots: string;
  type: 'website' | 'article';
  schema: Array<Record<string, unknown>>;
}

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is AlgoViz used for?',
    answer:
      'AlgoViz helps students and educators visualize JavaScript and C++ execution step by step, including variables, the call stack, and console output.',
  },
  {
    question: 'Can AlgoViz visualize recursion and sorting algorithms?',
    answer:
      'Yes. AlgoViz is built for algorithm learning, so it handles recursion, loops, sorting, graph traversal, and other DSA-heavy code patterns especially well.',
  },
  {
    question: 'Does AlgoViz support C++ as well as JavaScript?',
    answer:
      'Yes. JavaScript runs directly, and C++ is transformed through a Tree-sitter-powered transpilation pipeline so it can still be visualized safely in the browser.',
  },
  {
    question: 'Is AlgoViz free to use?',
    answer:
      'Yes. AlgoViz is a free browser-based code visualizer designed for learning, teaching, and debugging algorithm logic.',
  },
];

function buildAbsoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}

function getEditorLabels(language: AppLanguage): {
  title: string;
  description: string;
  keywords: string[];
} {
  if (language === 'c++') {
    return {
      title: 'C++ Code Visualizer, Tree & Linked List Simulator | AlgoViz',
      description:
        'Step through C++ execution line-by-line in your browser. Visualize binary search trees, doubly linked lists, vectors, call stacks, recursion, and O(N) complexity in real-time.',
      keywords: [
        'c++ code visualizer',
        'c++ algorithm visualizer',
        'c++ debugger online',
        'c++ recursion visualizer',
        'c++ call stack visualizer',
        'c++ tree visualizer',
        'c++ linked list visualizer',
        'c++ stack queue visualizer',
        'cpp visualizer',
        'cpp compiler online visualizer',
        'binary search tree visualizer c++',
        'dsa visualizer tool c++',
        'web clang c++ execution trace',
        'sorting algorithm animator c++',
        'interactive code debugger students'
      ],
    };
  }

  return {
    title: 'JavaScript Code Visualizer, Stack, Queue & Recursion Animator | AlgoViz',
    description:
      'Animate JavaScript code execution step-by-step. Track recursive call stacks, binary search trees, singly linked lists, loops, variables, and runtime console output.',
    keywords: [
      'javascript code visualizer',
      'javascript algorithm visualizer',
      'javascript debugger online',
      'javascript recursion visualizer',
      'javascript call stack visualizer',
      'javascript tree visualizer',
      'javascript linked list visualizer',
      'javascript stack queue visualizer',
      'js visualizer',
      'binary search tree visualizer javascript',
      'dsa visualizer tool javascript',
      'sorting algorithm animator javascript',
      'interactive code debugger js',
      'visualize recursion online'
    ],
  };
}

export function getSeoConfig(origin: string, page: AppPage, language: AppLanguage): SeoConfig {
  const imageUrl = buildAbsoluteUrl(origin, '/og-image.png');
  const robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

  if (page === 'docs') {
    const canonicalUrl = buildAbsoluteUrl(origin, ROUTES.docs);
    const title = 'AlgoViz Docs | Learn Code Visualization, Transpilation & DSA Mechanics';
    const description =
      'Read the AlgoViz technical documentation. Discover how our C++ Wasm compiler, AST instrumentation, dynamic tree/graph visualization, and complexity analyzer work.';

    return {
      title,
      description,
      canonicalUrl,
      imageUrl,
      robots,
      type: 'article',
      keywords: [
        'algoviz documentation',
        'code visualizer docs',
        'javascript execution visualizer docs',
        'c++ transpiler docs',
        'algorithm visualizer architecture',
        'data structures and algorithms animation guide',
        'wasm clang compiling in browser',
        'how does code visualization work',
        'tree visualizer source code',
        'linked list visualizer implementation'
      ],
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'AlgoViz Documentation',
          url: canonicalUrl,
          description,
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
              item: buildAbsoluteUrl(origin, ROUTES.home),
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
    const canonicalUrl = buildAbsoluteUrl(origin, getPathForState('editor', language));

    return {
      title: `${labels.title} | AlgoViz`,
      description: labels.description,
      canonicalUrl,
      imageUrl,
      robots,
      type: 'website',
      keywords: [
        'algoviz',
        'code execution visualizer',
        'algorithm debugger',
        'step by step code execution',
        ...labels.keywords,
      ],
      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: `AlgoViz ${language === 'c++' ? 'C++' : 'JavaScript'} Visualizer`,
          applicationCategory: 'DeveloperApplication',
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
            'Step-by-step code execution',
            'Variable state tracking',
            'Call stack visualization',
            'Console output playback',
            'Algorithm template library',
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
              item: buildAbsoluteUrl(origin, ROUTES.home),
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

  const canonicalUrl = buildAbsoluteUrl(origin, ROUTES.home);
  const title = 'AlgoViz | Interactive Algorithm, Tree, Linked List & C++/JS Code Visualizer';
  const description =
    'AlgoViz is the ultimate interactive algorithm and code execution visualizer for JavaScript & C++. Visualize recursion stacks, binary trees, linked lists, and sorting in real time.';

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    robots,
    type: 'website',
    keywords: [
      'algorithm visualizer',
      'code visualizer',
      'javascript code visualizer',
      'c++ code visualizer',
      'data structures and algorithms visualizer',
      'call stack visualizer',
      'recursion visualizer',
      'debugger for students',
      'programming education tool',
      'algoviz',
      'tree visualizer',
      'linked list visualizer',
      'binary search tree visualizer',
      'stack visualizer',
      'queue visualizer',
      'graph visualizer',
      'sorting visualizer',
      'matrix path visualizer',
      'bubble sort visualizer',
      'insertion sort visualizer',
      'merge sort visualizer',
      'quick sort visualizer',
      'dfs visualizer',
      'bfs visualizer',
      'interactive code execution visualizer',
      'visualize code online',
      'c++ compiler online visualizer',
      'dsa animator',
      'binary tree simulator',
      'dsa visualization website',
      'coding execution visualizer'
    ],
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AlgoViz',
        url: canonicalUrl,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AlgoViz',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        url: canonicalUrl,
        image: imageUrl,
        sameAs: ['https://github.com/ssgamingop/AlgoViz'],
        featureList: [
          'Visualize JavaScript code execution step-by-step',
          'Visualize C++ code compilation and run locally using Wasm Clang',
          'Interactive Tree Visualizer for Binary Trees and BSTs',
          'Linked List Visualizer with cyclic nodes detection and pointer trackers',
          'Stack and Queue visualizer tracking LIFO and FIFO states',
          'Live Variables panel with SVG trendline sparklines',
          'Complexity Analysis estimating Big-O complexity, hot lines, and operations count',
          'Zoomable and pannable full-screen diagrams using floating HUD control modals',
          'Simultaneous local variables tracking across recursive call stack frames',
          'Searchable template library loaded with 35+ DSA templates'
        ],
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: HOME_FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };
}
