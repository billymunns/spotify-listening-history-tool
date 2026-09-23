import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { Layout } from './components/Layout.tsx'
import { LibraryProvider } from './library/LibraryContext.tsx'
import { CalendarPage } from './pages/CalendarPage.tsx'
import { Callback } from './pages/Callback.tsx'
import { Compare } from './pages/Compare.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { ImportPage } from './pages/ImportPage.tsx'
import { Landing } from './pages/Landing.tsx'
import { RequireAuth } from './pages/RequireAuth.tsx'
import { Taste } from './pages/Taste.tsx'
import { Wrapped } from './pages/Wrapped.tsx'

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <BrowserRouter>
          <AppErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/callback" element={<Callback />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/wrapped" element={<Wrapped />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/taste" element={<Taste />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/import" element={<ImportPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AppErrorBoundary>
        </BrowserRouter>
      </LibraryProvider>
    </AuthProvider>
  )
}
