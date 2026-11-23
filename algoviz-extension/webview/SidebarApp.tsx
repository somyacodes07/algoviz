import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useExecutionEngine } from '@/frontend/hooks/useExecutionEngine';
import StructureVisualizer from '@/frontend/components/StructureVisualizer';
import { describeStep, valuesEqual } from '@/frontend/utils/describeStep';
import { prewarmWasmEngines } from '@/backend/sandbox/transpiler/parser';
import type { ExecutionStep, VariableMap } from '@/types';
import { vscode, HostMessage } from './vscode';
import { parseError, ParsedError } from './errors';

type SectionId = 'visual' | 'variables' | 'stack' | 'output' | 'complexity';

interface RunInfo {
  code: string;
  language: 'c++' | 'javascript';
  fileName: string;
}

interface PersistedState {
  open: Record<SectionId, boolean>;
}

const DEFAULT_OPEN: Record<SectionId, boolean> = {
  visual: true,
  variables: true,
  stack: false,
  output: true,
  complexity: false,
};

const EMPTY_STEP: ExecutionStep = { line: 0, variables: {}, callStack: [], consoleOutput: [] };

const SPEEDS = [
  { label: '0.25×', ms: 2000 },
  { label: '0.5×', ms: 1200 },
  { label: '1×', ms: 600 },
  { label: '2×', ms: 300 },
  { label: '4×', ms: 120 },
];

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const MOD = isMac ? '⌘⌥' : 'Ctrl+Alt+';

