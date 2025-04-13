import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster.jsx";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Dashboard from "@/components/Dashboard";
import Beta from "@/components/Beta";
import Admin from "@/components/Admin";

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
                  <nav className="flex items-center space-x-4 lg:space-x-6">
                    <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
                      Home
                    </Link>
                    <Link to="/beta" className="text-sm font-medium transition-colors hover:text-primary">
                      Beta
                    </Link>
                    <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
                      Admin
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-2">
                  <ModeToggle />
                </div>
              </div>
            </header>
            
            <main className="flex-1 container py-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/beta" element={<Beta />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            
            <footer className="py-6 border-t">
              <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Gold Prediction. All rights reserved.</p>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-primary transition-colors">Terms</a>
                  <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                  <a href="#" className="hover:text-primary transition-colors">Contact</a>
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