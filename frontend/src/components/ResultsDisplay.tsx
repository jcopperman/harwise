import { ReactNode, useState } from 'react'
import { Copy, Download, Eye, Code } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface ResultsDisplayProps {
  title: string
  content: string | Record<string, string>
  type: 'text' | 'json' | 'markdown' | 'html' | 'files'
  downloadFileName?: string
  className?: string
}

export default function ResultsDisplay({
  title,
  content,
  type,
  downloadFileName,
  className
}: ResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')

  const handleCopy = async () => {
    try {
      const textContent = typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2)
      await navigator.clipboard.writeText(textContent)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    const textContent = typeof content === 'string' 
      ? content 
      : JSON.stringify(content, null, 2)
    
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFileName || `${title.toLowerCase().replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('File downloaded!')
  }

  const renderContent = (): ReactNode => {
    if (type === 'files' && typeof content === 'object') {
      return (
        <div className="space-y-4">
          {Object.entries(content).map(([filename, fileContent]) => (
            <div key={filename} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{filename}</h4>
                <button
                  onClick={() => handleDownload()}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Download
                </button>
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                <code>{fileContent}</code>
              </pre>
            </div>
          ))}
        </div>
      )
    }

    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)

    if (viewMode === 'preview') {
      switch (type) {
        case 'json':
          return (
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
              <code>{JSON.stringify(JSON.parse(textContent), null, 2)}</code>
            </pre>
          )
        case 'markdown':
          return (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            </div>
          )
        case 'html':
          return (
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          )
        default:
          return (
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {textContent}
            </pre>
          )
      }
    }

    return (
      <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <code>{textContent}</code>
      </pre>
    )
  }

  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        
        <div className="flex items-center space-x-2">
          {type !== 'files' && (
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('preview')}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-l-md border',
                  viewMode === 'preview'
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                )}
              >
                <Eye className="h-3 w-3 mr-1 inline" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-r-md border-l-0 border',
                  viewMode === 'raw'
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                )}
              >
                <Code className="h-3 w-3 mr-1 inline" />
                Raw
              </button>
            </div>
          )}
          
          <button
            onClick={handleCopy}
            className="btn-secondary text-xs py-1 px-2"
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </button>
          
          <button
            onClick={handleDownload}
            className="btn-primary text-xs py-1 px-2"
            title="Download file"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}