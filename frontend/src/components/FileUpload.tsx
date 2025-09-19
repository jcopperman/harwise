import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FileContext';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const { files, setFiles } = useFiles();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.name.endsWith('.har') || file.type === 'application/json') {
        const formData = new FormData();
        formData.append('harFile', file);

        try {
          await axios.post('http://localhost:3001/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Refresh file list
          const filesResponse = await axios.get('http://localhost:3001/api/files');
          setFiles(filesResponse.data);
        } catch (error) {
          console.error('Upload failed:', error);
          alert('Upload failed. Please try again.');
        }
      } else {
        alert('Please upload only HAR files (.har extension or JSON files)');
      }
    }
  }, [setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.har', '.json'],
    },
  });

  const deleteFile = async (fileId: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/files/${fileId}`);
      const filesResponse = await axios.get('http://localhost:3001/api/files');
      setFiles(filesResponse.data);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load files on component mount
  React.useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/files');
        setFiles(response.data);
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    };
    loadFiles();
  }, [setFiles]);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop HAR files here' : 'Upload HAR files'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Drag and drop your HAR files here, or click to select files
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supports .har and .json files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Uploaded Files ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.created).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete file"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-8">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first HAR file.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;