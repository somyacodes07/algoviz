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
  const [enlargedType, setEnlargedType] = useState<'tree' | 'list' | 'graph' | 'array' | null>(null);
  const lastTree = useRef<TreePreview | null>(null);
  const lastLinkedList = useRef<LinkedListPreview | null>(null);
  const lastGraph = useRef<GraphPreview | null>(null);
  const lastArrayGrid = useRef<ArrayGridPreview | null>(null);

  // Try to detect structures from the current step's variables
  const freshTree = buildTreePreview(variables);
  const freshLinkedList = buildLinkedListPreview(variables);
  const freshGraph = buildGraphPreview(variables);
  const freshArrayGrid = buildArrayGridPreview(variables, prevVariables);

  // Update refs when a fresh detection succeeds
  if (freshTree) lastTree.current = freshTree;
  if (freshLinkedList) lastLinkedList.current = freshLinkedList;
  if (freshGraph) lastGraph.current = freshGraph;
  if (freshArrayGrid) lastArrayGrid.current = freshArrayGrid;

  // Clear cache ONLY when execution fully restarts
  if (currentStepIndex === 0) {
    lastTree.current = null;
    lastLinkedList.current = null;
    lastGraph.current = null;
    lastArrayGrid.current = null;
  }

  // Use fresh values if available, otherwise fall back to last known
  const treePreview = freshTree || lastTree.current;
  const linkedListPreview = freshLinkedList || lastLinkedList.current;
  const graphPreview = freshGraph || lastGraph.current;
  const arrayGridPreview = freshArrayGrid || lastArrayGrid.current;

  if (!treePreview && !linkedListPreview && !graphPreview && !arrayGridPreview) {
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
    <div className="grid grid-cols-1 gap-3">
      {treePreview && (
        <TreePanel
          preview={treePreview}
          themeColor={themeColor}
          onEnlarge={() => setEnlargedType('tree')}
        />
      )}
      {!treePreview && linkedListPreview && (
        <LinkedListPanel
          preview={linkedListPreview}
          themeColor={themeColor}
          onEnlarge={() => setEnlargedType('list')}
        />
      )}
      {!treePreview && !linkedListPreview && graphPreview && (
        <GraphPanel
          preview={graphPreview}
          themeColor={themeColor}
          onEnlarge={() => setEnlargedType('graph')}
        />
      )}
      {!treePreview && !linkedListPreview && !graphPreview && arrayGridPreview && (
        <ArrayGridVisualizer
          variables={variables}
          prevVariables={prevVariables}
          themeColor={themeColor}
          arrayViewType={arrayViewType}
          onEnlarge={() => setEnlargedType('array')}
        />
      )}

      {/* Enlarged Diagram Modal Overlay */}
      <DiagramModal
        isOpen={enlargedType !== null}
        onClose={() => setEnlargedType(null)}
        title={
          enlargedType === 'tree'
            ? treePreview?.sourceName || 'Tree'
            : enlargedType === 'list'
            ? linkedListPreview?.sourceName || 'Linked List'
            : enlargedType === 'graph'
            ? graphPreview?.sourceName || 'Graph'
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
