/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import Home from './pages/Home';
import JobPage from './pages/JobPage';
import AllJobs from './pages/AllJobs';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmails from './pages/admin/AdminEmails';
import AdminJobForm from './pages/admin/AdminJobForm';

export default function App() {
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
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
