import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster.jsx";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Dashboard from "@/components/Dashboard";
import Admin from "@/components/Admin";
import DocumentPage from "@/components/DocumentPage";
import ApiTesterPage from "@/components/ApiTesterPage";
import GoldTH from "@/Page/GoldTH/GoldTH";
import GoldChartMain from './Page/GoldChartMain/GoldChartMain';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gold-predict-theme">
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link to="/" className="text-2xl font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-transparent bg-clip-text">
                    Gold Prediction
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <ModeToggle />
                </div>
              </div>
            </header>
            
            <main className="flex-1 container py-6">              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/document" element={<DocumentPage />} />
                <Route path="/api" element={<ApiTesterPage />} />
                <Route path="/goldth" element={<GoldTH />} />
                <Route path="/goldchart" element={<GoldChartMain />} />
              </Routes>
            </main>
            
            <footer className="py-6 border-t">
              <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Gold Prediction. All rights reserved.</p>                <div className="flex gap-4">
                  <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
                  <Link to="/document" className="hover:text-primary transition-colors">Document</Link>
                  <Link to="/api" className="hover:text-primary transition-colors">API</Link>
                  <Link to="/goldth" className="hover:text-primary transition-colors">GoldTH Price</Link>
                  <Link to="/goldchart" className="hover:text-primary transition-colors">Gold Chart</Link>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;