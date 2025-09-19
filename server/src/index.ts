import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const execAsync = promisify(exec)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// File storage configuration
const uploadsDir = path.join(__dirname, '../../uploads')
const outputsDir = path.join(__dirname, '../../outputs')

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.har')) {
      cb(null, true)
    } else {
      cb(new Error('Only HAR files (.har) are allowed'))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
})

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Upload HAR file
app.post('/api/upload', upload.single('harFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileInfo = {
      id: uuidv4(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    }

    res.json({ success: true, file: fileInfo })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Get HAR file statistics
app.post('/api/stats', upload.single('harFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No HAR file provided' })
    }

    const harPath = req.file.path
    const outputPath = path.join(outputsDir, `stats-${uuidv4()}.json`)
    
    // Run harwise stats command
    const command = `node ../../dist/index.js stats "${harPath}" --out "${outputPath}"`
    const { stdout, stderr } = await execAsync(command, { cwd: __dirname })
    
    if (stderr) {
      console.warn('Stats warning:', stderr)
    }

    // Read the generated stats file
    const statsContent = await fs.readFile(outputPath, 'utf-8')
    const stats = JSON.parse(statsContent)

    // Clean up files
    await Promise.all([
      fs.unlink(harPath),
      fs.unlink(outputPath)
    ])

    res.json({ success: true, stats })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to generate stats' })
  }
})

// Compare two HAR files
app.post('/api/compare', upload.fields([
  { name: 'harFile1', maxCount: 1 },
  { name: 'harFile2', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    
    if (!files.harFile1 || !files.harFile2) {
      return res.status(400).json({ error: 'Two HAR files are required' })
    }

    const harPath1 = files.harFile1[0].path
    const harPath2 = files.harFile2[0].path
    const outputPath = path.join(outputsDir, `comparison-${uuidv4()}.md`)
    
    // Run harwise compare command
    const command = `node ../../dist/index.js compare "${harPath1}" "${harPath2}" --out "${outputPath}"`
    const { stdout, stderr } = await execAsync(command, { cwd: __dirname })
    
    if (stderr) {
      console.warn('Compare warning:', stderr)
    }

    // Read the generated comparison file
    const comparisonContent = await fs.readFile(outputPath, 'utf-8')

    // Clean up files
    await Promise.all([
      fs.unlink(harPath1),
      fs.unlink(harPath2),
      fs.unlink(outputPath)
    ])

    res.json({ success: true, comparison: comparisonContent })
  } catch (error) {
    console.error('Compare error:', error)
    res.status(500).json({ error: 'Failed to compare files' })
  }
})

// Generate tests, collections, or curl suites
app.post('/api/generate/:type', upload.single('harFile'), async (req, res) => {
  try {
    const { type } = req.params // 'tests', 'insomnia', 'curl'
    
    if (!['tests', 'insomnia', 'curl'].includes(type)) {
      return res.status(400).json({ error: 'Invalid generation type' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No HAR file provided' })
    }

    const harPath = req.file.path
    const outputId = uuidv4()
    const outputPath = path.join(outputsDir, `generated-${outputId}`)
    
    // Determine the appropriate file extension and command
    let command: string | undefined
    let outputFile: string | undefined

    if (type === 'tests') {
      command = `node ../../dist/index.js gen tests "${harPath}" --out "${outputPath}"`
      outputFile = outputPath // Directory for tests
    } else if (type === 'insomnia') {
      outputFile = `${outputPath}.json`
      command = `node ../../dist/index.js gen insomnia "${harPath}" --out "${outputFile}"`
    } else if (type === 'curl') {
      outputFile = `${outputPath}.sh`
      command = `node ../../dist/index.js gen curl "${harPath}" --out "${outputFile}"`
    }

    if (!command || !outputFile) {
      return res.status(400).json({ error: 'Failed to determine generation command or output file.' })
    }

    const { stdout, stderr } = await execAsync(command, { cwd: __dirname })
    
    if (stderr) {
      console.warn(`Generate ${type} warning:`, stderr)
    }

    // Read the generated content
    let content: any
    if (type === 'tests') {
      // For tests, read all generated files in the directory
      const files = await fs.readdir(outputFile)
      content = {}
      for (const file of files) {
        const filePath = path.join(outputFile, file)
        content[file] = await fs.readFile(filePath, 'utf-8')
      }
    } else {
      // For single files
      content = await fs.readFile(outputFile, 'utf-8')
    }

    // Clean up files
    await fs.unlink(harPath)
    if (type === 'tests') {
      await fs.rm(outputFile, { recursive: true })
    } else {
      await fs.unlink(outputFile)
    }

    res.json({ success: true, type, content })
  } catch (error) {
    console.error(`Generate ${req.params.type} error:`, error)
    res.status(500).json({ error: `Failed to generate ${req.params.type}` })
  }
})

// Test runner endpoint
app.post('/api/test', upload.single('harFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No HAR file provided' })
    }

    const harPath = req.file.path
    const outputPath = path.join(outputsDir, `test-results-${uuidv4()}.html`)
    
    // Run harwise test command
    const command = `node ../../dist/index.js test "${harPath}" --out "${outputPath}"`
    const { stdout, stderr } = await execAsync(command, { cwd: __dirname })
    
    if (stderr) {
      console.warn('Test warning:', stderr)
    }

    // Read the generated test report
    const reportContent = await fs.readFile(outputPath, 'utf-8')

    // Clean up files
    await Promise.all([
      fs.unlink(harPath),
      fs.unlink(outputPath)
    ])

    res.json({ success: true, report: reportContent })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ error: 'Failed to run tests' })
  }
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error)
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' })
    }
  }
  
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

async function startServer() {
  try {
    // Ensure directories exist
    await Promise.all([
      fs.mkdir(uploadsDir, { recursive: true }),
      fs.mkdir(outputsDir, { recursive: true })
    ])

    app.listen(PORT, () => {
      console.log(`🚀 Harwise API server running on port ${PORT}`)
      console.log(`📁 Uploads directory: ${uploadsDir}`)
      console.log(`📁 Outputs directory: ${outputsDir}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()