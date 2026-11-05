import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { BookOpen, Code2, Cpu, Eye, Layers, Moon, Star, Sun, Terminal } from 'lucide-react';
import editorPreview from '../../assets/editor.png';
import { HOME_FAQ_ITEMS } from '../seo';
import { barSlotX, createScene, ParticleScene, SceneState, TREE_H, TREE_W } from './landing/particleScene';
import { playLaunchTransition } from './landing/launchTransition';
import TraceSection from './landing/TraceSection';
import { BAR_VALUES, FIB_TRACE, SORT_FRAMES } from './landing/trace';
import './landing/landing.css';
import Logo from './Logo';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  language: string;
  onSelectLanguage: (lang: string, startingCode?: string) => void;
  onOpenDocs: () => void;
  docsHref: string;
  javascriptHref: string;
  cppHref: string;
  toggleTheme: (e: React.MouseEvent<HTMLElement>) => void;
  theme: 'light' | 'dark';
  onHoverLanguage?: (lang: string | null) => void;
}

const GITHUB_URL = 'https://github.com/somyacodes07/AlgoViz';
const VSCODE_URL = 'https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode';

const T = {
  docs: 'Docs',
  githubStar: 'Star on GitHub',
  chip: 'Interactive code visualizer',
  heroSub: 'Stop guessing. Step through your logic line-by-line, watch variables mutate in real-time, and untangle the call stack.',
  selectFile: 'Select a file to begin.',
  ctaSub: 'Free to use, with no account needed. Step through your own code in seconds.',
  readDocs: 'Read documentation',
  vscode: 'Get VS Code extension',
  running: 'fibonacci(6) call tree',
  traceTitle: 'Control the flow of time.',
  traceSub: 'A real run of fibonacci(6). Press run, step one line at a time, or tap a node to jump to that call.',
  whyTitle: 'Why use AlgoViz?',
  featureTitle: 'See the interface before you start',
  featureSub: 'A code editor, variable inspector, console playback, and call stack timeline in one place, for JavaScript and C++.',
  launchTitle: 'Launch into JavaScript or C++',
  launchDesc: 'Get straight to the right visualizer, whether you want to trace JavaScript logic or inspect C++ algorithm flow.',
  followTitle: 'Follow variables, stack frames, and console output',
  followDesc: 'The workbench focuses on the runtime state that matters during recursion, sorting, graph traversal, and debugging.',
  faqTitle: 'Frequently asked questions',
  faqSub: 'What people usually ask first when comparing code visualization tools.',
};

const FEATURES = [
  {
    icon: Terminal,
    color: '#bfdbfe',
    title: 'Multi-language support',
    desc: 'Learn web paradigms in JavaScript or dig into memory management in C++.',
  },
  {
    icon: Eye,
    color: '#fde68a',
    title: 'Step-by-step debugging',
    desc: 'Pause, step forwards, trace backwards, and watch variables change on each line.',
  },
  {
    icon: Layers,
    color: '#bbf7d0',
    title: 'Visual call stack',
    desc: 'See the stack grow and shrink as recursive frames are pushed and popped.',
  },
];

const STATS = [
  { label: 'Languages', value: '2+' },
  { label: 'Algorithms', value: '50+' },
  { label: 'Execution steps', value: '10,000+' },
  { label: 'Open source', value: '100%' },
];

const FILES = [
  {
    name: 'index.js',
    lang: 'javascript' as const,
    label: 'JavaScript',
    className: 'lp-file-js',
    icon: Code2,
    code: ['function fibonacci(n) {', '  if (n <= 1) return n;', '  return fibonacci(n - 1) + fibonacci(n - 2);', '}'],
  },
  {
    name: 'main.cpp',
    lang: 'c++' as const,
    label: 'C++',
    className: 'lp-file-cpp',
    icon: Cpu,
    code: ['int fibonacci(int n) {', '  if (n <= 1) return n;', '  return fibonacci(n - 1) + fibonacci(n - 2);', '}'],
  },
];

const NAV_LINKS = [
  { id: 'trace', label: 'Run it' },
  { id: 'features', label: 'Features' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'faq', label: 'FAQ' },
];

const TICKER = ['Binary Search', 'Merge Sort', 'Quick Sort', 'BST Traversal', 'Breadth-First Search', 'Dijkstra', 'Coin Change', '0/1 Knapsack', 'N-Queens', 'Heap Sort', 'Trie', 'LRU Cache', 'Union-Find', 'Topological Sort'];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

