import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Code2, Sparkles, ExternalLink, FileCode } from 'lucide-react';
import { saveAs } from 'file-saver';

interface StandaloneHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENTRY_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SEC Dissolution Word Doc Generator</title>
    <meta name="description" content="Automated generator for Philippine SEC corporate dissolution documents in Microsoft Word (.docx) format with dedicated signatory pages." />
    <meta property="og:title" content="SEC Dissolution Word Doc Generator" />
    <meta property="og:description" content="Automated generator for Philippine SEC corporate dissolution documents in Microsoft Word (.docx) format with dedicated signatory pages." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export const StandaloneHtmlModal: React.FC<StandaloneHtmlModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'standalone' | 'entry'>('standalone');
  const [standaloneHtml, setStandaloneHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && !standaloneHtml && !loading) {
      setLoading(true);
      fetch('/sec-dissolution-generator-standalone.html')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load standalone HTML');
          return res.text();
        })
        .then((text) => {
          setStandaloneHtml(text);
        })
        .catch((err) => {
          console.error('Error fetching standalone HTML:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, standaloneHtml, loading]);

  if (!isOpen) return null;

  const currentCode = activeTab === 'standalone' ? standaloneHtml : ENTRY_INDEX_HTML;

  const handleCopy = async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleDownload = () => {
    if (!currentCode) return;
    const blob = new Blob([currentCode], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'index.html');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Download or Copy <code className="text-blue-600 dark:text-blue-400">index.html</code> Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save as a single portable HTML file that works offline in any web browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('standalone')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'standalone'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Standalone All-in-One <code className="font-mono">index.html</code> (Recommended)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('entry')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'entry'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Vite Project Entry <code className="font-mono">index.html</code>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              disabled={loading || !currentCode}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full HTML Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading || !currentCode}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download index.html</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
          {activeTab === 'standalone' ? (
            <span>
              <strong>Self-Contained Single File:</strong> This file embeds the entire SEC Dissolution Word &amp; PDF Generator (including React, Tailwind CSS, <code className="font-mono">docx</code>, <code className="font-mono">jsPDF</code>, and <code className="font-mono">JSZip</code>) into a single <code className="font-mono">index.html</code> file. Double-click it on any computer to run offline without any server!
            </span>
          ) : (
            <span>
              <strong>Vite Project Entry Point:</strong> This is the lightweight source <code className="font-mono">index.html</code> used inside the React + TypeScript development workspace.
            </span>
          )}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-950 text-slate-100">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading compiled standalone index.html bundle...</span>
            </div>
          ) : (
            <textarea
              readOnly
              value={
                activeTab === 'standalone' && standaloneHtml.length > 50000
                  ? `${standaloneHtml.slice(0, 15000)}\n\n/* ... [${(standaloneHtml.length / 1024).toFixed(0)} KB of bundled application code — Click "Copy Full HTML Code" or "Download index.html" above to get the complete file] ... */\n\n${standaloneHtml.slice(-3000)}`
                  : currentCode
              }
              className="w-full h-72 sm:h-80 font-mono text-xs bg-slate-900 text-emerald-300 p-4 rounded-lg border border-slate-800 focus:outline-hidden resize-none leading-relaxed select-all"
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            {activeTab === 'standalone' && standaloneHtml
              ? `Bundle Size: ${(standaloneHtml.length / (1024 * 1024)).toFixed(2)} MB (100% offline-ready)`
              : 'Source HTML Entry'}
          </span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
