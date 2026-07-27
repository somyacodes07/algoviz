import React, { useRef, useState } from 'react';
import { VariableMap } from '../../types';
import { ThemeColor } from '../theme/theme';
import {
  buildLinkedListPreview,
  LinkedListPanel,
  LinkedListPreview,
} from './visualizer/LinkedListVisualizer';
import { buildGraphPreview, GraphPanel, GraphPreview } from './visualizer/GraphVisualizer';
import { buildTreePreview, TreePanel, TreePreview } from './visualizer/TreeVisualizer';
import {
  buildArrayGridPreview,
  ArrayGridVisualizer,
  ArrayGridPreview,
} from './visualizer/ArrayGridVisualizer';
import { buildHeapPreview, HeapPanel, HeapPreview } from './visualizer/HeapVisualizer';
import { buildHashMapPreview, HashMapPanel, HashMapPreview } from './visualizer/HashMapVisualizer';
import { buildStackQueuePreview, StackQueuePanel, StackQueuePreview } from './visualizer/StackQueueVisualizer';
import { DiagramModal } from './visualizer/DiagramModal';
import { Network } from 'lucide-react';

interface StructureVisualizerProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  themeColor: ThemeColor;
  currentStepIndex: number;
  arrayViewType?: 'cells' | 'bars';
}

/**
 * StructureVisualizer is "sticky" — once a structure (tree, linked list,
 * graph, or array/grid) is detected, it keeps showing the last known version
 * even when the current execution step enters a scope that doesn't contain
 * the structure variable (e.g. inside a recursive call).
 */
