"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
   Bot,
   Sparkles,
   Terminal,
   Cpu,
   MoreVertical,
   Play,
   AlertCircle,
   Clock,
} from "lucide-react";
import type { Session } from "../../shared/types";

interface SessionListProps {
   sessions: Session[];
   selectedSession: string | undefined;
   onSelectSession: (sessionId: string) => void;
}

const providerConfig = {
   claude: {
      icon: Bot,
      color: "from-blue-500 to-purple-600",
      name: "Claude",
   },
   gemini: {
      icon: Sparkles,
      color: "from-emerald-500 to-teal-600",
      name: "Gemini",
   },
   codex: {
      icon: Terminal,
      color: "from-orange-500 to-red-600",
      name: "Codex",
   },
   opencode: {
      icon: Terminal,
      color: "from-cyan-500 to-blue-600",
      name: "OpenCode",
   },
   cursor: {
      icon: Cpu,
      color: "from-violet-500 to-purple-600",
      name: "Cursor",
   },
};

const statusConfig = {
   idle: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      label: "Idle",
   },
   running: {
      icon: Play,
      color: "text-green-500",
      bg: "bg-green-500/10",
      label: "Running",
   },
   error: {
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      label: "Error",
   },
};

function formatRelativeTime(timestamp: number) {
   const now = Date.now();
   const diff = now - timestamp;
   const minutes = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);

   if (days > 0) return `${days}d ago`;
   if (hours > 0) return `${hours}h ago`;
   if (minutes > 0) return `${minutes}m ago`;
   return "Just now";
}

export function SessionList({
   sessions,
   selectedSession,
   onSelectSession,
}: SessionListProps) {
   return (
      <div className='space-y-2 p-4'>
         {sessions.map((session) => {
            const provider = providerConfig[session.provider];
            const status = statusConfig[session.status];
            const isSelected = session.id === selectedSession;
            const ProviderIcon = provider.icon;
            const StatusIcon = status.icon;

            return (
               <Card
                  key={session.id}
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
                     isSelected
                        ? "border-primary bg-primary/5 shadow-md scale-[1.01] ring-1 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                  onClick={() => onSelectSession(session.id)}
               >
                  <div className='p-3'>
                     {/* Header */}
                     <div className='flex items-start justify-between mb-2'>
                        <div className='flex items-center space-x-2 min-w-0 flex-1'>
                           <div
                              className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${provider.color} shadow-sm flex-shrink-0`}
                           >
                              <ProviderIcon className='h-3.5 w-3.5 text-white' />
                           </div>

                           <div className='min-w-0 flex-1'>
                              <h4 className='text-sm font-medium leading-none truncate'>
                                 {session.title}
                              </h4>
                              <div className='flex items-center space-x-1 mt-1'>
                                 <Badge
                                    variant='outline'
                                    className='text-xs h-5'
                                 >
                                    {provider.name}
                                 </Badge>
                              </div>
                           </div>
                        </div>

                        <Button
                           variant='ghost'
                           size='icon'
                           className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                           onClick={(e) => {
                              e.stopPropagation();
                              // Handle session actions
                           }}
                        >
                           <MoreVertical className='h-3 w-3' />
                        </Button>
                     </div>

                     {/* Status and Time */}
                     <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-1'>
                           <div
                              className={`flex items-center justify-center h-5 w-5 rounded-full ${status.bg}`}
                           >
                              <StatusIcon
                                 className={`h-2.5 w-2.5 ${status.color} ${
                                    session.status === "running"
                                       ? "animate-pulse"
                                       : ""
                                 }`}
                              />
                           </div>
                           <span
                              className={`text-xs font-medium ${status.color}`}
                           >
                              {status.label}
                           </span>
                        </div>

                        <span className='text-xs text-muted-foreground'>
                           {formatRelativeTime(session.updatedAt)}
                        </span>
                     </div>

                     {/* Progress indicator for running sessions */}
                     {session.status === "running" && (
                        <div className='mt-2'>
                           <div className='h-1 w-full bg-muted rounded-full overflow-hidden'>
                              <div className='h-full w-1/3 bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' />
                           </div>
                        </div>
                     )}
                  </div>
               </Card>
            );
         })}

         {sessions.length === 0 && (
            <div className='text-center py-8'>
               <Bot className='mx-auto h-8 w-8 text-muted-foreground/50 mb-2' />
               <p className='text-sm text-muted-foreground'>No sessions yet</p>
               <p className='text-xs text-muted-foreground mt-1'>
                  Create your first AI agent session
               </p>
            </div>
         )}
      </div>
   );
}
