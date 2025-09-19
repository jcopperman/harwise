import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for long operations
})

export interface HarStats {
  totalRequests: number
  averageTime: number
  averageSize: number
  statusCodes: Record<string, number>
  domains: string[]
  methods: Record<string, number>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GenerateResponse {
  success: boolean
  type: string
  content: string | Record<string, string>
}

class HarwiseAPI {
  async uploadFile(file: File): Promise<ApiResponse<{ id: string; filename: string }>> {
    const formData = new FormData()
    formData.append('harFile', file)

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.file }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Upload failed' 
      }
    }
  }

  async getStats(file: File): Promise<ApiResponse<HarStats>> {
    const formData = new FormData()
    formData.append('harFile', file)

    try {
      const response = await api.post('/stats', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.stats }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get stats' 
      }
    }
  }

  async compareFiles(file1: File, file2: File): Promise<ApiResponse<string>> {
    const formData = new FormData()
    formData.append('harFile1', file1)
    formData.append('harFile2', file2)

    try {
      const response = await api.post('/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.comparison }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to compare files' 
      }
    }
  }

  async generateTests(file: File): Promise<ApiResponse<Record<string, string>>> {
    return this.generate(file, 'tests')
  }

  async generateInsomnia(file: File): Promise<ApiResponse<string>> {
    return this.generate(file, 'insomnia')
  }

  async generateCurl(file: File): Promise<ApiResponse<string>> {
    return this.generate(file, 'curl')
  }

  private async generate(file: File, type: 'tests' | 'insomnia' | 'curl'): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('harFile', file)

    try {
      const response = await api.post(`/generate/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.content }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || `Failed to generate ${type}` 
      }
    }
  }

  async runTests(file: File): Promise<ApiResponse<string>> {
    const formData = new FormData()
    formData.append('harFile', file)

    try {
      const response = await api.post('/test', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.report }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to run tests' 
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health')
      return response.data.status === 'ok'
    } catch {
      return false
    }
  }
}

export const harwiseAPI = new HarwiseAPI()
export default harwiseAPI