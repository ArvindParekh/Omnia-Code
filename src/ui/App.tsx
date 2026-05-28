"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "./components/MainLayout"
import { WelcomeScreen } from "./components/WelcomeScreen"
import { TooltipProvider } from "./components/ui/tooltip"
import { ThemeProvider } from "./components/ThemeProvider"

function App() {
  const [hasActiveSessions, setHasActiveSessions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading and session check
    const checkSessions = async () => {
      // In real app, this would check for existing sessions via IPC
      setTimeout(() => {
        setIsLoading(false)
        setHasActiveSessions(false) // Start with welcome screen
      }, 1000)
    }
    
    checkSessions()
  }, [])

  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <div className="flex min-h-[100dvh] items-center justify-center bg-background transition-colors duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:0ms]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary/80 [animation-delay:150ms]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]"></div>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Initializing Omnia Code...</p>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <div className="min-h-[100dvh] bg-background transition-colors duration-300">
          {hasActiveSessions ? (
            <MainLayout onCreateSession={() => setHasActiveSessions(true)} />
          ) : (
            <WelcomeScreen onCreateSession={() => setHasActiveSessions(true)} />
          )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App