import { Link, Outlet } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <img 
              src="https://files.ajt.my/images/marketing-campaign/image-798d0739-d1c5-4d1a-88af-7a5aa6314d2e.png" 
              alt="JobDesc Generator MY" 
              className="h-10 w-auto"
              referrerPolicy="no-referrer"
            />
          </Link>
          <nav className="flex items-center gap-6">
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Job Description Generator Malaysia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
