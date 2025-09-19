import { ReactNode } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  onFilesSelected: (files: File[]) => void
  children?: ReactNode
  className?: string
  disabled?: boolean
}

export default function FileUpload({
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB
  onFilesSelected,
  children,
  className,
  disabled = false
}: FileUploadProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
    fileRejections
  } = useDropzone({
    accept: {
      'application/json': ['.har'],
      'application/octet-stream': ['.har']
    },
    multiple,
    maxSize,
    disabled,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles)
      }
    }
  })

  return (
    <div className={clsx('w-full', className)}>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          {
            'border-primary-400 bg-primary-50': isDragActive && !isDragReject,
            'border-red-400 bg-red-50': isDragReject,
            'border-gray-300 hover:border-gray-400': !isDragActive && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        
        {children || (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragReject ? (
                <AlertCircle className="h-12 w-12 text-red-400" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? isDragReject
                    ? 'Invalid file type'
                    : 'Drop files here'
                  : 'Upload HAR files'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {disabled
                  ? 'Upload disabled'
                  : `Drag and drop ${multiple ? 'files' : 'a file'} here, or click to select`
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports .har files up to {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      {acceptedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected files:</h4>
          <ul className="space-y-1">
            {acceptedFiles.map((file, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2 text-green-500" />
                {file.name} ({Math.round(file.size / 1024)}KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejected files */}
      {fileRejections.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-red-900 mb-2">Rejected files:</h4>
          <ul className="space-y-1">
            {fileRejections.map((rejection, index) => (
              <li key={index} className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                {rejection.file.name} - {rejection.errors[0]?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}