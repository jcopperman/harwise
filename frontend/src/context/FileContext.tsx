import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  created: Date;
}

interface FileContextType {
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  selectedFile: string | null;
  setSelectedFile: (fileId: string | null) => void;
  selectedFile2: string | null;
  setSelectedFile2: (fileId: string | null) => void;
  results: any[];
  addResult: (result: any) => void;
  clearResults: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFile2, setSelectedFile2] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (result: any) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <FileContext.Provider
      value={{
        files,
        setFiles,
        selectedFile,
        setSelectedFile,
        selectedFile2,
        setSelectedFile2,
        results,
        addResult,
        clearResults,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};