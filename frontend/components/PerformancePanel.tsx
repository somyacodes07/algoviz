import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, GitBranch, Hash } from 'lucide-react';
import { ComplexityAnalysis, Timeline } from '../../types';

import { getThemeConfig, ThemeColor } from '../theme/theme';

interface PerformancePanelProps {
  timeline: Timeline;
  currentStepIndex: number;
  analysis: ComplexityAnalysis | null;
  themeColor: ThemeColor;
}

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `${value}`;
}

function sampleSeries(
  values: number[],
  maxPoints: number,
  mode: 'last' | 'max' = 'last',
): number[] {
  if (values.length <= maxPoints) return values;

  const bucketSize = Math.ceil(values.length / maxPoints);
  const result: number[] = [];

  for (let index = 0; index < values.length; index += bucketSize) {
    const bucket = values.slice(index, index + bucketSize);
    if (mode === 'max') {
      result.push(Math.max(...bucket));
    } else {
      result.push(bucket[bucket.length - 1]);
    }
  }

  return result;
}

function buildSparklinePaths(
  values: number[],
  width: number,
  height: number,
  options?: { minBase?: number },
) {
  if (values.length === 0) {
    return { linePath: '', areaPath: '' };
  }

  const minValue = options?.minBase ?? Math.min(...values);
  const maxValue = Math.max(...values, minValue + 1);
  const spread = Math.max(maxValue - minValue, 1);
  const topPadding = 10;
  const bottomPadding = 10;
  const usableHeight = height - topPadding - bottomPadding;

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = topPadding + (1 - (value - minValue) / spread) * usableHeight;
    return { x, y };
  });

  if (points.length === 1) {
    const singleY = points[0].y;
    return {
      linePath: `M 0 ${singleY} L ${width} ${singleY}`,
      areaPath: `M 0 ${singleY} L ${width} ${singleY} L ${width} ${height} L 0 ${height} Z`,
    };
  }

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return { linePath, areaPath };
}

function compactReason(reason: string): string {
  const shortened = reason
    .replace(/^Detected /, '')
    .replace(/^Observed /, '')
    .replace(
      /^A sort-style call was detected and contributes a linearithmic signal\.$/,
      'Sort call adds an n log n signal',
    )
    .replace(
      /^No repeating loop or recursive structure dominated the analyzed source\.$/,
      'No dominant loop or recursion signal',
    )
    .replace('the analyzed control flow', 'control flow')
    .replace('current execution trace', 'trace')
    .replace('traced operations across', 'ops across')
    .replace('active lines over', 'lines over')
    .replace('traced steps', 'steps')
    .replace(
      'stack frames, reinforcing a branching-recursion profile',
      'stack frames; branching recursion fits',
    )
    .replace(/\.$/, '');

  return shortened.length > 84 ? `${shortened.slice(0, 81).trim()}...` : shortened;
}

