"use client"

import { cn } from "../lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "connecting" | "error"
  className?: string
  showLabel?: boolean
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    label: "Online",
    animate: "animate-pulse"
  },
  offline: {
    color: "bg-gray-500", 
    label: "Offline",
    animate: ""
  },
  connecting: {
    color: "bg-yellow-500",
    label: "Connecting", 
    animate: "animate-bounce"
  },
  error: {
    color: "bg-red-500",
    label: "Error",
    animate: "animate-pulse"
  }
}

export function StatusIndicator({ status, className, showLabel = false }: StatusIndicatorProps) {
  const config = statusConfig[status]
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "h-2 w-2 rounded-full",
        config.color,
        config.animate
      )} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  )
}