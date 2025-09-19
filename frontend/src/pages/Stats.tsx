import { useState } from 'react'
import { BarChart3, Clock, HardDrive, Globe, Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import { harwiseAPI, HarStats } from '../services/api'

export default function Stats() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<HarStats | null>(null)

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setIsLoading(true)
    setStats(null)

    try {
      const response = await harwiseAPI.getStats(file)
      
      if (response.success && response.data) {
        setStats(response.data)
        toast.success('Statistics generated successfully!')
      } else {
        toast.error(response.error || 'Failed to generate statistics')
      }
    } catch (error) {
      toast.error('An error occurred while generating statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HAR Statistics</h1>
        <p className="mt-2 text-gray-600">
          Upload a HAR file to analyze request patterns, timing, and performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload HAR File</h2>
            <FileUpload 
              onFilesSelected={handleFileSelected}
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="mt-4">
                <LoadingSpinner text="Analyzing HAR file..." />
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {stats ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Requests"
                  value={stats.totalRequests.toString()}
                  icon={Activity}
                  color="blue"
                />
                <StatsCard
                  title="Average Time"
                  value={formatTime(stats.averageTime)}
                  icon={Clock}
                  color="green"
                />
                <StatsCard
                  title="Average Size"
                  value={formatBytes(stats.averageSize)}
                  icon={HardDrive}
                  color="purple"
                />
                <StatsCard
                  title="Unique Domains"
                  value={stats.domains?.length?.toString() || '0'}
                  icon={Globe}
                  color="orange"
                />
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Codes */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status Codes</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.statusCodes).map(([code, count]) => (
                      <div key={code} className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          code.startsWith('2') ? 'bg-green-100 text-green-800' :
                          code.startsWith('3') ? 'bg-yellow-100 text-yellow-800' :
                          code.startsWith('4') ? 'bg-red-100 text-red-800' :
                          code.startsWith('5') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {code}
                        </span>
                        <span className="text-sm text-gray-600">{count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HTTP Methods */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">HTTP Methods</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.methods || {}).map(([method, count]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {method}
                        </span>
                        <span className="text-sm text-gray-600">{count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Domains */}
              {stats.domains && stats.domains.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Domains</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stats.domains.map((domain, index) => (
                      <div key={index} className="px-3 py-2 bg-gray-50 rounded text-sm">
                        {domain}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Statistics Yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a HAR file to see detailed statistics and analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}