const HomePage: React.FC<HomePageProps> = ({
  language,
  onSelectLanguage,
  onOpenDocs,
  docsHref,
  javascriptHref,
  cppHref,
  toggleTheme,
  theme,
  onHoverLanguage,
}) => {
  const [hoverLang, setHoverLang] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ParticleScene | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const langRef = useRef({ value: language === 'c++' ? 1 : 0 });
  const playhead = useRef({ step: 0, current: 0, burst: 0 });
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);

  const activeLang = hoverLang ?? (language === 'c++' ? 'c++' : 'javascript');

  useEffect(() => {
    gsap.to(langRef.current, { value: activeLang === 'c++' ? 1 : 0, duration: reduced ? 0 : 0.35, ease: 'power2.out' });
  }, [activeLang, reduced]);

  useEffect(() => {
    sceneRef.current?.setDark(theme === 'dark');
  }, [theme]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let scene: ParticleScene | null = null;
    try {
      scene = createScene(canvas, { reduced });
    } catch (error) {
      console.warn('Landing WebGL scene disabled:', error);
    }
    sceneRef.current = scene;
    scene?.setDark(document.documentElement.classList.contains('dark'));

    let lenis: Lenis | null = null;
    const tickLenis = (time: number) => lenis?.raf(time * 1000);
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tickLenis);
    }
    // Slow machines catch up instead of playing every animation in slow motion.
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = lenis;

    const introState = { morph: reduced ? 1 : 0 };
    let tickScene: ((time: number, deltaMs: number) => void) | null = null;
    let cancelled = false;
    let measureSlots = () => {};

    const ctx = gsap.context(() => {
      const section = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
      const navH = () => (root.querySelector('.lp-nav') as HTMLElement).offsetHeight;

      // ── Progress sources for the WebGL scene ──────────────────
      const track = (trigger: HTMLElement, start: string, end: string) => ScrollTrigger.create({ trigger, start, end });
      const heroToTrace = ScrollTrigger.create({ trigger: section('trace'), start: 'top 85%', end: () => `top ${navH()}px` });
      const barsIn = track(section('features'), 'top 75%', 'top 15%');
      const barsRun = track(section('features'), 'top 15%', 'bottom bottom');
      const graphIn = track(section('stats'), 'top 90%', 'top 20%');
      const graphRun = track(section('stats'), 'top 20%', 'bottom bottom');
      const hide = track(section('workbench'), 'top 95%', 'top 45%');
      const pulseIn = track(section('cta'), 'top 90%', 'top 25%');

      const state: SceneState = {
        morph: reduced ? 1 : 0,
        step: 0,
        current: 0,
        graphStep: 0,
        lang: 0,
        fade: 1,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotY: 0,
        barX: new Float32Array(BAR_VALUES.length),
        barMoving: -1,
        burst: 0,
      };

      // Trees rest inside DOM slots, measured with the page at rest.
      const slots = {
        hero: { x: 0, y: 0, s: 1 },
        trace: { x: 0, y: 0, s: 1 },
        traceRest: 0,
        pulseY: 0.5,
      };
      measureSlots = () => {
        if (!scene) return;
        const { width, height } = scene.getSize();
        const aspect = scene.getAspect();
        const toWorld = (el: Element, shift: number) => {
          const box = el.getBoundingClientRect();
          const top = box.top + window.scrollY - shift;
          const cx = box.left + box.width / 2;
          const cy = top + box.height / 2;
          const w = (box.width / width) * 2 * aspect;
          const h = (box.height / height) * 2;
          return {
            x: ((cx / width) * 2 - 1) * aspect,
            y: 1 - (cy / height) * 2,
            s: Math.min(w / (TREE_W * 2.12), h / (TREE_H * 2.12)),
          };
        };
        const traceTop = section('trace').getBoundingClientRect().top + window.scrollY;
        slots.traceRest = traceTop - navH();
        slots.hero = toWorld(root.querySelector('[data-slot="hero"]') as Element, 0);
        slots.trace = toWorld(root.querySelector('[data-slot="trace"]') as Element, slots.traceRest);
        // The pulse is seen with the page scrolled to its end.
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pulseCenter = toWorld(root.querySelector('[data-slot="pulse"]') as Element, maxScroll).y;
        slots.pulseY = Math.min(pulseCenter - 0.05, 0.66);
      };
      measureSlots();
      ScrollTrigger.addEventListener('refresh', measureSlots);

      const bfsEl = root.querySelector('.lp-bfs-count');
      const sortEl = root.querySelector('.lp-sort-count');
      const totalComparisons = SORT_FRAMES[SORT_FRAMES.length - 1].comparisons;
      const totalSteps = FIB_TRACE.steps.length;
      const { nodes, steps } = FIB_TRACE;

      let slowFrames = 0;
      let drawnFrames = 0;
      let degraded = 0;
      let lastSort = -1;
      let lastBfs = -1;
      let docked = false;
      const labelsEl = root.querySelector('.lp-tree-labels');

      if (scene) {
        const activeScene = scene;
        tickScene = (time, deltaMs) => {
          const aspect = activeScene.getAspect();
          const narrow = aspect < 0.95;
          // Everything eases toward its scroll target, so the morphs never snap to the scrollbar.
          const k = reduced ? 1 : 1 - Math.exp(-(Math.min(deltaMs, 400) / 1000) * 7);
          const damp = (from: number, to: number) => from + (to - from) * k;

          const seg = (p: number) => (reduced ? Math.round(p) : p);
          const targetMorph = Math.min(introState.morph + seg(barsIn.progress) + seg(graphIn.progress) + seg(pulseIn.progress), 4);
          state.morph = reduced ? targetMorph : Math.abs(targetMorph - state.morph) < 0.0005 ? targetMorph : damp(state.morph, targetMorph);
          state.lang = langRef.current.value;
          state.burst = playhead.current.burst;

          // In the hero the tree runs by itself; after that it follows the debugger's playhead.
          const inHero = heroToTrace.progress < 0.3 && !reduced;
          if (inHero) {
            const loop = totalSteps + 10;
            const idle = Math.floor(time * 3) % loop;
            const index = Math.min(idle, totalSteps - 1);
            state.step = (index + 0.5) / totalSteps;
            state.current = nodes[steps[index].nodeId].enter / totalSteps;
          } else {
            state.step = playhead.current.step;
            state.current = playhead.current.current;
          }

          // Where each shape sits on screen.
          const heroT = smooth(heroToTrace.progress);
          const overscroll = Math.max(0, window.scrollY - slots.traceRest);
          const tree = {
            x: lerp(slots.hero.x, slots.trace.x, heroT),
            y: lerp(slots.hero.y, slots.trace.y, heroT) + (overscroll / activeScene.getSize().height) * 2,
            s: lerp(slots.hero.s, slots.trace.s, heroT),
          };
          const graph = narrow ? { x: 0, y: 0.22, s: 1.05 } : { x: 0, y: 0.2, s: 0.66 };
          const flat = { x: 0, y: 0, s: 1 };
          const layouts = [flat, tree, flat, graph, { x: 0, y: slots.pulseY, s: 1 }];
          const i = Math.min(Math.floor(state.morph), 3);
          const t = smooth(state.morph - i);
          state.offsetX = lerp(layouts[i].x, layouts[i + 1].x, t);
          state.offsetY = lerp(layouts[i].y, layouts[i + 1].y, t);
          state.scale = lerp(layouts[i].s, layouts[i + 1].s, t);

          const graphWeight = 1 - Math.min(Math.abs(state.morph - 3), 1);
          state.rotY = reduced ? 0 : damp(state.rotY, graphRun.progress * 3.2 * graphWeight);
          // Once the pulse has settled, a playhead keeps running along it.
          state.graphStep = !reduced && state.morph >= 3.995 ? (time * 0.16) % 1.15 : graphRun.progress * 1.05;

          // Sort: slide bars between recorded frames.
          const framePos = barsRun.progress * (SORT_FRAMES.length - 1);
          const a = SORT_FRAMES[Math.floor(framePos)];
          const b = SORT_FRAMES[Math.min(Math.floor(framePos) + 1, SORT_FRAMES.length - 1)];
          const frac = smooth(framePos - Math.floor(framePos));
          for (let slot = 0; slot < a.order.length; slot++) state.barX[a.order[slot]] = barSlotX(aspect, slot);
          for (let slot = 0; slot < b.order.length; slot++) {
            const rank = b.order[slot];
            state.barX[rank] = lerp(state.barX[rank], barSlotX(aspect, slot), frac);
          }
          state.barMoving = barsRun.progress >= 1 || barsRun.progress <= 0 ? -1 : a.moving;
          if (sortEl && a.comparisons !== lastSort) {
            lastSort = a.comparisons;
            sortEl.textContent = `Insertion sort: comparison ${a.comparisons} of ${totalComparisons}`;
          }
          const bfsCount = Math.min(18, Math.floor(graphRun.progress * 19));
          if (bfsEl && bfsCount !== lastBfs) {
            lastBfs = bfsCount;
            bfsEl.textContent = `Breadth-first search: visited ${bfsCount} of 18`;
          }

          // Pixels shrink away behind the text-heavy sections, and the canvas stops drawing there.
          const targetFade = Math.max(1 - hide.progress, pulseIn.progress);
          state.fade = reduced ? targetFade : Math.abs(targetFade - state.fade) < 0.001 ? targetFade : damp(state.fade, targetFade);

          // Node numbers show only while the tree sits still in its slot.
          const isDocked = heroToTrace.progress >= 0.995 && state.morph < 1.01;
          if (isDocked !== docked) {
            docked = isDocked;
            labelsEl?.classList.toggle('is-docked', docked);
          }

          const drew = activeScene.render(state);

          // Lower the quality once if this machine cannot keep up. Long gaps are tab switches.
          if (drew && deltaMs < 250 && degraded < 2) {
            drawnFrames++;
            if (deltaMs > 28) slowFrames++;
            if (drawnFrames >= 50) {
              if (slowFrames > 30) {
                degraded++;
                activeScene.degrade();
              }
              drawnFrames = 0;
              slowFrames = 0;
            }
          }
        };
        gsap.ticker.add(tickScene);
      }

      // ── Page progress and scroll-linked nav chips ─────────────
      gsap.to('.lp-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
      NAV_LINKS.forEach(({ id }) => {
        const link = root.querySelector(`[data-nav="${id}"]`);
        const fill = link?.querySelector('.lp-link-fill');
        if (!link || !fill) return;
        gsap.fromTo(
          fill,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: section(id), start: 'top 60%', end: 'bottom bottom', scrub: true, toggleClass: { targets: link, className: 'is-active' } },
          },
        );
      });

      const boot = document.getElementById('boot');
      if (reduced) {
        boot?.remove();
        return;
      }

      // ── Stamp cards in as they arrive. Fast, then they stay put. ──
      root.querySelectorAll('.lp-stamp').forEach((el) => {
        gsap.from(el, {
          y: 28,
          rotate: -1.2,
          autoAlpha: 0,
          duration: 0.4,
          ease: 'back.out(1.8)',
          clearProps: 'all',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });

      // ── Workbench window straightens as it arrives ────────────
      gsap.fromTo(
        '.lp-plate-window',
        { rotate: -2.5, scale: 0.94 },
        { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.lp-plate-window', start: 'top 95%', end: 'top 35%', scrub: true } },
      );

      // ── Load moment: the page gets stamped into place ─────────
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'back.out(1.7)' } });
      intro.to(introState, { morph: 1, duration: 1.5, ease: 'power3.inOut' }, 0);
      intro.from('.lp-intro', { y: 30, rotate: -1.5, autoAlpha: 0, duration: 0.5, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.05);

      const elapsed = performance.now();
      const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
      const minShown = new Promise((r) => setTimeout(r, boot ? Math.max(0, 900 - elapsed) : 0));
      Promise.all([fontsReady, minShown]).then(() => {
        if (cancelled) return;
        ScrollTrigger.refresh();
        if (!boot) {
          intro.play();
          return;
        }
        // Shutter: the loading window drops out and the two halves slide away.
        gsap
          .timeline({ onComplete: () => boot.remove() })
          .to(boot.querySelector('.boot-window'), { scale: 0.8, autoAlpha: 0, duration: 0.18, ease: 'power2.in' })
          .to(boot.querySelector('.boot-top'), { yPercent: -101, duration: 0.5, ease: 'expo.inOut' }, 0.12)
          .to(boot.querySelector('.boot-bottom'), { yPercent: 101, duration: 0.5, ease: 'expo.inOut' }, 0.12)
          .add(() => intro.play(), 0.3);
      });
    }, root);

    const onResize = () => {
      scene?.resize();
      measureSlots();
    };
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    root.querySelectorAll('img').forEach((img) => img.addEventListener('load', refresh, { once: true }));

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('refresh', measureSlots);
      if (tickScene) gsap.ticker.remove(tickScene);
      ctx.revert();
      gsap.ticker.remove(tickLenis);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      lenisRef.current = null;
      scene?.destroy();
      sceneRef.current = null;
    };
  }, [reduced]);

  const goToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = rootRef.current?.querySelector(`#${id}`) as HTMLElement | null;
    if (!target) return;
    const offset = -(rootRef.current?.querySelector('.lp-nav') as HTMLElement).offsetHeight;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.1, offset });
    else window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + offset);
  };

  const selectRef = useRef(onSelectLanguage);
  selectRef.current = onSelectLanguage;
  const launch = useCallback(
    (lang: 'javascript' | 'c++', origin: HTMLElement, startingCode?: string) => {
      playLaunchTransition(origin, {
        name: lang === 'c++' ? 'main.cpp' : 'index.js',
        lang,
        reduced,
        navigate: () => selectRef.current(lang, startingCode),
      });
    },
    [reduced],
  );

  const launchProps = (lang: 'javascript' | 'c++') => ({
    href: lang === 'c++' ? cppHref : javascriptHref,
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      // Let the browser handle open-in-new-tab clicks.
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      launch(lang, e.currentTarget);
    },
    onMouseEnter: () => {
      setHoverLang(lang);
      onHoverLanguage?.(lang);
    },
    onMouseLeave: () => {
      setHoverLang(null);
      onHoverLanguage?.(null);
    },
    onFocus: () => setHoverLang(lang),
    onBlur: () => setHoverLang(null),
  });

  const docsProps = {
    href: docsHref,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      onOpenDocs();
    },
  };

  return (
    <div ref={rootRef} className="lp" data-lang={activeLang === 'c++' ? 'cpp' : 'js'} data-reduced={reduced}>
      <div className="lp-stage" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      <header className="lp-nav">
        <a href="/" className="lp-brand" aria-label="AlgoViz home">
          <Logo language={activeLang} className="h-8 w-8 drop-shadow-[1px_1px_0_rgba(15,23,42,1)] dark:drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]" />
          <span>AlgoViz</span>
        </a>
        <nav className="lp-sections" aria-label="Page sections">
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} data-nav={link.id} className="lp-section-link" onClick={(e) => goToSection(e, link.id)}>
              {link.label}
              <span className="lp-link-fill" />
            </a>
          ))}
        </nav>
        <div className="lp-nav-actions">
          <a {...docsProps} className="lp-icon-btn lp-press">
            {T.docs}
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-icon-btn lp-press" aria-label={T.githubStar}>
            <Star size={15} strokeWidth={2.5} />
            <span className="hidden lg:inline">{T.githubStar}</span>
          </a>
          <button
            data-theme-toggle
            onClick={(e) => toggleTheme(e)}
            className="lp-icon-btn lp-press"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} strokeWidth={2.5} /> : <Sun size={16} strokeWidth={2.5} />}
          </button>
        </div>
        <div className="lp-progress" />
      </header>

      <main className="lp-content">
        <section id="hero" className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-chip lp-intro">{T.chip}</span>
            <h1 className="lp-h1 lp-intro">
              <span className="lp-h1-line">See how your</span>
              <span className="lp-code-row">
                <span className="lp-code-word">
                  <b>code</b>
                </span>
                <span className="lp-poster-tag">JS + C++</span>
              </span>
              <span className="lp-h1-line">really works.</span>
            </h1>
            <p className="lp-lede lp-intro">{T.heroSub}</p>
            <div className="lp-launchers lp-intro">
              <a {...launchProps('javascript')} className="lp-launch lp-launch-js lp-press">
                <Code2 size={20} strokeWidth={2.5} /> Launch index.js
              </a>
              <a {...launchProps('c++')} className="lp-launch lp-launch-cpp lp-press">
                <Cpu size={20} strokeWidth={2.5} /> Launch main.cpp
              </a>
            </div>
            <div className="lp-hero-links lp-intro">
              <a {...docsProps} className="lp-tag lp-press">
                <BookOpen size={14} strokeWidth={2.5} /> {T.readDocs}
              </a>
              <a href={VSCODE_URL} target="_blank" rel="noopener noreferrer" className="lp-tag lp-press">
                {T.vscode}
              </a>
            </div>
          </div>
          <div className="lp-hero-visual">
            <div className="lp-tree-slot" data-slot="hero" />
            <p className="lp-sticker lp-sticker-run">{T.running}</p>
          </div>
        </section>

        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {[...TICKER, ...TICKER].map((name, i) => (
              <span key={`${name}-${i}`}>{name}</span>
            ))}
          </div>
        </div>

        <TraceSection title={T.traceTitle} intro={T.traceSub} playhead={playhead} onLaunch={launch} />

        <section id="features" className="lp-features">
          <div className="lp-features-inner">
            <h2 className="lp-h2 lp-h2-small">{T.whyTitle}</h2>
            <div className="lp-feature-grid">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="lp-card lp-feature lp-stamp">
                  <h3>
                    <span className="lp-feature-icon" style={{ background: feature.color }}>
                      <feature.icon size={18} strokeWidth={2.5} />
                    </span>
                    {feature.title}
                  </h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
            <div className="lp-sort-gap">
              <p className="lp-sticker lp-sort-caption lp-sort-count" aria-hidden="true">
                Insertion sort
              </p>
            </div>
          </div>
        </section>

        <section id="stats" className="lp-stats">
          <div className="lp-stats-inner">
            <p className="lp-sticker lp-bfs-caption lp-bfs-count" aria-hidden="true">
              Breadth-first search
            </p>
            <div className="lp-stats-grid">
              {STATS.map((stat) => (
                <div key={stat.label} className="lp-stat">
                  <b>{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workbench" className="lp-workbench">
          <h2 className="lp-h2">{T.featureTitle}</h2>
          <p className="lp-lede">{T.featureSub}</p>
          <div className="lp-window lp-plate-window">
            <div className="lp-window-bar">
              <span>AlgoViz workbench</span>
              <span className="lp-chip">Live preview</span>
            </div>
            <img
              src={editorPreview}
              alt="AlgoViz code visualizer workbench with a Monaco editor, execution controls, variable watch panel, and call stack."
              className="lp-plate"
              width={3420}
              height={1810}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="lp-notes">
            <div className="lp-card lp-stamp">
              <h3>{T.launchTitle}</h3>
              <p>{T.launchDesc}</p>
            </div>
            <div className="lp-card lp-stamp">
              <h3>{T.followTitle}</h3>
              <p>{T.followDesc}</p>
            </div>
          </div>
        </section>

        <section id="faq" className="lp-faq">
          <div className="lp-faq-inner">
            <h2 className="lp-h2">{T.faqTitle}</h2>
            <p className="lp-lede">{T.faqSub}</p>
            {HOME_FAQ_ITEMS.map((item) => (
              <details key={item.question} onToggle={() => ScrollTrigger.refresh()}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="cta" className="lp-cta">
          <div className="lp-pulse-slot" data-slot="pulse" aria-hidden="true" />
          <div className="lp-cta-head">
            <h2 className="lp-cta-title">{T.selectFile}</h2>
            <p className="lp-lede">{T.ctaSub}</p>
          </div>
          <div className="lp-cta-grid">
            {FILES.map((file) => (
              <a key={file.name} {...launchProps(file.lang)} className={`lp-file ${file.className} lp-press`} aria-label={`Launch ${file.name}`}>
                <span className="lp-file-head">
                  <span className="lp-file-name">{file.name}</span>
                  <span className="lp-file-lang">{file.label}</span>
                </span>
                <code className="lp-file-code" aria-hidden="true">
                  {file.code.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </code>
                <span className="lp-file-go">
                  <span>
                    Launch<span className="lp-file-go-long"> visualizer</span>
                  </span>
                  <span className="lp-file-icon">
                    <file.icon size={20} strokeWidth={2.5} />
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <footer className="lp-footer">
          <a href="/" className="lp-brand" aria-label="AlgoViz home">
            <Logo language={activeLang} className="h-7 w-7" />
            <span>AlgoViz</span>
          </a>
          <nav className="lp-footer-links" aria-label="Footer">
            <a {...docsProps} className="lp-link">
              {T.readDocs}
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-link">
              {T.githubStar}
            </a>
            <a href={VSCODE_URL} target="_blank" rel="noopener noreferrer" className="lp-link">
              {T.vscode}
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
};

export default HomePage;
