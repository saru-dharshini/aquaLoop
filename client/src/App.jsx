import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'

// Pages — all 8 routes
import Home        from './pages/Home.jsx'
import Login       from './pages/Login.jsx'
import Register    from './pages/Register.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Awareness   from './pages/Awareness.jsx'
import ImpactMap   from './pages/ImpactMap.jsx'
import NotFound    from './pages/NotFound.jsx'

// TanStack Query client — stale time of 1 min, used from Phase 3
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="page-layout">
              <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/login"       element={<Login />} />
                <Route path="/register"    element={<Register />} />
                <Route path="/dashboard"   element={<Dashboard />} />
                <Route path="/report"      element={<ReportIssue />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/awareness"   element={<Awareness />} />
                <Route path="/impact"      element={<ImpactMap />} />
                <Route path="*"            element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
