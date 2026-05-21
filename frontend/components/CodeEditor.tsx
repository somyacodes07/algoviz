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

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = 'javascript',
  onChange,
  currentLine,
  readOnly = false,
  isError,
  theme = 'light',
  themeColor = 'saffron',
  breakpoints,
  onToggleBreakpoint,
}) => {
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
      className = theme === 'dark' ? 'editor-line-error-dark' : 'editor-line-error-light';
      glyphClass = 'bg-red-500 w-2';
    } else {
      if (themeColor === 'saffron') {
        className =
          theme === 'dark' ? 'editor-line-active-saffron-dark' : 'editor-line-active-saffron-light';
        glyphClass = 'editor-glyph-saffron';
      } else {
        className =
          theme === 'dark' ? 'editor-line-active-blue-dark' : 'editor-line-active-blue-light';
        glyphClass = 'editor-glyph-blue';
      }
    }

    try {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(lineToHighlight, 1, lineToHighlight, 1),
          options: {
            isWholeLine: true,
            className: className,
            glyphMarginClassName: glyphClass,
          },
        },
      ]);

      editorRef.current.revealLineInCenter(lineToHighlight);
    } catch (e) {
      console.warn('Monaco Editor error:', e);
    }
  }, [currentLine, monaco, isError, theme, themeColor]);

  // Breakpoint decorations
  useEffect(() => {
    if (!editorRef.current || !monaco || !editorRef.current.getModel()) return;

    const bpDecorations = (Array.from(breakpoints || []) as number[]).map((line: number) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'breakpoint-glyph',
        stickiness: 1, // AlwaysGrowsWhenTypingAtEdges
      },
    }));

    breakpointDecorationsRef.current = editorRef.current.deltaDecorations(
      breakpointDecorationsRef.current,
      bpDecorations,
    );
  }, [breakpoints, monaco]);

  // Define Custom IDE Themes before the editor mounts to prevent light theme flash
  const handleEditorWillMount = (monaco: any) => {
    // Light Theme
    monaco.editor.defineTheme('algoviz-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorLineNumber.foreground': '#94a3b8',
        'editorGutter.background': '#ffffff',
      },
    });

    // Dark Saffron Theme
    monaco.editor.defineTheme('algoviz-dark-saffron', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#221c14',
        'editor.lineHighlightBackground': '#2c241a',
        'editorLineNumber.foreground': '#78716c',
        'editorGutter.background': '#221c14',
      },
    });

    // Dark Blue Theme
    monaco.editor.defineTheme('algoviz-dark-blue', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#141c30',
        'editor.lineHighlightBackground': '#1a253e',
        'editorLineNumber.foreground': '#475569',
        'editorGutter.background': '#141c30',
      },
    });
  };

  // Map our language IDs to Monaco's
  const monacoLanguage = language === 'c++' ? 'cpp' : 'javascript';
  const activeTheme = theme === 'light' ? 'algoviz-light' : `algoviz-dark-${themeColor}`;

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        theme={activeTheme}
        value={code}
        onChange={onChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono',
          lineHeight: 24,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderLineHighlight: 'all',
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
