import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange: (value: string | undefined) => void;
  currentLine?: number;
  readOnly?: boolean;
  isError?: boolean;
  theme?: 'light' | 'dark';
  themeColor?: 'saffron' | 'blue';
  breakpoints?: Set<number>;
  onToggleBreakpoint?: (line: number) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language = 'javascript', onChange, currentLine, readOnly = false, isError, theme = 'light', themeColor = 'saffron', breakpoints, onToggleBreakpoint }) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const breakpointDecorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Listen for gutter clicks to toggle breakpoints
    editor.onMouseDown((e: any) => {
      if (e.target?.type === 2 || e.target?.type === 3 || e.target?.type === 4) {
        // Types 2, 3, 4 = gutter margin, line numbers, glyph margin
        const line = e.target.position?.lineNumber;
        if (line && onToggleBreakpoint) {
          onToggleBreakpoint(line);
        }
      }
    });
  };

  // Line highlight decorations
  useEffect(() => {
    if (!editorRef.current || !monaco || !editorRef.current.getModel()) return;

    if (!currentLine) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        return;
    }

    const lineToHighlight = currentLine;
    
    let className = '';
    let glyphClass = '';

    if (isError) {
        className = theme === 'dark' ? 'bg-red-900/40 border-l-4 border-red-500' : 'bg-red-100 border-l-4 border-red-500';
        glyphClass = 'bg-red-500 w-2';
    } else {
        if (themeColor === 'saffron') {
             className = theme === 'dark' ? 'bg-saffron-900/30 border-l-4 border-saffron-500' : 'bg-saffron-100 border-l-4 border-saffron-500';
             glyphClass = 'bg-saffron-500 w-2';
        } else {
             className = theme === 'dark' ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-100 border-l-4 border-blue-500';
             glyphClass = 'bg-blue-500 w-2';
        }
    }

    try {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
            range: new monaco.Range(lineToHighlight, 1, lineToHighlight, 1),
            options: {
            isWholeLine: true,
            className: className,
            glyphMarginClassName: glyphClass
            }
        }
        ]);
        
        editorRef.current.revealLineInCenter(lineToHighlight);
    } catch (e) {
        console.warn("Monaco Editor error:", e);
    }

  }, [currentLine, monaco, isError, theme, themeColor]);

  // Breakpoint decorations
  useEffect(() => {
    if (!editorRef.current || !monaco || !editorRef.current.getModel()) return;

    const bpDecorations = Array.from(breakpoints || []).map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpoint-glyph',
        stickiness: 1 // AlwaysGrowsWhenTypingAtEdges
      }
    }));

    breakpointDecorationsRef.current = editorRef.current.deltaDecorations(
      breakpointDecorationsRef.current,
      bpDecorations
    );
  }, [breakpoints, monaco]);

  // Map our language IDs to Monaco's
  const monacoLanguage = language === 'c++' ? 'cpp' : 'javascript';

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        theme={theme === 'dark' ? "vs-dark" : "light"}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono',
          lineHeight: 24,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          renderLineHighlight: "none",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          readOnly: readOnly,
          glyphMargin: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;