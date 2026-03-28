import { AppLanguage, AppPage, getPathForState, ROUTES } from "./routes";

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
  type: "website" | "article";
  schema: Array<Record<string, unknown>>;
}

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is AlgoViz used for?",
    answer:
      "AlgoViz helps students and educators visualize JavaScript and C++ execution step by step, including variables, the call stack, and console output.",
  },
  {
    question: "Can AlgoViz visualize recursion and sorting algorithms?",
    answer:
      "Yes. AlgoViz is built for algorithm learning, so it handles recursion, loops, sorting, graph traversal, and other DSA-heavy code patterns especially well.",
  },
  {
    question: "Does AlgoViz support C++ as well as JavaScript?",
    answer:
      "Yes. JavaScript runs directly, and C++ is transformed through a Tree-sitter-powered transpilation pipeline so it can still be visualized safely in the browser.",
  },
  {
    question: "Is AlgoViz free to use?",
    answer:
      "Yes. AlgoViz is a free browser-based code visualizer designed for learning, teaching, and debugging algorithm logic.",
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
  if (language === "c++") {
    return {
      title: "C++ Code Visualizer and Algorithm Debugger",
      description:
        "Visualize C++ algorithms line by line in the browser. Step through recursion, variables, arrays, STL-style logic, and the call stack with AlgoViz.",
      keywords: [
        "c++ code visualizer",
        "c++ algorithm visualizer",
        "c++ debugger for students",
        "c++ recursion visualizer",
        "c++ call stack visualizer",
      ],
    };
  }

  return {
    title: "JavaScript Code Visualizer and Algorithm Debugger",
    description:
      "Visualize JavaScript code execution step by step. Track variables, recursion, loops, console output, and the call stack with AlgoViz.",
    keywords: [
      "javascript code visualizer",
      "javascript algorithm visualizer",
      "javascript debugger for students",
      "javascript recursion visualizer",
      "javascript call stack visualizer",
    ],
  };
}

export function getSeoConfig(
  origin: string,
  page: AppPage,
  language: AppLanguage,
): SeoConfig {
  const imageUrl = buildAbsoluteUrl(origin, "/og-image.png");
  const robots =
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

  if (page === "docs") {
    const canonicalUrl = buildAbsoluteUrl(origin, ROUTES.docs);
    const title = "AlgoViz Documentation for JavaScript and C++ Visualization";
    const description =
      "Read the AlgoViz docs covering setup, architecture, template workflows, the C++ transpiler, and the execution sandbox used for code visualization.";

    return {
      title,
      description,
      canonicalUrl,
      imageUrl,
      robots,
      type: "article",
      keywords: [
        "algoviz documentation",
        "code visualizer docs",
        "javascript execution visualizer docs",
        "c++ transpiler docs",
        "algorithm visualizer architecture",
      ],
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "AlgoViz Documentation",
          url: canonicalUrl,
          description,
          about: [
            "JavaScript code visualization",
            "C++ algorithm visualization",
            "Execution tracing",
            "Tree-sitter transpilation",
            "Educational debugging",
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: buildAbsoluteUrl(origin, ROUTES.home),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Documentation",
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

  if (page === "editor") {
    const labels = getEditorLabels(language);
    const canonicalUrl = buildAbsoluteUrl(
      origin,
      getPathForState("editor", language),
    );

    return {
      title: `${labels.title} | AlgoViz`,
      description: labels.description,
      canonicalUrl,
      imageUrl,
      robots,
      type: "website",
      keywords: [
        "algoviz",
        "code execution visualizer",
        "algorithm debugger",
        "step by step code execution",
        ...labels.keywords,
      ],
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: `AlgoViz ${language === "c++" ? "C++" : "JavaScript"} Visualizer`,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          url: canonicalUrl,
          image: imageUrl,
          description: labels.description,
          featureList: [
            "Step-by-step code execution",
            "Variable state tracking",
            "Call stack visualization",
            "Console output playback",
            "Algorithm template library",
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: buildAbsoluteUrl(origin, ROUTES.home),
            },
            {
              "@type": "ListItem",
              position: 2,
              name:
                language === "c++"
                  ? "C++ Visualizer"
                  : "JavaScript Visualizer",
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

  const canonicalUrl = buildAbsoluteUrl(origin, ROUTES.home);
  const title = "AlgoViz | Algorithm, JavaScript, and C++ Code Visualizer";
  const description =
    "AlgoViz is an interactive algorithm and code execution visualizer for JavaScript and C++. Step through recursion, loops, variables, and the call stack in real time.";

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    robots,
    type: "website",
    keywords: [
      "algorithm visualizer",
      "code visualizer",
      "javascript code visualizer",
      "c++ code visualizer",
      "data structures and algorithms visualizer",
      "call stack visualizer",
      "recursion visualizer",
      "debugger for students",
      "programming education tool",
      "algoviz",
    ],
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AlgoViz",
        url: canonicalUrl,
        description,
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "AlgoViz",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        url: canonicalUrl,
        image: imageUrl,
        sameAs: ["https://github.com/ssgamingop/AlgoViz"],
        featureList: [
          "Visualize JavaScript execution",
          "Visualize C++ execution",
          "Track variables line by line",
          "Inspect the call stack",
          "Use algorithm templates for learning",
        ],
        description,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: HOME_FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
