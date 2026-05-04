import React from 'react';
import { VariableMap } from '../../types';
import { ThemeColor } from '../theme/theme';
import { buildLinkedListPreview, LinkedListPanel } from './visualizer/LinkedListVisualizer';
import { buildGraphPreview, GraphPanel } from './visualizer/GraphVisualizer';
import { buildTreePreview, TreePanel } from './visualizer/TreeVisualizer';

interface StructureVisualizerProps {
  variables: VariableMap;
  themeColor: ThemeColor;
}

const StructureVisualizer: React.FC<StructureVisualizerProps> = ({ variables, themeColor }) => {
  const linkedListPreview = buildLinkedListPreview(variables);
  const graphPreview = buildGraphPreview(variables);
  const treePreview = buildTreePreview(variables);

  if (!linkedListPreview && !graphPreview && !treePreview) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {treePreview && <TreePanel preview={treePreview} themeColor={themeColor} />}
      {!treePreview && linkedListPreview && <LinkedListPanel preview={linkedListPreview} themeColor={themeColor} />}
      {!treePreview && graphPreview && <GraphPanel preview={graphPreview} themeColor={themeColor} />}
    </div>
  );
};

export default StructureVisualizer;
