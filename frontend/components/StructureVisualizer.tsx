import React from 'react';
import { VariableMap } from '../../types';
import { ThemeColor } from '../theme/theme';
import { buildLinkedListPreview, LinkedListPanel } from './visualizer/LinkedListVisualizer';
import { buildGraphPreview, GraphPanel } from './visualizer/GraphVisualizer';

interface StructureVisualizerProps {
  variables: VariableMap;
  themeColor: ThemeColor;
}

const StructureVisualizer: React.FC<StructureVisualizerProps> = ({ variables, themeColor }) => {
  const linkedListPreview = buildLinkedListPreview(variables);
  const graphPreview = buildGraphPreview(variables);

  if (!linkedListPreview && !graphPreview) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-2">
      {linkedListPreview && <LinkedListPanel preview={linkedListPreview} themeColor={themeColor} />}
      {graphPreview && <GraphPanel preview={graphPreview} themeColor={themeColor} />}
    </div>
  );
};

export default StructureVisualizer;
