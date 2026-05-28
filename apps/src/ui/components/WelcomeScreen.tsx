"use client"

import { useState } from "react"
import { 
  Bot, 
  Eye, 
  Layers3, 
  Terminal, 
  Sparkles,
  Play,
  Cpu
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

interface WelcomeScreenProps {
  onCreateSession: () => void
}

const providers = [
  { 
    id: "claude" as const, 
    name: "Claude", 
    description: "Anthropic's reasoning model",
    status: "available",
    icon: Bot
  },
  { 
    id: "gemini" as const, 
    name: "Gemini", 
    description: "Google's multimodal assistant",
    status: "available", 
    icon: Sparkles
  },
  { 
    id: "codex" as const, 
    name: "Codex", 
    description: "OpenAI code generation",
    status: "available",
    icon: Terminal
  },
  { 
    id: "cursor" as const, 
    name: "Cursor", 
    description: "AI code editor",
    status: "checking",
    icon: Cpu
  }
]

const features = [
  {
    icon: Eye,
    title: "Event inspection",
    description: "View all tool calls and decisions in real-time tree view"
  },
  {
    icon: Layers3,
    title: "Multi-agent support", 
    description: "Work with Claude, Gemini, Codex and other installed agents"
  },
  {
    icon: Terminal,
    title: "CLI integration",
    description: "Uses existing installations without additional setup"
  }
]

export function WelcomeScreen({ onCreateSession }: WelcomeScreenProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>()

  return (
    <div className="min-h-[100dvh] ethereal-mesh">
      {/* Premium Floating Navigation */}
      <header className="premium-toolbar">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3 stagger-entry">
            <div className="premium-shell p-1">
              <div className="premium-core p-2">
                <Layers3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <span className="text-premium-base font-semibold">Omnia Code</span>
              <div className="text-premium-xs text-muted-foreground font-mono uppercase tracking-wider">
                v0.1.0-alpha
              </div>
            </div>
          </div>
          <div className="stagger-entry">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Z-Axis Cascade Layout */}
      <main className="flex-1 flex px-8 py-24">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto">
          {/* Premium Hero Section */}
          <div className="mb-24 text-center stagger-entry">
            <div className="mb-8 premium-shell inline-block">
              <div className="premium-core p-6">
                <Bot className="h-12 w-12 text-primary mx-auto" />
              </div>
            </div>
            
            <div className="mb-3 premium-shell inline-block">
              <div className="premium-core px-4 py-1">
                <span className="text-premium-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  AI Agent Desktop
                </span>
              </div>
            </div>
            
            <h1 className="text-premium-3xl font-bold mb-6 leading-none">
              Orchestrate with
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                Complete Transparency
              </span>
            </h1>
            
            <p className="text-premium-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A premium desktop interface for AI agents with real-time visibility 
              into every decision, tool call, and confirmation.
            </p>
          </div>

          {/* Premium Provider Selection - Z-Axis Cascade */}
          <div className="w-full max-w-3xl stagger-entry">
            <div className="mb-8 text-center">
              <h2 className="text-premium-xl font-semibold mb-2">Select AI Provider</h2>
              <p className="text-premium-sm text-muted-foreground">
                Choose from your installed agents to begin a new session
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((provider, index) => {
                const isSelected = selectedProvider === provider.id
                const Icon = provider.icon
                
                return (
                  <div 
                    key={provider.id}
                    className={`premium-shell cascade-card stagger-entry cursor-pointer group ${
                      isSelected ? 'ring-2 ring-primary/20' : ''
                    }`}
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="premium-core p-6 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="premium-shell p-2">
                          <div className="premium-core p-3">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {provider.status === "available" ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="text-premium-xs font-mono uppercase tracking-wide text-emerald-600">
                                Ready
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                              <span className="text-premium-xs font-mono uppercase tracking-wide text-amber-600">
                                Checking
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-premium-lg font-semibold mb-2">{provider.name}</h3>
                      <p className="text-premium-sm text-muted-foreground leading-relaxed">
                        {provider.description}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="text-premium-xs text-muted-foreground mb-3 font-mono">
                            Uses existing CLI installation
                          </div>
                          <button
                            onClick={onCreateSession}
                            className="premium-button w-full flex items-center justify-center"
                          >
                            <Play className="h-4 w-4" />
                            <span className="ml-2">Start Session</span>
                            <div className="premium-button-icon">
                              <span className="text-xs">→</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      
      {/* Premium Features Showcase - Bottom Aligned */}
      <footer className="px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="premium-shell stagger-entry" style={{ animationDelay: '600ms' }}>
            <div className="premium-core p-8">
              <div className="text-center mb-8">
                <h3 className="text-premium-lg font-semibold mb-2">Premium Features</h3>
                <p className="text-premium-sm text-muted-foreground">
                  Built for transparency and professional workflows
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div key={feature.title} className="text-center group">
                    <div className="premium-shell inline-block mb-4 group-hover:scale-105 transition-transform duration-500">
                      <div className="premium-core p-4">
                        <feature.icon className="h-6 w-6 text-primary mx-auto" />
                      </div>
                    </div>
                    <h4 className="text-premium-base font-semibold mb-2">{feature.title}</h4>
                    <p className="text-premium-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}