export default function SidebarApp() {
  const { state, controls } = useExecutionEngine();
  const { timeline, currentStepIndex, isPlaying, isExecuting, speed, executionError, complexityAnalysis, breakpoints } = state;

  const [run, setRun] = useState<RunInfo | null>(null);
  const [activeFile, setActiveFile] = useState<{ fileName: string | null; language: string | null }>({ fileName: null, language: null });
  const [stale, setStale] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<SectionId, boolean>>(
    () => vscode.getState<PersistedState>()?.open ?? DEFAULT_OPEN,
  );

  const keepIndexRef = useRef<number | null>(null);
  const runRef = useRef<RunInfo | null>(null);
  runRef.current = run;
  // Set while a run is in flight; the effect below reports the result once it settles.
  const pendingReportRef = useRef(false);
  const runIdRef = useRef(0);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    prewarmWasmEngines();
  }, []);

  useEffect(() => {
    vscode.setState<PersistedState>({ open });
  }, [open]);

  const startRun = useCallback(async (message: Extract<HostMessage, { type: 'run' }>) => {
    const c = controlsRef.current;
    runIdRef.current++;
    keepIndexRef.current = message.keepStep ? Math.max(0, stateRef.current.currentStepIndex) : null;
    setRun({ code: message.code, language: message.language, fileName: message.fileName });
    setStale(false);
    setNotice(null);
    c.setSpeed(message.speed);
    c.clearExecution();
    vscode.postMessage({ type: 'runState', status: 'running' });
    pendingReportRef.current = true;
    await c.handleRun(message.code, message.language, { cppCompiler: message.cppCompiler });
  }, []);

  // After a run settles, tell the host how it went (status, total steps, program output).
  useEffect(() => {
    if (!pendingReportRef.current || isExecuting) return;
    pendingReportRef.current = false;
    const last = timeline[timeline.length - 1];
    const outputLines = (last?.consoleOutput || []).map((log) => log.message);
    if (executionError) {
      const parsed = parseError(executionError, runRef.current?.code || '', last?.isError && last.line > 0 ? last.line : undefined);
      vscode.postMessage({
        type: 'runState',
        status: 'error',
        error: parsed.summary,
        problems: parsed.problems.filter((p) => p.line > 0),
        output: outputLines,
        total: timeline.length,
      });
    } else {
      vscode.postMessage({ type: 'runState', status: 'ready', output: outputLines, total: timeline.length });
    }
  }, [isExecuting, executionError, timeline]);

  // Re-runs triggered by a save land on the step the user was looking at.
  useEffect(() => {
    if (keepIndexRef.current === null || timeline.length === 0 || executionError) return;
    controls.jumpToStep(Math.min(keepIndexRef.current, timeline.length - 1));
    keepIndexRef.current = null;
  }, [timeline, executionError, controls]);

  // ── Messages from the extension host ──
  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>) => {
      const message = event.data;
      const c = controlsRef.current;
      const s = stateRef.current;
      switch (message.type) {
        case 'run':
          void startRun(message);
          break;
        case 'control':
          if (s.timeline.length === 0) return;
          setNotice(null);
          if (message.action === 'next') {
            c.setIsPlaying(false);
            c.nextStep();
          } else if (message.action === 'prev') {
            c.setIsPlaying(false);
            c.prevStep();
          } else if (message.action === 'play') {
            if (s.currentStepIndex >= s.timeline.length - 1) c.jumpToStep(0);
            c.setIsPlaying(true);
          } else if (message.action === 'pause') {
            c.setIsPlaying(false);
          } else if (message.action === 'runToLine') {
            c.setIsPlaying(false);
            const after = s.timeline.findIndex((step, i) => i > s.currentStepIndex && step.line === message.line);
            const target = after >= 0 ? after : s.timeline.findIndex((step) => step.line === message.line);
            if (target >= 0) c.jumpToStep(target);
            else setNotice(`Line ${message.line} never runs in this trace.`);
          }
          break;
        case 'breakpoints':
          c.setBreakpointLines(message.lines);
          break;
        case 'stale':
          setStale(message.stale);
          if (message.stale) c.setIsPlaying(false);
          break;
        case 'config':
          c.setSpeed(message.speed);
          break;
        case 'activeFile':
          setActiveFile({ fileName: message.fileName, language: message.language });
          break;
        case 'clear':
          runIdRef.current++;
          pendingReportRef.current = false;
          c.clearExecution();
          setRun(null);
          setStale(false);
          setNotice(null);
          break;
      }
    };
    window.addEventListener('message', onMessage);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, [startRun]);

  const currentStep = timeline[currentStepIndex] || EMPTY_STEP;
  const previousStep = timeline[currentStepIndex - 1];
  const total = timeline.length;
  const hasTrace = total > 0 && currentStepIndex >= 0;

  // ── Report the current step so the host can highlight it in the editor ──
  useEffect(() => {
    if (!run || !hasTrace) return;
    vscode.postMessage({
      type: 'step',
      index: currentStepIndex,
      total,
      line: currentStep.line,
      playing: isPlaying,
      inline: inlineSummary(currentStep.variables, previousStep?.variables),
    });
  }, [run, hasTrace, currentStepIndex, total, currentStep, previousStep, isPlaying]);

  const insight = useMemo(() => (hasTrace ? describeStep(currentStep, previousStep) : ''), [hasTrace, currentStep, previousStep]);
  const parsedError = useMemo<ParsedError | null>(() => {
    if (!executionError || !run) return null;
    const last = timeline[timeline.length - 1];
    return parseError(executionError, run.code, last?.isError && last.line > 0 ? last.line : undefined);
  }, [executionError, run, timeline]);

  // Steps that stop on a gutter breakpoint, drawn as marks on the timeline.
  const breakpointSteps = useMemo(() => {
    if (breakpoints.size === 0) return [];
    const marks: number[] = [];
    timeline.forEach((step, i) => {
      if (breakpoints.has(step.line) && timeline[i - 1]?.line !== step.line) marks.push(i);
    });
    return marks.slice(0, 400);
  }, [timeline, breakpoints]);

  const status: { label: string; tone: 'busy' | 'ok' | 'warn' | 'error' | 'play' } = isExecuting
    ? { label: 'Tracing', tone: 'busy' }
    : parsedError
      ? { label: parsedError.kind === 'compile' ? 'Compile error' : parsedError.kind === 'tracer' ? 'Trace failed' : 'Error', tone: 'error' }
      : stale
        ? { label: 'Changed', tone: 'warn' }
        : isPlaying
          ? { label: 'Playing', tone: 'play' }
          : currentStepIndex >= total - 1 && total > 0
            ? { label: 'Finished', tone: 'ok' }
            : { label: 'Paused', tone: 'ok' };

  const toggleSection = (id: SectionId) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const play = () => {
    if (currentStepIndex >= total - 1) controls.jumpToStep(0);
    controls.setIsPlaying(true);
  };

  // ── Views ──
  if (!run) {
    return <EmptyState activeFile={activeFile} />;
  }

  const output = currentStep.consoleOutput || [];
  const stack = [...(currentStep.callStack || [])].reverse();

  return (
    <div className="avz-root">
      <div className="avz-toolbar">
        {isExecuting && <div className="avz-progress" aria-hidden="true" />}
        <div className="avz-filebar">
          <span className={`avz-lang avz-lang-${run.language === 'c++' ? 'cpp' : 'js'}`}>{run.language === 'c++' ? 'C++' : 'JS'}</span>
          <span className="avz-filename" title={run.fileName}>{run.fileName}</span>
          <span className={`avz-status avz-status-${status.tone}`}>
            <span className="avz-status-dot" />
            {status.label}
          </span>
          <span className="avz-spacer" />
          <IconButton label="Re-run (saving the file also re-runs)" onClick={() => vscode.postMessage({ type: 'rerun' })}>
            <RotateCw size={14} />
          </IconButton>
        </div>

        <div className="avz-controls" role="toolbar" aria-label="Playback">
          <IconButton label="First step" disabled={!hasTrace || currentStepIndex <= 0} onClick={() => controls.jumpToStep(0)}>
            <ChevronsLeft size={16} />
          </IconButton>
          <IconButton label={`Step back (${MOD}←)`} disabled={!hasTrace || currentStepIndex <= 0} onClick={() => { controls.setIsPlaying(false); controls.prevStep(); }}>
            <SkipBack size={15} />
          </IconButton>
          <button
            type="button"
            className="avz-play"
            disabled={!hasTrace}
            onClick={() => (isPlaying ? controls.setIsPlaying(false) : play())}
            title={`${isPlaying ? 'Pause' : 'Play'} (${MOD}P)`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <IconButton label={`Step forward (${MOD}→)`} disabled={!hasTrace || currentStepIndex >= total - 1} onClick={() => { controls.setIsPlaying(false); controls.nextStep(); }}>
            <SkipForward size={15} />
          </IconButton>
          <IconButton label="Last step" disabled={!hasTrace || currentStepIndex >= total - 1} onClick={() => controls.jumpToStep(total - 1)}>
            <ChevronsRight size={16} />
          </IconButton>
          <span className="avz-spacer" />
          <select
            className="avz-select"
            aria-label="Playback speed"
            value={nearestSpeed(speed)}
            onChange={(e) => controls.setSpeed(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s.ms} value={s.ms}>{s.label}</option>
            ))}
          </select>
        </div>

        <Timeline
          index={currentStepIndex}
          total={total}
          disabled={!hasTrace}
          marks={breakpointSteps}
          onSeek={(i) => {
            controls.setIsPlaying(false);
            controls.jumpToStep(i);
          }}
        />
        <div className="avz-meta">
          <span>{hasTrace ? <>Step <b>{currentStepIndex + 1}</b> of {total}</> : isExecuting ? 'Recording steps…' : 'No steps'}</span>
          {hasTrace && currentStep.line > 0 && <span>Line <b>{currentStep.line}</b></span>}
          {breakpoints.size > 0 && (
            <span className="avz-meta-bp" title="Play stops on breakpoints set in the editor gutter">
              <span className="avz-bp-dot" /> {breakpoints.size}
            </span>
          )}
        </div>
      </div>

      {stale && !isExecuting && (
        <div className="avz-banner avz-banner-warn">
          <span>The file changed since this run.</span>
          <button type="button" className="avz-link" onClick={() => vscode.postMessage({ type: 'rerun' })}>Re-run</button>
        </div>
      )}
      {parsedError && !isExecuting && <ErrorCard error={parsedError} />}
      {notice && <div className="avz-banner">{notice}</div>}

      {hasTrace && (
        <button
          type="button"
          className="avz-insight"
          onClick={() => currentStep.line > 0 && vscode.postMessage({ type: 'revealLine', line: currentStep.line })}
          title="Show this line in the editor"
        >
          <span className="avz-insight-text">{insight}</span>
        </button>
      )}

      <div className="avz-sections">
        <Section id="visual" title="Visualization" open={open.visual} onToggle={toggleSection}>
          {hasTrace ? (
            <div className="avz-diagrams">
              <StructureVisualizer
                variables={currentStep.variables || {}}
                prevVariables={previousStep?.variables || {}}
                events={currentStep.events || []}
                themeColor="blue"
                currentStepIndex={currentStepIndex}
                arrayViewType="cells"
                code={run.code}
                callDepth={(currentStep.callStack || []).length}
                line={currentStep.line}
              />
            </div>
          ) : (
            <Placeholder text={isExecuting ? 'Waiting for the trace…' : 'Nothing to draw yet.'} />
          )}
        </Section>

        <Section id="variables" title="Variables" open={open.variables} onToggle={toggleSection}>
          {hasTrace && Object.keys(currentStep.variables || {}).some((k) => !k.startsWith('__')) ? (
            <div className="avz-tree" role="tree">
              {Object.entries(currentStep.variables || {})
                .filter(([name]) => !name.startsWith('__'))
                .map(([name, value]) => (
                  <VarNode key={name} name={name} value={value} prev={previousStep?.variables?.[name]} hadPrev={!!previousStep && name in (previousStep.variables || {})} depth={0} />
                ))}
            </div>
          ) : (
            <Placeholder text="No variables in scope." />
          )}
        </Section>

        <Section id="stack" title="Call Stack" count={stack.length || undefined} open={open.stack} onToggle={toggleSection}>
          {stack.length ? (
            <ul className="avz-list">
              {stack.map((frame, i) => (
                <li key={`${frame}-${i}`} className={i === 0 ? 'avz-frame-top' : ''}>
                  <span className="avz-frame-name">{frame}</span>
                  {i === 0 && <span className="avz-frame-line">line {currentStep.line}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Placeholder text="No active frames." />
          )}
        </Section>

        <Section id="output" title="Output" count={output.length || undefined} open={open.output} onToggle={toggleSection}>
          {output.length ? (
            <OutputLog logs={output} />
          ) : (
            <Placeholder text="No output yet at this step." />
          )}
        </Section>

        <Section id="complexity" title="Complexity" open={open.complexity} onToggle={toggleSection}>
          {complexityAnalysis ? (
            <div className="avz-complexity">
              <div className="avz-complexity-row">
                <span className="avz-muted">Time</span>
                <code>{complexityAnalysis.estimate.notation}</code>
                <span className="avz-muted">{complexityAnalysis.estimate.confidence} confidence</span>
              </div>
              {complexityAnalysis.spaceEstimate && (
                <div className="avz-complexity-row">
                  <span className="avz-muted">Space</span>
                  <code>{complexityAnalysis.spaceEstimate.notation}</code>
                </div>
              )}
              <ul className="avz-rationale">
                {complexityAnalysis.estimate.rationale.map((r) => <li key={r}>{r}</li>)}
              </ul>
              {complexityAnalysis.hotspots.length > 0 && (
                <>
                  <div className="avz-muted avz-subhead">Busiest lines</div>
                  <ul className="avz-list">
                    {complexityAnalysis.hotspots.slice(0, 5).map((h) => (
                      <li key={h.line}>
                        <button type="button" className="avz-link" onClick={() => vscode.postMessage({ type: 'revealLine', line: h.line })}>
                          Line {h.line}
                        </button>
                        <span className="avz-bar"><span style={{ width: `${Math.round(h.share * 100)}%` }} /></span>
                        <span className="avz-muted">{h.hits}×</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <Placeholder text="Shown after a successful run." />
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────

function EmptyState({ activeFile }: { activeFile: { fileName: string | null; language: string | null } }) {
  const canRun = !!activeFile.fileName && !!activeFile.language;
  return (
    <div className="avz-empty">
      <p>
        Trace a C++ or JavaScript file one step at a time. The line that runs is highlighted in your editor, and the
        data structures are drawn here.
      </p>
      {canRun ? (
        <button type="button" className="avz-button" onClick={() => vscode.postMessage({ type: 'requestRun' })}>
          <Play size={13} /> Visualize {activeFile.fileName}
        </button>
      ) : (
        <p className="avz-muted">
          {activeFile.fileName ? `${activeFile.fileName} isn't C++ or JavaScript. ` : ''}Open a <code>.cpp</code>,{' '}
          <code>.c</code>, <code>.js</code> or <code>.ts</code> file to start.
        </p>
      )}
      <dl className="avz-keys">
        <dt>Visualize file</dt><dd><kbd>{MOD}V</kbd></dd>
        <dt>Step forward / back</dt><dd><kbd>{MOD}→</kbd> <kbd>{MOD}←</kbd></dd>
        <dt>Play / pause</dt><dd><kbd>{MOD}P</kbd></dd>
        <dt>Run to cursor</dt><dd><kbd>{MOD}↵</kbd></dd>
      </dl>
      <p className="avz-muted avz-small">
        Breakpoints you set in the editor gutter pause playback. For teaching, drag this view into the secondary side
        bar or the panel to give the diagrams more room.
      </p>
    </div>
  );
}

function Timeline({
  index,
  total,
  disabled,
  marks,
  onSeek,
}: {
  index: number;
  total: number;
  disabled: boolean;
  marks: number[];
  onSeek: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pct = (i: number) => (total > 1 ? (i / (total - 1)) * 100 : 0);
  const seekAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || total === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * (total - 1)));
  };
  return (
    <div
      ref={trackRef}
      className={`avz-timeline ${disabled ? 'is-disabled' : ''}`}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Step"
      aria-valuemin={1}
      aria-valuemax={Math.max(1, total)}
      aria-valuenow={index + 1}
      onPointerDown={(e) => {
        if (disabled) return;
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => draggingRef.current && seekAt(e.clientX)}
      onPointerUp={() => (draggingRef.current = false)}
      onKeyDown={(e) => {
        if (disabled) return;
        const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'PageUp' ? 10 : e.key === 'PageDown' ? -10 : 0;
        if (e.key === 'Home') onSeek(0);
        else if (e.key === 'End') onSeek(total - 1);
        else if (delta) onSeek(Math.min(total - 1, Math.max(0, index + delta)));
        else return;
        e.preventDefault();
      }}
    >
      <div className="avz-timeline-rail" />
      <div className="avz-timeline-fill" style={{ width: `${pct(Math.max(0, index))}%` }} />
      {marks.map((m) => (
        <span key={m} className="avz-timeline-mark" style={{ left: `${pct(m)}%` }} />
      ))}
      {!disabled && <span className="avz-timeline-thumb" style={{ left: `${pct(Math.max(0, index))}%` }} />}
    </div>
  );
}

function ErrorCard({ error }: { error: ParsedError }) {
  return (
    <div className={`avz-error avz-error-${error.kind}`} role="alert">
      <div className="avz-error-head">
        <AlertCircle size={15} />
        <span>{error.title}</span>
      </div>
      <p className="avz-error-summary">{error.summary}</p>
      {error.kind !== 'tracer' && error.problems.length > 0 && (
        <ul className="avz-error-list">
          {error.problems.slice(0, 6).map((p, i) => (
            <li key={i}>
              {p.line > 0 ? (
                <button type="button" className="avz-link" onClick={() => vscode.postMessage({ type: 'revealLine', line: p.line })}>
                  Line {p.line}
                </button>
              ) : (
                <span className="avz-muted">—</span>
              )}
              <span>{p.message}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="avz-error-actions">
        {error.kind === 'tracer' && (
          <button type="button" className="avz-link" onClick={() => vscode.postMessage({ type: 'reportIssue' })}>
            Report this problem
          </button>
        )}
        {error.kind === 'network' && (
          <button type="button" className="avz-link" onClick={() => vscode.postMessage({ type: 'openSettings' })}>
            Open settings
          </button>
        )}
      </div>
      {error.details && (
        <details className="avz-error-details">
          <summary>Compiler output</summary>
          <pre>{error.details}</pre>
        </details>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  count?: number;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`avz-section ${open ? 'is-open' : ''}`}>
      <button type="button" className="avz-section-header" aria-expanded={open} onClick={() => onToggle(id)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
        {count !== undefined && <span className="avz-badge">{count}</span>}
      </button>
      {open && <div className="avz-section-body">{children}</div>}
    </section>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" className="avz-icon" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Placeholder({ text }: { text: string }) {
  return <div className="avz-placeholder">{text}</div>;
}

function OutputLog({ logs }: { logs: ExecutionStep['consoleOutput'] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [logs.length]);
  return (
    <div className="avz-output">
      {logs.map((log, i) => (
        <div key={i} className={`avz-log avz-log-${log.type}`}>{log.message}</div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

interface VarNodeProps {
  name: string;
  value: unknown;
  prev: unknown;
  hadPrev: boolean;
  depth: number;
}

const VarNode: React.FC<VarNodeProps> = ({ name, value, prev, hadPrev, depth }) => {
  const [expanded, setExpanded] = useState(depth === 0 && Array.isArray(value) && value.length <= 12);
  const expandable = value !== null && typeof value === 'object' && depth < 6 && Object.keys(value as object).length > 0;
  const changed = hadPrev && !valuesEqual(value, prev);
  const isNew = depth === 0 && !hadPrev;

  const children = expandable
    ? Object.entries(value as Record<string, unknown>).filter(([k]) => !k.startsWith('__')).slice(0, 200)
    : [];

  return (
    <div role="treeitem" aria-expanded={expandable ? expanded : undefined}>
      <div
        className={`avz-var ${changed ? 'is-changed' : ''} ${isNew ? 'is-new' : ''}`}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={() => expandable && setExpanded((e) => !e)}
      >
        <span className="avz-twisty">{expandable ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}</span>
        <span className="avz-var-name">{name}</span>
        <span className="avz-var-sep">:</span>
        <ValueText value={value} />
      </div>
      {expanded &&
        children.map(([k, v]) => {
          const prevObj = prev && typeof prev === 'object' ? (prev as Record<string, unknown>) : undefined;
          return <VarNode key={k} name={k} value={v} prev={prevObj?.[k]} hadPrev={!!prevObj && k in prevObj} depth={depth + 1} />;
        })}
    </div>
  );
};

function ValueText({ value }: { value: unknown }) {
  if (value === null) return <span className="avz-v-null">null</span>;
  if (value === undefined) return <span className="avz-v-null">undefined</span>;
  if (typeof value === 'number') return <span className="avz-v-number">{String(value)}</span>;
  if (typeof value === 'boolean') return <span className="avz-v-bool">{String(value)}</span>;
  if (typeof value === 'string') {
    if (value === '[Function]' || value === '[Circular]') return <span className="avz-v-null">{value}</span>;
    return <span className="avz-v-string">"{value}"</span>;
  }
  return <span className="avz-v-preview">{preview(value)}</span>;
}

// ── Formatting helpers ──────────────────────────────────────────────────

function short(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value.length > 12 ? `${value.slice(0, 11)}…` : value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  return '{…}';
}

function preview(value: unknown): string {
  if (Array.isArray(value)) {
    const items = value.slice(0, 8).map(short).join(', ');
    return `(${value.length}) [${items}${value.length > 8 ? ', …' : ''}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([k]) => !k.startsWith('__'));
  const items = entries.slice(0, 4).map(([k, v]) => `${k}: ${short(v)}`).join(', ');
  return `{${items}${entries.length > 4 ? ', …' : ''}}`;
}

/** Values that changed at this step, for the ghost text at the end of the editor line. */
function inlineSummary(current: VariableMap, previous: VariableMap | undefined): string | undefined {
  if (!previous) return undefined;
  const parts: string[] = [];
  for (const [name, value] of Object.entries(current || {})) {
    if (name.startsWith('__') || valuesEqual(value, previous[name])) continue;
    if (Array.isArray(value) && Array.isArray(previous[name]) && value.length === (previous[name] as unknown[]).length) {
      const before = previous[name] as unknown[];
      const idx = value.findIndex((v, i) => !valuesEqual(v, before[i]));
      const changed = value.map((v, i) => (valuesEqual(v, before[i]) ? -1 : i)).filter((i) => i >= 0);
      const swapped = changed.length === 2 && valuesEqual(value[changed[0]], before[changed[1]]) && valuesEqual(value[changed[1]], before[changed[0]]);
      if (changed.length === 1) parts.push(`${name}[${idx}] = ${short(value[idx])}`);
      else if (swapped) parts.push(`swap ${name}[${changed[0]}] ⇄ ${name}[${changed[1]}]`);
      else parts.push(`${name} = ${preview(value)}`);
    } else if (value !== null && typeof value === 'object') {
      parts.push(`${name} updated`);
    } else {
      parts.push(`${name} = ${short(value)}`);
    }
    if (parts.length === 3) break;
  }
  return parts.length ? parts.join('   ') : undefined;
}

function nearestSpeed(ms: number) {
  return SPEEDS.reduce((best, s) => (Math.abs(s.ms - ms) < Math.abs(best.ms - ms) ? s : best), SPEEDS[0]).ms;
}
