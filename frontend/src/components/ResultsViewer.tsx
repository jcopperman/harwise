import React from 'react';
import { ClockIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FileContext';

const ResultsViewer: React.FC = () => {
  const { results, clearResults } = useFiles();

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCommandIcon = () => {
    return <DocumentTextIcon className="h-5 w-5" />;
  };

  const getCommandColor = (command: string) => {
    const colors: Record<string, string> = {
      'stats': 'bg-blue-100 text-blue-800',
      'gen-tests': 'bg-green-100 text-green-800',
      'test': 'bg-yellow-100 text-yellow-800',
      'compare': 'bg-purple-100 text-purple-800',
      'gen-insomnia': 'bg-pink-100 text-pink-800',
      'gen-curl': 'bg-indigo-100 text-indigo-800',
    };
    return colors[command] || 'bg-gray-100 text-gray-800';
  };

  const downloadResult = (result: any, index: number) => {
    const content = typeof result.result === 'object' 
      ? JSON.stringify(result.result, null, 2)
      : result.result;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harwise-${result.command}-${index + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Run some commands to see results here. All command outputs will be displayed in this section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Command Results ({results.length})
        </h3>
        <button
          onClick={clearResults}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getCommandIcon()}
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommandColor(result.command)}`}>
                      {result.command}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTimestamp(result.timestamp)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => downloadResult(result, index)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Download
                </button>
              </div>
            </div>
            
            <div className="px-4 py-4">
              {/* Command Parameters */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Parameters:</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  {result.fileId && (
                    <div><strong>File ID:</strong> {result.fileId}</div>
                  )}
                  {result.fileId1 && (
                    <div><strong>First File:</strong> {result.fileId1}</div>
                  )}
                  {result.fileId2 && (
                    <div><strong>Second File:</strong> {result.fileId2}</div>
                  )}
                  {result.config && (
                    <div className="mt-2">
                      <strong>Config:</strong>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border">
                        {JSON.stringify(result.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Command Output */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Output:</h4>
                <div className="bg-black text-green-400 rounded p-4 overflow-auto max-h-96 font-mono text-sm">
                  {result.result.success ? (
                    <pre className="whitespace-pre-wrap">{result.result.output}</pre>
                  ) : (
                    <div className="text-red-400">
                      <strong>Error:</strong> {result.result.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsViewer;