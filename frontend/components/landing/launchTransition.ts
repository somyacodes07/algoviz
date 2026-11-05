import gsap from 'gsap';

interface LaunchOptions {
  name: string;
  lang: 'javascript' | 'c++';
  reduced: boolean;
  navigate: () => void;
}

const MAX_WAIT_MS = 2500;
let running = false;

// The clicked file grows to fill the screen, the app swaps in behind it, then the cover lifts.
// The cover lives on body because the landing page unmounts underneath it.
export function playLaunchTransition(origin: HTMLElement, { name, lang, reduced, navigate }: LaunchOptions) {
  if (reduced || running) {
    if (!running) navigate();
    return;
  }
  running = true;

  const isCpp = lang === 'c++';
  const cover = document.createElement('div');
  cover.setAttribute('aria-hidden', 'true');
  cover.style.cssText = `position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:${isCpp ? '#3b82f6' : '#facc15'};color:${isCpp ? '#fff' : '#0f172a'};border-bottom:2px solid #0f172a;`;

  const label = document.createElement('div');
  label.textContent = name;
  label.style.cssText = "font-family:'JetBrains Mono',ui-monospace,monospace;font-size:clamp(2.6rem,9vw,7rem);font-weight:700;letter-spacing:-0.05em;line-height:1;";
  const note = document.createElement('div');
  note.textContent = 'Opening workbench';
  note.style.cssText = 'font-family:Inter,system-ui,sans-serif;font-size:1rem;font-weight:800;';
  cover.append(label, note);
  document.body.append(cover);

  const box = origin.getBoundingClientRect();
  const from = `inset(${box.top}px ${window.innerWidth - box.right}px ${window.innerHeight - box.bottom}px ${box.left}px)`;

  const finish = () => {
    gsap.to(cover, {
      yPercent: -101,
      duration: 0.5,
      ease: 'expo.inOut',
      onComplete: () => {
        cover.remove();
        running = false;
      },
    });
  };

  gsap.from([label, note], { y: 24, autoAlpha: 0, duration: 0.35, delay: 0.2, stagger: 0.05, ease: 'power3.out' });
  gsap.fromTo(
    cover,
    { clipPath: from },
    {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: 0.55,
      ease: 'expo.inOut',
      onComplete: () => {
        cover.style.clipPath = 'none';
        navigate();
        const started = performance.now();
        const wait = setInterval(() => {
          const ready = !document.querySelector('.lp') && document.querySelector('header');
          if (ready || performance.now() - started > MAX_WAIT_MS) {
            clearInterval(wait);
            finish();
          }
        }, 50);
      },
    },
  );
}
