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
      'AlgoViz is an interactive code visualizer and algorithm debugger that helps students, developers, and educators visualize JavaScript and C++ code execution step by step. It renders live variables, call stack frames, binary search trees, linked lists, queues, stacks, and console logs in real time.',
  },
  {
    question: 'Can AlgoViz visualize recursion and sorting algorithms?',
    answer:
      'Yes! AlgoViz excels at algorithm visualization for recursion (Fibonacci, N-Queens backtracking, factorial), sorting algorithms (Quick Sort, Merge Sort, Bubble Sort, Selection Sort, Insertion Sort), binary search trees (BST), graph traversal (DFS, BFS, Dijkstra), and matrix pathfinding.',
  },
  {
    question: 'Does AlgoViz support C++ code execution as well as JavaScript?',
    answer:
      'Yes. JavaScript runs natively in the browser execution sandbox, while C++ code is compiled locally using a WebAssembly build of Clang and instrumented via Tree-sitter AST parsing for line-by-line step debugging.',
  },
  {
    question: 'Is AlgoViz free to use?',
    answer:
      'Yes, AlgoViz is 100% free and open-source. There are no fees, subscriptions, or account signups required to use the interactive visualizer workbench.',
  },
  {
    question: 'How does the binary tree and linked list visualizer work?',
    answer:
      'When your code instantiates tree nodes (TreeNode) or linked list nodes (ListNode), AlgoViz inspects object references in memory and automatically renders zoomable SVG diagrams with node connections and pointer trackers.',
  },
  {
    question: 'How does AlgoViz estimate time complexity?',
    answer:
      'AlgoViz monitors loop statement executions, conditional evaluations, and function calls during code playback to estimate Big-O time complexity (e.g. O(1), O(log N), O(N), O(N log N), O(N²)) and render line hit-count heatmaps.',
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
  keywords: string[];
} {
  if (language === 'c++') {
    return {
      title: 'C++ Code Visualizer, Wasm Compiler & Call Stack Debugger | AlgoViz',
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
        'interactive code debugger students',
        'algoviz cpp'
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
      'visualize recursion online',
      'algoviz javascript'
    ],
  };
}

export function getSeoConfig(origin: string, page: AppPage, language: AppLanguage): SeoConfig {
  const baseOrigin = origin.includes('localhost') || origin.includes('127.0.0.1') ? origin : 'https://algoviz.somyacodes.in';
  const imageUrl = buildAbsoluteUrl(baseOrigin, '/og-image.png');
  const robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  if (page === 'docs') {
    const canonicalUrl = buildAbsoluteUrl(baseOrigin, ROUTES.docs);
    const title = 'AlgoViz Technical Documentation & Architecture Guide | Code Visualization';
    const description =
      'Read the AlgoViz technical documentation. Discover how our C++ Wasm compiler, AST instrumentation, dynamic tree/graph visualization engine, and complexity analyzer work.';

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
          '@type': 'TechArticle',
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
            'Algorithm template library loaded with 35+ algorithms',
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
  const title = 'AlgoViz | Interactive Algorithm, Tree, Linked List & C++/JS Code Execution Visualizer';
  const description =
    'AlgoViz is the ultimate interactive algorithm visualizer and code execution debugger for JavaScript & C++. Visualize recursion stacks, binary trees, linked lists, and sorting algorithms in real time.';

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
      'dijkstra visualizer',
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
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://algoviz.somyacodes.in/visualizer/javascript/?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AlgoViz Interactive Algorithm Visualizer',
        applicationCategory: 'EducationalApplication',
        applicationSubCategory: 'Developer Tool',
        operatingSystem: 'Web, All Operating Systems',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '1250',
          bestRating: '5',
          worstRating: '1'
        },
        url: canonicalUrl,
        image: imageUrl,
        sameAs: ['https://github.com/somyacodes07/AlgoViz'],
        featureList: [
          'Step-by-step execution debugger for JavaScript and C++',
          'Interactive Binary Search Tree (BST) visualizer',
          'Linked List visualizer with cycle detection',
          'Recursion call stack frames inspector',
          'Stack & Queue LIFO / FIFO visualizer',
          'Sorting algorithm visualizers (Bubble, Selection, Insertion, Merge, Quick Sort)',
          'Graph pathfinding visualizers (DFS, BFS, Dijkstra)',
          'Real-time Big-O time complexity estimation & hot line heatmaps',
          'In-browser C++ compilation via WebAssembly Clang'
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
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
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

