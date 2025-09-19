import React, { useState } from 'react';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FileContext';
import axios from 'axios';

interface CommandPanelProps {
  command: string;
}

const CommandPanel: React.FC<CommandPanelProps> = ({ command }) => {
  const { files, selectedFile, setSelectedFile, selectedFile2, setSelectedFile2, addResult } = useFiles();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const commandTitles: Record<string, string> = {
    'stats': 'HAR File Statistics',
    'gen-tests': 'Generate Test Cases',
    'test': 'Run Performance Tests',
    'compare': 'Compare HAR Files',
    'gen-insomnia': 'Generate Insomnia Collection',
    'gen-curl': 'Generate cURL Commands',
  };

  const commandDescriptions: Record<string, string> = {
    'stats': 'Analyze HAR file and display detailed statistics about requests, responses, and performance metrics.',
    'gen-tests': 'Generate automated test cases based on the requests found in your HAR file.',
    'test': 'Execute performance tests against the endpoints found in your HAR file.',
    'compare': 'Compare two HAR files to identify differences in requests, responses, or performance.',
    'gen-insomnia': 'Create an Insomnia REST client collection from your HAR file requests.',
    'gen-curl': 'Generate cURL commands for all requests found in your HAR file.',
  };

  const executeCommand = async () => {
    if (!selectedFile && command !== 'compare') {
      alert('Please select a HAR file first');
      return;
    }

    if (command === 'compare' && (!selectedFile || !selectedFile2)) {
      alert('Please select two HAR files to compare');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      const requestBody: any = {};

      if (command === 'compare') {
        requestBody.fileId1 = selectedFile;
        requestBody.fileId2 = selectedFile2;
      } else {
        requestBody.fileId = selectedFile;
      }

      if (config.trim() && (command === 'gen-tests' || command === 'test')) {
        try {
          requestBody.config = JSON.parse(config);
        } catch (error) {
          alert('Invalid JSON configuration');
          setIsLoading(false);
          return;
        }
      }

      response = await axios.post(`http://localhost:3001/api/${command}`, requestBody);

      addResult({
        command,
        ...requestBody,
        result: response.data,
      });

      alert(`${commandTitles[command]} completed! Check the Results tab.`);
    } catch (error: any) {
      console.error('Command failed:', error);
      alert(`Command failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const needsConfig = command === 'gen-tests' || command === 'test';
  const needsTwoFiles = command === 'compare';

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {commandTitles[command]}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {commandDescriptions[command]}
          </p>

          {/* File Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {needsTwoFiles ? 'First HAR File' : 'Select HAR File'}
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose a file...</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name} ({new Date(file.created).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {needsTwoFiles && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second HAR File
                </label>
                <select
                  value={selectedFile2 || ''}
                  onChange={(e) => setSelectedFile2(e.target.value || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a file...</option>
                  {files.filter(f => f.id !== selectedFile).map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name} ({new Date(file.created).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Configuration */}
            {needsConfig && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Configuration (Optional)
                  </label>
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-1" />
                    {showConfig ? 'Hide' : 'Show'} Config
                  </button>
                </div>
                {showConfig && (
                  <textarea
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    placeholder='{"baseUrl": "https://api.example.com", "timeout": 5000}'
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    rows={6}
                  />
                )}
              </div>
            )}

            {/* Execute Button */}
            <div className="pt-4">
              <button
                onClick={executeCommand}
                disabled={isLoading || files.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Processing...' : `Run ${commandTitles[command]}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Upload your HAR files using the "Upload Files" tab</li>
          <li>2. Select the appropriate file(s) for this command</li>
          {needsConfig && <li>3. Optionally configure command parameters using JSON</li>}
          <li>{needsConfig ? '4' : '3'}. Click "Run" to execute the command</li>
          <li>{needsConfig ? '5' : '4'}. Check the "Results" tab to view the output</li>
        </ul>
      </div>
    </div>
  );
};

export default CommandPanel;