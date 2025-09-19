import { useState } from 'react'
import { Code, FileText, Terminal, Cog } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultsDisplay from '../components/ResultsDisplay'
import { harwiseAPI } from '../services/api'

type GenerationType = 'tests' | 'insomnia' | 'curl'

export default function Generate() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<GenerationType>('tests')
  const [results, setResults] = useState<{
    type: GenerationType
    content: string | Record<string, string>
  } | null>(null)

  const generationTypes = [
    {
      id: 'tests' as const,
      name: 'Test Files',
      description: 'Generate automated test suites',
      icon: Code,
      color: 'blue'
    },
    {
      id: 'insomnia' as const,
      name: 'Insomnia Collection',
      description: 'Export API requests to Insomnia',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'curl' as const,
      name: 'cURL Suite',
      description: 'Generate shell scripts for testing',
      icon: Terminal,
      color: 'green'
    }
  ]

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setIsLoading(true)
    setResults(null)

    try {
      let response
      
      switch (selectedType) {
        case 'tests':
          response = await harwiseAPI.generateTests(file)
          break
        case 'insomnia':
          response = await harwiseAPI.generateInsomnia(file)
          break
        case 'curl':
          response = await harwiseAPI.generateCurl(file)
          break
      }
      
      if (response.success && response.data) {
        setResults({
          type: selectedType,
          content: response.data
        })
        toast.success(`${generationTypes.find(t => t.id === selectedType)?.name} generated successfully!`)
      } else {
        toast.error(response.error || 'Failed to generate files')
      }
    } catch (error) {
      toast.error('An error occurred during generation')
    } finally {
      setIsLoading(false)
    }
  }

  const getResultType = () => {
    switch (selectedType) {
      case 'tests':
        return 'files'
      case 'insomnia':
        return 'json'
      case 'curl':
        return 'text'
      default:
        return 'text'
    }
  }

  const getDownloadFileName = () => {
    switch (selectedType) {
      case 'tests':
        return 'test-suite.zip'
      case 'insomnia':
        return 'insomnia-collection.json'
      case 'curl':
        return 'curl-suite.sh'
      default:
        return 'generated-file.txt'
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Files</h1>
        <p className="mt-2 text-gray-600">
          Convert HAR files into test suites, API collections, or cURL scripts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Generation Type Selection */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Generation Type</h2>
            <div className="space-y-3">
              {generationTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 p-2 rounded ${
                        type.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        type.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {type.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* File Upload */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload HAR File</h2>
            <FileUpload 
              onFilesSelected={handleFileSelected}
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="mt-4">
                <LoadingSpinner 
                  text={`Generating ${generationTypes.find(t => t.id === selectedType)?.name}...`} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {results ? (
            <ResultsDisplay
              title={`Generated ${generationTypes.find(t => t.id === results.type)?.name}`}
              content={results.content}
              type={getResultType()}
              downloadFileName={getDownloadFileName()}
            />
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <Cog className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Files Generated</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a generation type and upload a HAR file to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}