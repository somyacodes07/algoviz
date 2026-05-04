import React, { useRef } from 'react';
import { VariableMap } from '../../types';
import { ThemeColor } from '../theme/theme';
import {
  buildLinkedListPreview,
  LinkedListPanel,
  LinkedListPreview,
} from './visualizer/LinkedListVisualizer';
import {
  buildGraphPreview,
  GraphPanel,
  GraphPreview,
} from './visualizer/GraphVisualizer';
import {
  buildTreePreview,
  TreePanel,
  TreePreview,
} from './visualizer/TreeVisualizer';

interface StructureVisualizerProps {
  variables: VariableMap;
  themeColor: ThemeColor;
}

/**
 * StructureVisualizer is "sticky" — once a structure (tree, linked list, or
 * graph) is detected, it keeps showing the last known version even when the
 * current execution step enters a scope that doesn't contain the structure
 * variable (e.g. inside a recursive call).  This prevents the visualizer
 * from flickering / vanishing on every step.
 */
const StructureVisualizer: React.FC<StructureVisualizerProps> = ({ variables, themeColor }) => {
  const lastTree = useRef<TreePreview | null>(null);
  const lastLinkedList = useRef<LinkedListPreview | null>(null);
  const lastGraph = useRef<GraphPreview | null>(null);

  // Try to detect structures from the current step's variables
  const freshTree = buildTreePreview(variables);
  const freshLinkedList = buildLinkedListPreview(variables);
  const freshGraph = buildGraphPreview(variables);

  // Update refs when a fresh detection succeeds
  if (freshTree) lastTree.current = freshTree;
  if (freshLinkedList) lastLinkedList.current = freshLinkedList;
  if (freshGraph) lastGraph.current = freshGraph;

  // Use fresh values if available, otherwise fall back to last known
  const treePreview = freshTree || lastTree.current;
  const linkedListPreview = freshLinkedList || lastLinkedList.current;
  const graphPreview = freshGraph || lastGraph.current;

  if (!treePreview && !linkedListPreview && !graphPreview) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {treePreview && <TreePanel preview={treePreview} themeColor={themeColor} />}
      {!treePreview && linkedListPreview && (
        <LinkedListPanel preview={linkedListPreview} themeColor={themeColor} />
      )}
      {!treePreview && !linkedListPreview && graphPreview && (
        <GraphPanel preview={graphPreview} themeColor={themeColor} />
      )}
    </div>
  );
};

export default StructureVisualizer;