const StructureVisualizer: React.FC<StructureVisualizerProps> = ({
  variables,
  prevVariables,
  themeColor,
  currentStepIndex,
  arrayViewType = 'cells',
}) => {
  const [enlargedType, setEnlargedType] = useState<'tree' | 'list' | 'graph' | 'array' | 'heap' | 'hashmap' | 'stackqueue' | null>(null);
  const lastTree = useRef<TreePreview | null>(null);
  const lastLinkedList = useRef<LinkedListPreview | null>(null);
  const lastGraph = useRef<GraphPreview | null>(null);
  const lastArrayGrid = useRef<ArrayGridPreview | null>(null);
  const lastHeap = useRef<HeapPreview | null>(null);
  const lastHashMap = useRef<HashMapPreview | null>(null);
  const lastStackQueue = useRef<StackQueuePreview | null>(null);

  // Try to detect structures from the current step's variables
  const freshTree = buildTreePreview(variables);
  const freshLinkedList = buildLinkedListPreview(variables);
  const freshGraph = buildGraphPreview(variables);
  const freshArrayGrid = buildArrayGridPreview(variables, prevVariables);
  const freshHeap = buildHeapPreview(variables);
  const freshHashMap = buildHashMapPreview(variables);
  const freshStackQueue = buildStackQueuePreview(variables);

  // Update refs when a fresh detection succeeds
  if (freshTree) lastTree.current = freshTree;
  if (freshLinkedList) lastLinkedList.current = freshLinkedList;
  if (freshGraph) lastGraph.current = freshGraph;
  if (freshArrayGrid) lastArrayGrid.current = freshArrayGrid;
  if (freshHeap) lastHeap.current = freshHeap;
  if (freshHashMap) lastHashMap.current = freshHashMap;
  if (freshStackQueue) lastStackQueue.current = freshStackQueue;

  // Clear cache ONLY when execution fully restarts
  if (currentStepIndex === 0) {
    lastTree.current = null;
    lastLinkedList.current = null;
    lastGraph.current = null;
    lastArrayGrid.current = null;
    lastHeap.current = null;
    lastHashMap.current = null;
    lastStackQueue.current = null;
  }

  // Use fresh values if available, otherwise fall back to last known
  const treePreview = freshTree || lastTree.current;
  const linkedListPreview = freshLinkedList || lastLinkedList.current;
  const graphPreview = freshGraph || lastGraph.current;
  const arrayGridPreview = freshArrayGrid || lastArrayGrid.current;
  const heapPreview = freshHeap || lastHeap.current;
  const hashMapPreview = freshHashMap || lastHashMap.current;
  const stackQueuePreview = freshStackQueue || lastStackQueue.current;

  if (!treePreview && !linkedListPreview && !graphPreview && !arrayGridPreview && !heapPreview && !hashMapPreview && !stackQueuePreview) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 border-[2px] border-dashed border-slate-900 dark:border-[var(--dark-border)] bg-slate-100 dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all duration-300">
        <span
          className={`border px-2 py-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${themeColor === 'saffron' ? 'border-saffron-500 bg-saffron-100 text-saffron-700 dark:border-saffron-600 dark:bg-saffron-900/30 dark:text-saffron-400' : 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}
        >
          <Network size={12} />
          Visualizer
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500 text-center">
          No active structure detected.
        </span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-600 max-w-[250px] text-center">
          Standard variables will appear in the Variables tab. Arrays, trees, linked lists, and matrices render here automatically.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {treePreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 shadow-[1px_1px_0_#0f172a]">
              Tree Visualizer
            </span>
          </div>
          <TreePanel
            preview={treePreview}
            themeColor={themeColor}
            onEnlarge={() => setEnlargedType('tree')}
          />
        </div>
      )}
      {linkedListPreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 shadow-[1px_1px_0_#0f172a]">
              Linked List Visualizer
            </span>
          </div>
          <LinkedListPanel
            preview={linkedListPreview}
            themeColor={themeColor}
            onEnlarge={() => setEnlargedType('list')}
          />
        </div>
      )}
      {graphPreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 shadow-[1px_1px_0_#0f172a]">
              Graph Visualizer
            </span>
          </div>
          <GraphPanel
            preview={graphPreview}
            themeColor={themeColor}
            onEnlarge={() => setEnlargedType('graph')}
          />
        </div>
      )}
      {heapPreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 shadow-[1px_1px_0_#0f172a]">
              Heap Visualizer
            </span>
          </div>
          <HeapPanel
            preview={heapPreview}
            themeColor={themeColor}
            onEnlarge={() => setEnlargedType('heap')}
          />
        </div>
      )}
      {stackQueuePreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 shadow-[1px_1px_0_#0f172a]">
              Stack / Queue Visualizer
            </span>
          </div>
          <StackQueuePanel
            preview={stackQueuePreview}
            themeColor={themeColor}
            onEnlarge={() => setEnlargedType('stackqueue')}
          />
        </div>
      )}
      {hashMapPreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 shadow-[1px_1px_0_#0f172a]">
              Hash Map Visualizer
            </span>
          </div>
          <HashMapPanel
            preview={hashMapPreview}
            themeColor={themeColor}
            prevVariables={prevVariables}
            onEnlarge={() => setEnlargedType('hashmap')}
          />
        </div>
      )}
      {arrayGridPreview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-[1px_1px_0_#0f172a]">
              Array Visualizer
            </span>
          </div>
          <ArrayGridVisualizer
            variables={variables}
            prevVariables={prevVariables}
            themeColor={themeColor}
            arrayViewType={arrayViewType}
            onEnlarge={() => setEnlargedType('array')}
          />
        </div>
      )}

      {/* Enlarged Diagram Modal Overlay */}
      <DiagramModal
        isOpen={enlargedType !== null}
        onClose={() => setEnlargedType(null)}
        title={
          enlargedType === 'tree' ? treePreview?.sourceName || 'Tree'
          : enlargedType === 'list' ? linkedListPreview?.sourceName || 'Linked List'
          : enlargedType === 'graph' ? graphPreview?.sourceName || 'Graph'
          : enlargedType === 'heap' ? heapPreview?.sourceName || 'Heap'
          : enlargedType === 'hashmap' ? hashMapPreview?.sourceName || 'HashMap'
          : enlargedType === 'stackqueue' ? stackQueuePreview?.sourceName || 'Stack/Queue'
          : arrayGridPreview?.sourceName || 'Array/Matrix'
        }
        themeColor={themeColor}
      >
        <div className="w-full p-2">
          {enlargedType === 'tree' && treePreview && (
            <TreePanel preview={treePreview} themeColor={themeColor} />
          )}
          {enlargedType === 'list' && linkedListPreview && (
            <LinkedListPanel preview={linkedListPreview} themeColor={themeColor} />
          )}
          {enlargedType === 'graph' && graphPreview && (
            <GraphPanel preview={graphPreview} themeColor={themeColor} />
          )}
          {enlargedType === 'heap' && heapPreview && (
            <HeapPanel preview={heapPreview} themeColor={themeColor} />
          )}
          {enlargedType === 'hashmap' && hashMapPreview && (
            <HashMapPanel preview={hashMapPreview} themeColor={themeColor} prevVariables={prevVariables} />
          )}
          {enlargedType === 'stackqueue' && stackQueuePreview && (
            <StackQueuePanel preview={stackQueuePreview} themeColor={themeColor} />
          )}
          {enlargedType === 'array' && arrayGridPreview && (
            <ArrayGridVisualizer
              variables={variables}
              prevVariables={prevVariables}
              themeColor={themeColor}
              arrayViewType={arrayViewType}
            />
          )}
        </div>
      </DiagramModal>
    </div>
  );
};

export default StructureVisualizer;
