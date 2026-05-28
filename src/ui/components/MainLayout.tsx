"use client"

import { useState } from "react"
import { ScrollArea } from "./ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable"
import { 
  Bot, 
  Plus, 
  Settings, 
  Menu,
  Search,
  MoreVertical,
  Layers3,
  Terminal
} from "lucide-react"
import { SessionList } from "./SessionList"
import { EventTreeViewer } from "./EventTreeViewer"
import { ChatInterface } from "./ChatInterface"
import { ThemeToggle } from "./ThemeToggle"

interface MainLayoutProps {
  onCreateSession: () => void
}

const mockSessions = [
  {
    id: "1",
    provider: "claude" as const,
    title: "Code Review Assistant",
    status: "running" as const,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 60000
  },
  {
    id: "2", 
    provider: "gemini" as const,
    title: "Database Migration Helper",
    status: "idle" as const,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 1800000
  },
  {
    id: "3",
    provider: "codex" as const,
    title: "API Documentation Generator", 
    status: "error" as const,
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 3600000
  }
]

export function MainLayout({ onCreateSession }: MainLayoutProps) {
  const [selectedSession, setSelectedSession] = useState<string>(mockSessions[0].id)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const currentSession = mockSessions.find(s => s.id === selectedSession)

  return (
    <div className="h-[100dvh] flex flex-col ethereal-mesh">
      {/* Premium Floating Title Bar */}
      <header className="premium-toolbar">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="premium-shell p-1 cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <div className="premium-core p-2">
                <Menu className="h-4 w-4 text-primary" />
              </div>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="premium-shell p-1">
                <div className="premium-core p-2">
                  <Layers3 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <span className="text-premium-base font-semibold">Omnia Code</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentSession && (
              <div className="premium-shell">
                <div className="premium-core px-4 py-2 flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    currentSession.status === "running" 
                      ? "bg-emerald-500 animate-pulse" 
                      : currentSession.status === "error"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`} />
                  <span className="text-premium-sm font-medium">{currentSession.title}</span>
                </div>
              </div>
            )}
            
            <button className="premium-shell p-1 cursor-pointer hover:scale-105 transition-transform duration-300">
              <div className="premium-core p-2">
                <Search className="h-4 w-4 text-primary" />
              </div>
            </button>
            
            <ThemeToggle />
            
            <button className="premium-shell p-1 cursor-pointer hover:scale-105 transition-transform duration-300">
              <div className="premium-core p-2">
                <Settings className="h-4 w-4 text-primary" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Premium Main Layout */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Premium Sidebar */}
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            collapsedSize={0}
            collapsible
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
          >
            <div className="premium-shell h-full mr-2">
              <div className="premium-core h-full flex flex-col">
                {/* Session Controls */}
                <div className="p-6 border-b border-border/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="premium-shell inline-block">
                      <div className="premium-core px-3 py-1">
                        <span className="text-premium-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Sessions
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={onCreateSession}
                      className="premium-shell p-1 cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <div className="premium-core p-2">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sessions List */}
                <ScrollArea className="flex-1 px-3">
                  <SessionList 
                    sessions={mockSessions}
                    selectedSession={selectedSession}
                    onSelectSession={setSelectedSession}
                  />
                </ScrollArea>

                {/* Status Footer */}
                <div className="p-6 border-t border-border/30">
                  <div className="premium-shell">
                    <div className="premium-core p-3 flex items-center justify-between">
                      <span className="text-premium-xs font-mono">{mockSessions.length} active</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-premium-xs font-mono text-emerald-600">System Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Premium Main Content Area */}
          <ResizablePanel defaultSize={75} minSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Premium Chat Interface */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className="premium-shell h-full ml-2 mr-2">
                  <div className="premium-core h-full">
                    {currentSession ? (
                      <ChatInterface session={currentSession} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="premium-shell inline-block mb-6">
                            <div className="premium-core p-8">
                              <Bot className="h-16 w-16 text-primary/60 mx-auto" />
                            </div>
                          </div>
                          <h3 className="text-premium-lg font-semibold mb-2">No Active Session</h3>
                          <p className="text-premium-sm text-muted-foreground">
                            Select a session from the sidebar to begin
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Premium Event Tree Viewer */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="premium-shell h-full ml-2 mt-2">
                  <div className="premium-core h-full flex flex-col">
                    <div className="p-6 border-b border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="premium-shell p-1">
                            <div className="premium-core p-2">
                              <Terminal className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div>
                            <div className="premium-shell inline-block">
                              <div className="premium-core px-3 py-1">
                                <span className="text-premium-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                  Event Tree
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="premium-shell">
                            <div className="premium-core px-2 py-1 flex items-center space-x-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-premium-xs font-mono text-emerald-600">Live</span>
                            </div>
                          </div>
                          <button className="premium-shell p-1 cursor-pointer hover:scale-105 transition-transform duration-300">
                            <div className="premium-core p-1.5">
                              <MoreVertical className="h-3 w-3 text-primary" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  
                    <ScrollArea className="flex-1 px-3">
                      {currentSession ? (
                        <EventTreeViewer sessionId={currentSession.id} />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <div className="premium-shell inline-block mb-4">
                              <div className="premium-core p-6">
                                <Layers3 className="h-12 w-12 text-primary/60 mx-auto" />
                              </div>
                            </div>
                            <h4 className="text-premium-base font-semibold mb-2">Awaiting Events</h4>
                            <p className="text-premium-sm text-muted-foreground">
                              Event tree will populate when session is active
                            </p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}