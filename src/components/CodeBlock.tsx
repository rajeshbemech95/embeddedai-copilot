import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = "c", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950 overflow-hidden my-3 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium">{filename || language.toUpperCase()}</span>
        </div>
        <button
          id={`copy-code-btn-${language}`}
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
