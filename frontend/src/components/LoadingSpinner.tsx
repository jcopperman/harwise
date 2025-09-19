import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <Loader2 className={clsx(sizeClasses[size], 'animate-spin text-primary-600')} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  )
}