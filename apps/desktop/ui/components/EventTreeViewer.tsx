"use client";

import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import {
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  AlertTriangle,
  FileText,
  Terminal,
  Zap,
  Copy,
  ExternalLink,
} from "lucide-react";
import type { AgentEvent } from "@omnia/contracts";

interface EventTreeViewerProps {
  sessionId: string;
}

// Mock events for demonstration
const mockEvents: AgentEvent[] = [
  {
    type: "delta",
    text: "I'll help you review the React component for potential improvements.",
  },
  {
    type: "approval",
    id: "call-1",
    toolName: "read_file",
    input: { path: "src/components/UserProfile.tsx" },
  },
  {
    type: "delta",
    text: "File content successfully read. Found 127 lines of TypeScript React code.\n\nI've analyzed the component. Here are the key findings:\n1. Missing error boundaries\n2. Inefficient re-renders due to object creation in render\n3. Accessibility improvements needed",
  },
  {
    type: "approval",
    id: "call-2",
    toolName: "write_file",
    input: {
      path: "src/components/UserProfile.tsx",
      content: "// Optimized component with performance improvements...",
    },
  },
  {
    type: "done",
  },
];

const eventIcons = {
  delta: MessageSquare,
  approval: AlertTriangle,
  error: XCircle,
  done: CheckCircle2,
};

const statusIcons = {
  running: Play,
  done: CheckCircle2,
  error: XCircle,
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const statusColors = {
  running: "text-blue-500 bg-blue-500/10",
  done: "text-green-500 bg-green-500/10",
  error: "text-red-500 bg-red-500/10",
  pending: "text-orange-500 bg-orange-500/10",
  approved: "text-green-500 bg-green-500/10",
  rejected: "text-red-500 bg-red-500/10",
};

function EventItem({
  event,
  level = 0,
}: {
  event: AgentEvent;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const EventIcon = eventIcons[event.type] || FileText;

  const getStatusInfo = () => {
    if (event.type === "approval") {
      return {
        status: "pending",
        icon: statusIcons.pending,
        color: statusColors.pending,
      };
    }
    if (event.type === "error") {
      return {
        status: "error",
        icon: statusIcons.error,
        color: statusColors.error,
      };
    }
    if (event.type === "done") {
      return {
        status: "done",
        icon: statusIcons.done,
        color: statusColors.done,
      };
    }
    return null;
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo?.icon;

  const canExpand =
    event.type === "approval" ||
    (event.type === "delta" && event.text.length > 100) ||
    event.type === "error";

  return (
    <div className="group">
      <div
        className={`flex items-start space-x-3 py-2 px-3 hover:bg-accent/50 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm ${
          canExpand ? "hover:translate-x-1" : ""
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => canExpand && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse */}
        <div className="flex-shrink-0 w-4 flex justify-center">
          {canExpand ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </div>

        {/* Event Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <EventIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium capitalize">
              {event.type.replace("_", " ")}
            </span>

            {event.type === "approval" && (
              <Badge variant="outline" className="text-xs">
                {event.toolName}
              </Badge>
            )}

            {statusInfo && StatusIcon && (
              <div
                className={`flex items-center justify-center h-4 w-4 rounded-full ${statusInfo.color}`}
              >
                <StatusIcon
                  className={`h-2 w-2 ${
                    statusInfo.status === "running" ? "animate-spin" : ""
                  } ${statusInfo.status === "pending" ? "animate-pulse" : ""}`}
                />
              </div>
            )}
          </div>

          {/* Preview Content */}
          <div className="text-xs text-muted-foreground">
            {event.type === "delta" && (
              <p className="line-clamp-2">{event.text}</p>
            )}
            {event.type === "approval" && (
              <p>
                {event.toolName}(
                {Object.keys((event.input as object) || {})
                  .map((key) => `${key}: ...`)
                  .join(", ")}
                )
              </p>
            )}
            {event.type === "error" && (
              <p className="line-clamp-1">{event.message}</p>
            )}
            {event.type === "done" && <p>Session completed</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="mt-2 mb-4 animate-in slide-in-from-top-2 duration-300"
          style={{ marginLeft: `${(level + 1) * 16 + 32}px` }}
        >
          <Card className="border-l-2 border-l-primary/20">
            <div className="p-4">
              {event.type === "delta" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Response</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md font-sans">
                      {event.text}
                    </pre>
                  </div>
                </div>
              )}

              {event.type === "approval" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        Confirmation Required: {event.toolName}
                      </span>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    The agent wants to execute{" "}
                    <code className="bg-muted px-1 rounded">
                      {event.toolName}
                    </code>
                    with the following parameters:
                  </div>

                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(event.input, null, 2)}
                  </pre>

                  <div className="flex space-x-2">
                    <Button size="sm" className="h-8">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8">
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {event.type === "error" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Error</span>
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                  <div className="text-sm bg-muted p-3 rounded-md text-red-500 font-medium">
                    {event.message}
                  </div>
                  {event.retryable && (
                    <Button size="sm" variant="outline" className="h-8 mt-2">
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function EventTreeViewer({
  sessionId: _sessionId,
}: EventTreeViewerProps) {
  const [events, _setEvents] = useState<AgentEvent[]>(mockEvents);
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Transparency View</span>
          <Badge variant="outline" className="text-xs">
            {events.length} events
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={autoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className="text-xs h-7"
          >
            Auto-scroll
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Zap className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Events */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {events.length > 0 ? (
            <div className="space-y-1">
              {events.map((event, index) => (
                <EventItem key={`event-${index}`} event={event} level={0} />
              ))}

              {/* Live indicator */}
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Listening for new events...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center py-12">
              <div>
                <Terminal className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No events yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Agent interactions will appear here in real-time
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
