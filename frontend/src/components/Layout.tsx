import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  FileText, 
  GitCompare, 
  Cog, 
  PlayCircle,
  Home 
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Compare', href: '/compare', icon: GitCompare },
  { name: 'Generate', href: '/generate', icon: Cog },
  { name: 'Stats', href: '/stats', icon: BarChart3 },
  { name: 'Test', href: '/test', icon: PlayCircle },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <FileText className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Harwise UI
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}