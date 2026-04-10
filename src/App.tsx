/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import Home from './pages/Home';
import JobPage from './pages/JobPage';
import AllJobs from './pages/AllJobs';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmails from './pages/admin/AdminEmails';
import AdminJobForm from './pages/admin/AdminJobForm';

function DebugNotFound() {
  const location = useLocation();
  console.log('[v0] No route matched for:', location.pathname);
  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', background: '#1e1e1e', color: '#f8f8f2', minHeight: '100vh' }}>
      <h1 style={{ color: '#ff5555', fontSize: '1.5rem' }}>[v0] 404 - No route matched</h1>
      <p style={{ margin: '1rem 0', color: '#8be9fd' }}>pathname: <strong>{location.pathname}</strong></p>
      <p style={{ margin: '1rem 0', color: '#8be9fd' }}>search: <strong>{location.search || '(none)'}</strong></p>
      <p style={{ margin: '1rem 0', color: '#8be9fd' }}>href: <strong>{window.location.href}</strong></p>
      <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />
      <p style={{ color: '#50fa7b' }}>If you see this on Vercel after refresh, the <code>vercel.json</code> rewrite to <code>/index.html</code> is working but the React Router has no matching route for this path.</p>
      <p style={{ color: '#ffb86c', marginTop: '1rem' }}>If you see the browser&apos;s own 404 page instead of this screen, the static file is not being served — check your <code>vercel.json</code> rewrites and <code>outputDirectory</code>.</p>
    </div>
  );
}

export default function App() {
  console.log('[v0] App rendered, pathname:', window.location.pathname);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="cashier-job-description" element={<JobPage slugOverride="cashier-job-description" />} />
            <Route path="sales-assistant-job-description" element={<JobPage slugOverride="sales-assistant-job-description" />} />
            <Route path="admin-job-description" element={<JobPage slugOverride="admin-job-description" />} />
            <Route path="all" element={<AllJobs />} />
            <Route path=":slug" element={<JobPage />} />
          </Route>
          
          {/* Admin Routes - Hidden from main UI */}
          <Route path="/minjob" element={<AdminLogin />} />
          <Route path="/minjob/dashboard" element={<AdminDashboard />} />
          <Route path="/minjob/emails" element={<AdminEmails />} />
          <Route path="/minjob/jobs/new" element={<AdminJobForm />} />
          <Route path="/minjob/jobs/edit/:id" element={<AdminJobForm />} />
          <Route path="*" element={<DebugNotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
