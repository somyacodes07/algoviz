import React from 'react';

type SkeletonVariant = 'home' | 'docs' | 'editor' | 'workspace' | 'header' | 'controls';

function Bar({ className = '', style }: { key?: React.Key; className?: string; style?: React.CSSProperties }) {
  return <div className={`algoviz-skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function LoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  if (variant === 'header') {
    return <div className="h-14 shrink-0 border-b-[2px] border-slate-900 bg-white p-4 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)]" role="status" aria-label="Loading workbench header"><Bar className="h-5 w-40" /></div>;
  }

  if (variant === 'controls') {
    return <div className="flex h-14 shrink-0 items-center gap-3 border-t-[2px] border-slate-900 bg-white px-4 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)]" role="status" aria-label="Loading playback controls"><Bar className="h-8 w-28" /><Bar className="h-3 flex-1" /><Bar className="h-8 w-36" /></div>;
  }

  if (variant === 'editor') {
    return <section className="flex h-full min-h-[260px] flex-col overflow-hidden border-[2px] border-slate-900 bg-white dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)]" role="status" aria-label="Loading code editor"><div className="flex h-12 shrink-0 items-center justify-between border-b-[2px] border-slate-900 px-4 dark:border-[var(--dark-border)]"><Bar className="h-4 w-32" /><Bar className="h-7 w-24" /></div><div className="space-y-4 p-5"><Bar className="h-4 w-2/3" /><Bar className="h-4 w-5/6" /><Bar className="h-4 w-1/2" /><Bar className="h-4 w-3/4" /><Bar className="h-4 w-2/5" /></div></section>;
  }

  if (variant === 'workspace') {
    return <section className="flex h-full min-h-[260px] flex-col overflow-hidden border-[2px] border-slate-900 bg-slate-50 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)]" role="status" aria-label="Loading visualization workspace"><div className="flex h-14 shrink-0 items-center justify-between border-b-[2px] border-slate-900 px-4 dark:border-[var(--dark-border)]"><Bar className="h-5 w-40" /><Bar className="h-7 w-24" /></div><div className="flex flex-1 items-center justify-center p-6"><div className="flex w-full max-w-lg items-end justify-center gap-3">{[35, 65, 48, 84, 55, 72].map((height, index) => <Bar key={index} className="w-8 border border-slate-500/20" style={{ height: `${height}%` }} />)}</div></div><div className="h-10 shrink-0 border-t-[2px] border-slate-900 dark:border-[var(--dark-border)]" /></section>;
  }

  if (variant === 'docs') {
    return <main className="min-h-screen bg-[#faf9f6] p-4 dark:bg-[var(--dark-base)]" role="status" aria-label="Loading documentation"><header className="mb-6 flex h-14 items-center justify-between border-b-2 border-slate-900 px-3 dark:border-[var(--dark-border)]"><Bar className="h-5 w-32" /><Bar className="h-5 w-36" /><Bar className="h-8 w-20" /></header><div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[16rem_1fr]"><Bar className="hidden h-[32rem] lg:block" /><div className="space-y-5"><Bar className="h-56" /><div className="grid gap-5 md:grid-cols-2"><Bar className="h-64" /><Bar className="h-64" /></div><Bar className="h-96" /></div></div></main>;
  }

  return <main className="min-h-screen bg-[#f7f0e3] p-5 dark:bg-[var(--dark-base)]" role="status" aria-label="Loading AlgoViz"><header className="mx-auto flex max-w-6xl items-center justify-between py-5"><Bar className="h-9 w-36" /><Bar className="h-9 w-32" /></header><section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-8 md:grid-cols-2"><div className="space-y-5"><Bar className="h-5 w-40" /><Bar className="h-14 w-full" /><Bar className="h-14 w-4/5" /><Bar className="h-5 w-3/4" /><Bar className="h-12 w-44" /></div><Bar className="h-[22rem]" /></section></main>;
}
