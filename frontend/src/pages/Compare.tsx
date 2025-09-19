import { useState } from 'react'
import { GitCompare, ArrowLeftRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultsDisplay from '../components/ResultsDisplay'
import { harwiseAPI } from '../services/api'

export default function Compare() {
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<{ file1?: File; file2?: File }>({})
  const [comparisonResult, setComparisonResult] = useState<string | null>(null)

  const handleFile1Selected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFiles(prev => ({ ...prev, file1: selectedFiles[0] }))
    }
  }

  const handleFile2Selected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFiles(prev => ({ ...prev, file2: selectedFiles[0] }))
    }
  }

  const handleCompare = async () => {
    if (!files.file1 || !files.file2) {
      toast.error('Please select both HAR files to compare')
      return
    }

    setIsLoading(true)
    setComparisonResult(null)

    try {
      const response = await harwiseAPI.compareFiles(files.file1, files.file2)
      
      if (response.success && response.data) {
        setComparisonResult(response.data)
        toast.success('Comparison completed successfully!')
      } else {
        toast.error(response.error || 'Failed to compare files')
      }
    } catch (error) {
      toast.error('An error occurred during comparison')
    } finally {
      setIsLoading(false)
    }
  }

  const canCompare = files.file1 && files.file2 && !isLoading

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compare HAR Files</h1>
        <p className="mt-2 text-gray-600">
          Compare two HAR files to identify differences in requests, responses, and performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* File 1 Upload */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Baseline HAR File
              {files.file1 && (
                <span className="ml-2 text-sm font-normal text-green-600">
                  ✓ {files.file1.name}
                </span>
              )}
            </h2>
            <FileUpload 
              onFilesSelected={handleFile1Selected}
              disabled={isLoading}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload baseline file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This will be your reference point for comparison
                  </p>
                </div>
              </div>
            </FileUpload>
          </div>

          {/* Comparison Arrow */}
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-3 shadow-md border-2 border-gray-200">
              <ArrowLeftRight className="h-6 w-6 text-gray-400" />
            </div>
          </div>

          {/* File 2 Upload */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Comparison HAR File
              {files.file2 && (
                <span className="ml-2 text-sm font-normal text-green-600">
                  ✓ {files.file2.name}
                </span>
              )}
            </h2>
            <FileUpload 
              onFilesSelected={handleFile2Selected}
              disabled={isLoading}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg">
                    <span className="text-purple-600 font-semibold">2</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload comparison file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This will be compared against the baseline
                  </p>
                </div>
              </div>
            </FileUpload>
          </div>

          {/* Compare Button */}
          <div className="card">
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                canCompare
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Comparing files...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <GitCompare className="h-5 w-5 mr-2" />
                  Compare Files
                </div>
              )}
            </button>
            
            {!files.file1 || !files.file2 ? (
              <p className="text-xs text-gray-500 text-center mt-2">
                Upload both files to enable comparison
              </p>
            ) : null}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {comparisonResult ? (
            <ResultsDisplay
              title="Comparison Results"
              content={comparisonResult}
              type="markdown"
              downloadFileName="har-comparison.md"
            />
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <GitCompare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Comparison Yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload two HAR files and click compare to see the differences
                </p>
                
                {(files.file1 || files.file2) && (
                  <div className="mt-4 text-xs text-gray-400">
                    {files.file1 ? '✓ Baseline file uploaded' : '○ Upload baseline file'}
                    <br />
                    {files.file2 ? '✓ Comparison file uploaded' : '○ Upload comparison file'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}