// pages/editor.tsx

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios, { isAxiosError } from 'axios';
import Navbar from "@/components/navbar";
//import "../styles/editor.css";
import { useRouter } from 'next/router';
import "../app/globals.css";

// Dynamically import the Monaco Editor to prevent SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Supported programming languages
type Language =
  | 'python'
  | 'javascript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'ruby'
  | 'go'
  | 'php'
  | 'rust'
  | 'swift';

// Language options for the dropdown
const languageOptions: Array<{ value: Language; label: string }> = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];

// Default code snippets for each language
const defaultCode: Record<Language, string> = {
  python: '# Write your Python code here',
  javascript: '// Write your JavaScript code here',
  java:
    'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}',
  c: '/* Write your C code here */\n#include <stdio.h>\n\nint main() {\n    return 0;\n}',
  cpp: '/* Write your C++ code here */\n#include <iostream>\n\nint main() {\n    return 0;\n}',
  ruby: '# Write your Ruby code here',
  go: '// Write your Go code here\npackage main\n\nfunc main() {\n\n}',
  php: '<?php\n// Write your PHP code here\n',
  rust: '// Write your Rust code here\nfn main() {\n    \n}',
  swift: '// Write your Swift code here\nimport Foundation\n',
};

// Map language codes for Monaco Editor
const monacoLanguageMap: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  ruby: 'ruby',
  go: 'go',
  php: 'php',
  rust: 'rust',
  swift: 'swift',
};

const EditorPage = () => {
  const router = useRouter();
  const { code: queryCode } = router.query; // Get the code from query parameters

  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState(defaultCode['python']);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [stderr, setStderr] = useState('');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (queryCode && typeof queryCode === 'string') {
      // Decode the template code
      const decodedCode = decodeURIComponent(queryCode);
      setCode(decodedCode);
    }
  }, [queryCode]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = event.target.value as Language;
    setLanguage(selectedLanguage);
    setCode(defaultCode[selectedLanguage] || '');
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput('');
    setStderr('');
    setExitCode(null);

    try {
      const response = await axios.post('/api/execution/execute', {
        language,
        code,
        stdin,
      });

      const { stdout, stderr, exitCode, error } = response.data;

      if (error) {
        setStderr(error);
      } else {
        setOutput(stdout);
        setStderr(stderr);
        setExitCode(exitCode);
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setStderr(err.response?.data?.error || 'An error occurred.');
      } else {
        setStderr('An error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    router.push({
      pathname: "/templatecreation",
      query: { code },
    });
  };

  return (
    <div>
      <Navbar /> {/* Stretches across the page */}
      <main className="container">
        <h1 className="title">Code Editor</h1>
        <div className="language-selector-container">
          <div className="language-selector">
            <label className="label">Select Language:</label>
            <select className="select" value={language} onChange={handleLanguageChange}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`button ${isLoading ? 'button-disabled' : ''}`}
            onClick={handleRunCode}
            disabled={isLoading}
          >
            {isLoading ? 'Running...' : 'Run Code'}
          </button>

          <button className="button create-template-button" onClick={handleCreateTemplate}>
            Create Template
          </button>
        </div>
        

        <div className="monaco-editor-container">
          <MonacoEditor
            height="400px"
            defaultLanguage={monacoLanguageMap[language]}
            language={monacoLanguageMap[language]}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-light"
            options={{
              selectOnLineNumbers: true,
            }}
          />
        </div>

        <div className="input-container">
          <label className="label">Standard Input (stdin):</label>
          <textarea
            className="textarea"
            rows={4}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          ></textarea>
        </div>

        <div className="output-container">
          <h2 className="output-title">Output:</h2>
          <pre className="output">{output || 'No output'}</pre>

          {stderr && (
            <>
              <h2 className="error-title">Error Output:</h2>
              <pre className="error-output">{stderr}</pre>
            </>
          )}

          {exitCode !== null && (
            <p className="exit-code">
              <strong>Exit Code:</strong> {exitCode}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default EditorPage;
