import { Upload, FileText, BarChart3, GitCompare, Cog } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Harwise Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Process HAR files to generate tests, reports, and perform analysis
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <QuickActionCard
          title="Upload HAR Files"
          description="Upload and manage your HAR files"
          icon={Upload}
          href="/generate"
          color="blue"
        />
        <QuickActionCard
          title="Compare Files"
          description="Compare two HAR files for differences"
          icon={GitCompare}
          href="/compare"
          color="green"
        />
        <QuickActionCard
          title="Generate Tests"
          description="Create automated test suites"
          icon={Cog}
          href="/generate"
          color="purple"
        />
        <QuickActionCard
          title="View Stats"
          description="Analyze HAR file statistics"
          icon={BarChart3}
          href="/stats"
          color="orange"
        />
      </div>

      {/* Recent Files */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Files</h2>
        <div className="text-gray-500 text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No files uploaded yet</p>
          <p className="text-sm">Upload a HAR file to get started</p>
        </div>
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: any
  href: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
  }

  return (
    <a
      href={href}
      className="group block card hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </a>
  )
}