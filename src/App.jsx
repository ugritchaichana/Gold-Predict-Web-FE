import React from 'react';
import { Toaster } from "@/components/ui/toaster.jsx";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Dashboard from "@/components/Dashboard";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="gold-predict-theme">
      <div className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M12 7.25c-4.142 0-7.5 3.358-7.5 7.5 0 4.142 3.358 7.5 7.5 7.5 4.142 0 7.5-3.358 7.5-7.5 0-4.142-3.358-7.5-7.5-7.5ZM10.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14.25 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12 4.25c.689 0 1.249.56 1.249 1.25a.75.75 0 0 0 1.5 0c0-1.517-1.232-2.75-2.749-2.75a.75.75 0 0 0 0 1.5Z" />
                  </svg>
                </div>
                <span className="text-2xl font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-transparent bg-clip-text">
                  Gold Prediction
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
              </div>
            </div>
          </header>
          
          <main className="flex-1 container py-6">
            <Dashboard />
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
    </ThemeProvider>
  );
}

export default App;