// ── #6 Complexity sparkline growth curve ──────────────────────────────
function getComplexityPoints(notation: string, pts = 20): string {
  const n = pts;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  let ys: number[];
  const norm = notation.toLowerCase();
  if (norm.includes('log')) {
    ys = xs.map(x => Math.log2(x + 1));
  } else if (norm.includes('n^2') || norm.includes('n²')) {
    ys = xs.map(x => x * x);
  } else if (norm.includes('n^3') || norm.includes('n³')) {
    ys = xs.map(x => x * x * x);
  } else if (norm.includes('2^n') || norm.includes('exponential')) {
    ys = xs.map(x => Math.pow(2, x / 3));
  } else if (norm.includes('n log') || norm.includes('n\u00b7log') || norm.includes('nlog')) {
    ys = xs.map(x => x * Math.log2(x + 1));
  } else {
    // linear O(n)
    ys = xs.map(x => x);
  }
  const W = 48, H = 24;
  const maxY = Math.max(...ys, 1);
  const points = xs.map((x, i) => {
    const px = ((x - 1) / (n - 1)) * W;
    const py = H - (ys[i] / maxY) * (H - 2);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');
  return points;
}

const ComplexitySparkline: React.FC<{ notation: string; stroke: string; fill: string }> = ({ notation, stroke, fill }) => {
  const points = getComplexityPoints(notation);
  const W = 48, H = 24;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline
        points={`0,${H} ${points} ${W},${H}`}
        fill={fill}
        stroke="none"
        opacity={0.3}
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const PerformancePanel: React.FC<PerformancePanelProps> = ({
  timeline,
  currentStepIndex,
  analysis,
  themeColor,
}) => {
  const theme = getThemeConfig(themeColor);

  if (timeline.length === 0 || currentStepIndex < 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-sm w-full border-[2px] border-dashed border-slate-900 dark:border-[#333] bg-slate-100 dark:bg-[#111113] p-6 text-center shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]">
          <div
            className={`mx-auto mb-3 inline-flex border-[2px] px-3 py-2 ${theme.accentBorder} ${theme.accentSoftBg}`}
          >
            <BarChart3 size={18} className={theme.accentText} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-700 dark:text-slate-300">
            Trace Complexity
          </h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Run the trace to unlock the estimate, hotspots, and stack graph.
          </p>
        </div>
      </div>
    );
  }

  const visibleTimeline = timeline.slice(0, currentStepIndex + 1);
  const lineHits = new Map<number, number>();
  let peakStackDepth = 1;

  visibleTimeline.forEach((step) => {
    if (step.line > 0) {
      lineHits.set(step.line, (lineHits.get(step.line) || 0) + 1);
    }
    peakStackDepth = Math.max(peakStackDepth, step.callStack.length);
  });

  const observedOperations = visibleTimeline.length;
  const uniqueLines = lineHits.size;
  const topLines = Array.from(lineHits.entries())
    .map(([line, hits]) => ({
      line,
      hits,
      share: hits / Math.max(observedOperations, 1),
    }))
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 6);
  const hottestLine = topLines[0];
  const stackSeries = sampleSeries(
    visibleTimeline.map((step) => step.callStack.length),
    36,
    'max',
  );
  const lineSeries = sampleSeries(
    visibleTimeline.map((step) => step.line || 0),
    36,
    'last',
  );
  const stackChart = buildSparklinePaths(stackSeries, 320, 110, { minBase: 0 });
  const lineChart = buildSparklinePaths(lineSeries, 320, 110);
  const confidenceClass =
    analysis?.estimate.confidence === 'high'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
      : analysis?.estimate.confidence === 'medium'
        ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  return (
    <div className="flex flex-col gap-4 p-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${theme.panelClass} p-4`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 border-[2px] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${theme.accentSoftBg} ${theme.accentText} ${theme.accentBorder}`}
              >
                <Activity size={12} />
                Trace Estimate
              </span>
              {analysis && (
                <span
                  className={`border-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${confidenceClass}`}
                >
                  {analysis.estimate.confidence} confidence
                </span>
              )}
            </div>
            <h3 className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Observed Complexity
            </h3>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {analysis?.estimate.notation || 'O(?)'}
              </span>
              {analysis?.estimate.notation && analysis.estimate.notation !== 'O(?)' && (
                <ComplexitySparkline
                  notation={analysis.estimate.notation}
                  stroke={theme.accentFill}
                  fill={theme.accentFill}
                />
              )}
              <span className="pb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                trace + control flow
              </span>
            </div>
          </div>

          <div
            className={`border-[2px] px-3 py-2 text-right shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] ${theme.accentBorder} ${theme.accentSoftBg}`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Trace Slice
            </div>
            <div className={`mt-1 text-2xl font-black ${theme.accentText}`}>
              {Math.round(((currentStepIndex + 1) / timeline.length) * 100)}%
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {currentStepIndex + 1} of {timeline.length} traced steps
            </div>
          </div>
        </div>

        {analysis?.estimate.rationale?.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {analysis.estimate.rationale.slice(0, 2).map((reason) => (
              <div
                key={reason}
                className={`${theme.subPanelClass} flex items-start gap-2 p-2 text-sm text-slate-600 dark:text-slate-300`}
              >
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${theme.accentBg}`} />
                <span className="leading-relaxed font-medium">{compactReason(reason)}</span>
              </div>
            ))}
          </div>
        ) : null}

      </motion.section>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'Operations Seen',
            value: formatCount(observedOperations),
            hint: 'Trace events',
            icon: Hash,
          },
          {
            label: 'Unique Lines',
            value: formatCount(uniqueLines),
            hint: 'Lines hit',
            icon: BarChart3,
          },
          {
            label: 'Peak Stack',
            value: formatCount(peakStackDepth),
            hint: 'Max depth',
            icon: GitBranch,
          },
          {
            label: 'Hot Line',
            value: hottestLine ? `L${hottestLine.line}` : 'None',
            hint: hottestLine ? `${hottestLine.hits} hits` : 'No hotspot',
            icon: Activity,
          },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`${theme.panelClass} p-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <card.icon size={15} className={theme.accentText} />
            </div>
            <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {card.value}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {card.hint}
            </p>
          </motion.div>
        ))}
      </div>

      <section className={`${theme.panelClass} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
              Hot Lines
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Most-hit lines in this slice.
            </p>
          </div>
          <span
            className={`border-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accentSoftBg} ${theme.accentText} ${theme.accentBorder}`}
          >
            Heat Map
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {topLines.map((entry, index) => (
            <div key={entry.line} className="grid grid-cols-[56px_1fr_64px] items-center gap-3">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Line {entry.line}
              </span>
              <div className="h-4 overflow-hidden border-[2px] border-slate-900 bg-slate-100 dark:border-[#333] dark:bg-[#111113]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${entry.share * 100}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24, delay: index * 0.05 }}
                  className={`h-full ${theme.accentBg}`}
                />
              </div>
              <span className="text-right text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {entry.hits} hits
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${theme.panelClass} p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
                Stack Depth
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Depth over time.</p>
            </div>
            <span
              className={`border-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accentSoftBg} ${theme.accentText} ${theme.accentBorder}`}
            >
              Peak {peakStackDepth}
            </span>
          </div>

          <div className={`mt-4 p-3 ${theme.subPanelClass}`}>
            <svg viewBox="0 0 320 110" className="h-28 w-full">
              <path d={stackChart.areaPath} fill={theme.accentFillSoft} />
              <path
                d={stackChart.linePath}
                fill="none"
                stroke={theme.accentFill}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className={`${theme.panelClass} p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
                Source Flow
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Line hops over time.
              </p>
            </div>
            <span
              className={`border-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accentSoftBg} ${theme.accentText} ${theme.accentBorder}`}
            >
              Line Path
            </span>
          </div>

          <div className={`mt-4 p-3 ${theme.subPanelClass}`}>
            <svg viewBox="0 0 320 110" className="h-28 w-full">
              <path d={lineChart.areaPath} fill={theme.accentFillSoft} />
              <path
                d={lineChart.linePath}
                fill="none"
                stroke={theme.accentFill}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PerformancePanel;
