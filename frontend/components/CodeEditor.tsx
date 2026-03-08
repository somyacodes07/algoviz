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
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language = 'javascript', onChange, currentLine, readOnly = false, isError, theme = 'light', themeColor = 'saffron' }) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    // Ensure editor, monaco instance, and model are available before attempting updates
    if (!editorRef.current || !monaco || !editorRef.current.getModel()) return;

    if (!currentLine) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        return;
    }

    const lineToHighlight = currentLine;
    
    // Determine classes based on themeColor and dark/light mode
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
             // Blue theme
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
        }}
      />
    </div>
  );
};

export default CodeEditor;