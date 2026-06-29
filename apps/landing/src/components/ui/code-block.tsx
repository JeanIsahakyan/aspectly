import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '../../utils/utils'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
  showLineNumbers?: boolean
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  className,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
          <span className="text-sm text-muted-foreground font-mono">{filename}</span>
          <button
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      {!filename && (
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: filename ? 0 : '0.5rem',
          fontSize: '0.84rem',
          padding: '1.1rem',
          background: 'transparent',
        }}
        codeTagProps={{
          style: {
            fontFamily: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
            background: 'transparent',
          },
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  )
}
