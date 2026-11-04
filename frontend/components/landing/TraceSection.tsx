import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { TREE_H, treeNodePoint } from './particleScene';
import { FIB_CODE_LINES, FIB_TRACE } from './trace';

const { steps, nodes } = FIB_TRACE;
const BASE_DELAY = 420;
const SPEEDS = [1, 2, 4];
const NODE_POINTS = nodes.map((node) => treeNodePoint(node.id));

interface TraceSectionProps {
  title: string;
  intro: string;
  // Read every frame by the particle scene.
  playhead: React.MutableRefObject<{ step: number; current: number }>;
}

function describe(index: number) {
  const step = steps[index];
  if (step.output !== null) return `Done. console.log printed ${step.output}.`;
  const top = step.stack[0];
  if (step.returned !== null) return `${top} received ${step.returned}`;
  if (step.line === 1) return `Calling ${top}`;
  if (step.line === 2) return step.n !== null && step.n <= 1 ? `${top} hit the base case` : `${top} checks its base case`;
  return `${top} recurses`;
}

// Click-to-play debugger. Same controls as the workbench: run, pause, step, scrub.
const TraceSection: React.FC<TraceSectionProps> = ({ title, intro, playhead }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const step = steps[index];
  const last = steps.length - 1;
  const atEnd = index === last;

  playhead.current.step = (index + 0.5) / steps.length;
  playhead.current.current = nodes[step.nodeId].enter / steps.length;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= last) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, BASE_DELAY / speed);
    return () => clearInterval(timer);
  }, [playing, speed, last]);

  useEffect(() => {
    const el = slotRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setSlot({ width: el.clientWidth, height: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Stop when the debugger scrolls out of view, so the run is never missed.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setPlaying(false);
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (atEnd) setIndex(0);
    setPlaying((p) => !p || atEnd);
  };
  const stepBy = (delta: number) => {
    setPlaying(false);
    setIndex((i) => Math.min(last, Math.max(0, i + delta)));
  };

  // Same fit the particle tree uses, so each number lands on its node.
  const unit = Math.min(slot.width / 2.12, slot.height / (TREE_H * 2.12));
  const nodeState = (id: number) => {
    const node = nodes[id];
    if (index < node.enter) return 'is-wait';
    if (index >= node.exit) return 'is-done';
    return id === step.nodeId ? 'is-now' : 'is-stack';
  };

  const untouched = index === 0 && !playing;
  const playLabel = playing ? 'Pause' : atEnd ? 'Run again' : untouched ? 'Run' : 'Resume';

  return (
    <section id="trace" ref={sectionRef} className="lp-trace">
      <div className="lp-trace-tree">
        <div ref={slotRef} className="lp-tree-slot" data-slot="trace">
          <div className="lp-tree-labels" aria-hidden="true">
            {nodes.map((node) => (
              <span
                key={node.id}
                className={nodeState(node.id)}
                style={{
                  left: slot.width / 2 + NODE_POINTS[node.id].x * unit,
                  top: slot.height / 2 - NODE_POINTS[node.id].y * unit,
                }}
              >
                {node.n}
              </span>
            ))}
          </div>
        </div>
        <p className="lp-sticker lp-sticker-event" aria-live="off">
          {describe(index)}
        </p>
        <ul className="lp-legend" aria-label="Call tree colours">
          <li><i className="is-wait" /> Waiting</li>
          <li><i className="is-now" /> Running</li>
          <li><i className="is-stack" /> On stack</li>
          <li><i className="is-done" /> Returned</li>
        </ul>
      </div>

      <div className="lp-trace-column">
        <h2 className="lp-h2 lp-h2-small">{title}</h2>
        <p className="lp-lede">{intro}</p>

        <div className="lp-window" aria-label="Execution of fibonacci(6)">
          <div className="lp-window-bar">
            <span>scratchpad.js</span>
            <span className="lp-chip lp-tabular">
              Step {index + 1} / {steps.length}
            </span>
          </div>

          <div className="lp-code">
            {FIB_CODE_LINES.map((line, i) => (
              <div key={line} className={`lp-code-line ${step.line === i + 1 ? 'is-active' : ''}`}>
                <span className="lp-code-no">{i + 1}</span>
                <span className="lp-code-text">{line}</span>
              </div>
            ))}
          </div>

          <div className="lp-watch">
            <dl className="lp-watch-vars">
              <div>
                <dt>n</dt>
                <dd>{step.n ?? '-'}</dd>
              </div>
              <div>
                <dt>returned</dt>
                <dd>{step.returned ?? '-'}</dd>
              </div>
              <div className="lp-var-console">
                <dt>console</dt>
                <dd>{step.output ?? '-'}</dd>
              </div>
              <div className="lp-var-depth">
                <dt>depth</dt>
                <dd>{step.stack.length}</dd>
              </div>
            </dl>
            <div className="lp-stack">
              <div className="lp-stack-title">Call stack ({step.stack.length})</div>
              {step.stack.length === 0 && <div className="lp-frame">Empty</div>}
              {step.stack.slice(0, 3).map((frame, i) => (
                <div key={`${step.stack.length - i}-${frame}`} className={`lp-frame ${i === 0 ? 'is-top' : ''}`}>
                  {frame}
                </div>
              ))}
              {step.stack.length > 3 && <div className="lp-frame is-more">+{step.stack.length - 3} below</div>}
            </div>
          </div>

          <div className="lp-dock">
          <div className="lp-controls">
            <button type="button" className="lp-ctl lp-ctl-reset" onClick={() => { setPlaying(false); setIndex(0); }} aria-label="Reset">
              <RotateCcw size={16} strokeWidth={2.5} />
            </button>
            <button type="button" className="lp-ctl" onClick={() => stepBy(-1)} disabled={index === 0} aria-label="Previous step">
              <StepBack size={16} strokeWidth={2.5} />
            </button>
            <button type="button" className="lp-run" onClick={togglePlay}>
              {playing ? <Pause size={16} strokeWidth={3} /> : <Play size={16} strokeWidth={3} />}
              {playLabel}
              {untouched && <span className="lp-run-long">fibonacci(6)</span>}
            </button>
            <button type="button" className="lp-ctl" onClick={() => stepBy(1)} disabled={atEnd} aria-label="Next step">
              <StepForward size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="lp-ctl lp-ctl-speed"
              onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
              aria-label={`Playback speed ${speed}x. Click to change.`}
            >
              {speed}x
            </button>
          </div>
          <input
            type="range"
            className="lp-scrub"
            min={0}
            max={last}
            value={index}
            aria-label="Execution timeline"
            onChange={(e) => {
              setPlaying(false);
              setIndex(Number(e.target.value));
            }}
          />
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(TraceSection);
