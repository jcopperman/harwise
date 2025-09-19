import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Compare from './pages/Compare'
import Generate from './pages/Generate'
import Stats from './pages/Stats'
import Test from './pages/Test'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </Layout>
  )
}

export default App