import React, { useState } from 'react';import { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';import reactLogo from './assets/react.svg'

import FileUpload from './components/FileUpload';import viteLogo from '/vite.svg'

import CommandPanel from './components/CommandPanel';import './App.css'

import ResultsViewer from './components/ResultsViewer';

import { FileProvider } from './context/FileContext';function App() {

  const [count, setCount] = useState(0)

const queryClient = new QueryClient();

  return (

function App() {    <>

  const [activeTab, setActiveTab] = useState('upload');      <div>

        <a href="https://vite.dev" target="_blank">

  const tabs = [          <img src={viteLogo} className="logo" alt="Vite logo" />

    { id: 'upload', name: 'Upload Files', component: FileUpload },        </a>

    { id: 'stats', name: 'HAR Stats', component: () => <CommandPanel command="stats" /> },        <a href="https://react.dev" target="_blank">

    { id: 'gen-tests', name: 'Generate Tests', component: () => <CommandPanel command="gen-tests" /> },          <img src={reactLogo} className="logo react" alt="React logo" />

    { id: 'test', name: 'Run Tests', component: () => <CommandPanel command="test" /> },        </a>

    { id: 'compare', name: 'Compare HARs', component: () => <CommandPanel command="compare" /> },      </div>

    { id: 'gen-insomnia', name: 'Generate Insomnia', component: () => <CommandPanel command="gen-insomnia" /> },      <h1>Vite + React</h1>

    { id: 'gen-curl', name: 'Generate cURL', component: () => <CommandPanel command="gen-curl" /> },      <div className="card">

    { id: 'results', name: 'Results', component: ResultsViewer },        <button onClick={() => setCount((count) => count + 1)}>

  ];          count is {count}

        </button>

  return (        <p>

    <QueryClientProvider client={queryClient}>          Edit <code>src/App.tsx</code> and save to test HMR

      <FileProvider>        </p>

        <div className="min-h-screen bg-gray-50">      </div>

          <header className="bg-white shadow">      <p className="read-the-docs">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">        Click on the Vite and React logos to learn more

              <div className="flex justify-between items-center py-6">      </p>

                <div className="flex items-center">    </>

                  <h1 className="text-3xl font-bold text-gray-900">Harwise UI</h1>  )

                  <span className="ml-3 text-sm text-gray-500">HAR File Analysis Tool</span>}

                </div>

              </div>export default App

            </div>
          </header>

          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {/* Tabs */}
              <div className="px-4 sm:px-0">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6 px-4 sm:px-0">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={activeTab === tab.id ? 'block' : 'hidden'}
                  >
                    <tab.component />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </FileProvider>
    </QueryClientProvider>
  );
}

export default App;