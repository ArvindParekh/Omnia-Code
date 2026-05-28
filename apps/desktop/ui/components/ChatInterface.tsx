"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
   Send,
   Paperclip,
   Square,
   Play,
   RotateCcw,
   Bot,
   User,
   Code2,
   FileText,
   Image,
   Loader2,
} from "lucide-react";
import type { Session } from "@omnia/contracts";

interface ChatInterfaceProps {
   session: Session;
}

interface Message {
   id: string;
   role: "user" | "assistant";
   content: string;
   timestamp: number;
   streaming?: boolean;
   attachments?: { type: string; name: string; size?: number }[];
}

const mockMessages: Message[] = [
   {
      id: "1",
      role: "user",
      content:
         "Can you help me review this React component and suggest improvements?",
      timestamp: Date.now() - 300000,
   },
   {
      id: "2",
      role: "assistant",
      content:
         "I'd be happy to help you review your React component! Please share the component code and I'll analyze it for potential improvements in areas like performance, accessibility, maintainability, and best practices.\n\nYou can either:\n1. Paste the code directly in the chat\n2. Attach the file using the attachment button\n3. Let me read it directly from your project files",
      timestamp: Date.now() - 295000,
   },
   {
      id: "3",
      role: "user",
      content:
         "Let me share the UserProfile component. It's in src/components/UserProfile.tsx",
      timestamp: Date.now() - 180000,
      attachments: [{ type: "file", name: "UserProfile.tsx", size: 3420 }],
   },
   {
      id: "4",
      role: "assistant",
      content:
         "I'll analyze the UserProfile component for you. Let me read the file first and then provide a comprehensive review.",
      timestamp: Date.now() - 175000,
      streaming: false,
   },
];

function MessageBubble({
   message,
   isLatest,
}: {
   message: Message;
   isLatest: boolean;
}) {
   const isUser = message.role === "user";

   return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
         <div
            className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start space-x-3`}
         >
            {/* Avatar */}
            <div
               className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
                  isUser
                     ? "bg-primary text-primary-foreground"
                     : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
               }`}
            >
               {isUser ? (
                  <User className='h-4 w-4' />
               ) : (
                  <Bot className='h-4 w-4' />
               )}
            </div>

            {/* Message Content */}
            <div
               className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
               <div className='flex items-center space-x-2 mb-1'>
                  <span className='text-xs font-medium text-muted-foreground'>
                     {isUser ? "You" : "Assistant"}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                     {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                     })}
                  </span>
               </div>

               {/* Attachments */}
               {message.attachments && message.attachments.length > 0 && (
                  <div className='mb-2 space-y-1'>
                     {message.attachments.map((attachment, i) => (
                        <div
                           key={i}
                           className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              isUser ? "bg-primary/10" : "bg-muted"
                           }`}
                        >
                           <FileText className='h-4 w-4 text-muted-foreground' />
                           <span className='text-sm'>{attachment.name}</span>
                           {attachment.size && (
                              <Badge variant='outline' className='text-xs'>
                                 {Math.round(attachment.size / 1024)}KB
                              </Badge>
                           )}
                        </div>
                     ))}
                  </div>
               )}

               {/* Message Bubble */}
               <Card
                  className={`p-4 ${
                     isUser
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border"
                  }`}
               >
                  <div className='prose prose-sm max-w-none'>
                     <div
                        className={`whitespace-pre-wrap text-sm ${isUser ? "text-primary-foreground" : "text-foreground"}`}
                     >
                        {message.content}
                        {message.streaming && isLatest && (
                           <span className='inline-block w-2 h-4 bg-current ml-1 animate-pulse' />
                        )}
                     </div>
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
}

export function ChatInterface({ session }: ChatInterfaceProps) {
   const [messages, setMessages] = useState<Message[]>(mockMessages);
   const [input, setInput] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const [isSessionRunning, setIsSessionRunning] = useState(
      session.status === "running",
   );
   const scrollRef = useRef<HTMLDivElement>(null);
   const textareaRef = useRef<HTMLTextAreaElement>(null);

   useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
         id: Date.now().toString(),
         role: "user",
         content: input,
         timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
         const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
               "I understand. Let me process your request and provide a detailed response.",
            timestamp: Date.now(),
            streaming: true,
         };
         setMessages((prev) => [...prev, assistantMessage]);
         setIsLoading(false);
      }, 1000);
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
         e.preventDefault();
         handleSubmit(e as any);
      }
   };

   const stopSession = () => {
      setIsSessionRunning(false);
      setIsLoading(false);
   };

   const startSession = () => {
      setIsSessionRunning(true);
   };

   return (
      <div className='flex h-full flex-col'>
         {/* Header */}
         <div className='flex items-center justify-between border-b glass-morphism dark:glass-morphism-dark p-4'>
            <div className='flex items-center space-x-3'>
               <div
                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                     session.provider === "claude"
                        ? "from-blue-500 to-purple-600"
                        : session.provider === "gemini"
                          ? "from-emerald-500 to-teal-600"
                          : "from-orange-500 to-red-600"
                  } flex items-center justify-center`}
               >
                  <Bot className='h-4 w-4 text-white' />
               </div>
               <div>
                  <h3 className='font-semibold'>{session.title}</h3>
                  <p className='text-xs text-muted-foreground capitalize'>
                     {session.provider} • {session.status}
                  </p>
               </div>
            </div>

            <div className='flex items-center space-x-2'>
               <Badge variant={isSessionRunning ? "default" : "secondary"}>
                  {isSessionRunning ? "Active" : "Idle"}
               </Badge>

               {isSessionRunning ? (
                  <Button variant='outline' size='sm' onClick={stopSession}>
                     <Square className='h-3 w-3 mr-1' />
                     Stop
                  </Button>
               ) : (
                  <Button variant='outline' size='sm' onClick={startSession}>
                     <Play className='h-3 w-3 mr-1' />
                     Start
                  </Button>
               )}

               <Button variant='ghost' size='icon'>
                  <RotateCcw className='h-4 w-4' />
               </Button>
            </div>
         </div>

         {/* Messages */}
         <ScrollArea className='flex-1'>
            <div className='p-4'>
               {messages.map((message, index) => (
                  <MessageBubble
                     key={message.id}
                     message={message}
                     isLatest={index === messages.length - 1}
                  />
               ))}

               {isLoading && (
                  <div className='flex justify-start mb-6'>
                     <div className='flex items-start space-x-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                           <Bot className='h-4 w-4' />
                        </div>
                        <Card className='p-4 bg-card border-border'>
                           <div className='flex items-center space-x-2'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              <span className='text-sm text-muted-foreground'>
                                 Thinking...
                              </span>
                           </div>
                        </Card>
                     </div>
                  </div>
               )}

               <div ref={scrollRef} />
            </div>
         </ScrollArea>

         {/* Input */}
         <div className='border-t glass-morphism dark:glass-morphism-dark p-4'>
            <form onSubmit={handleSubmit} className='space-y-3'>
               <div className='flex space-x-2'>
                  <div className='flex-1'>
                     <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='Type your message... (Cmd+Enter to send)'
                        className='min-h-[60px] max-h-[120px] resize-none'
                        disabled={!isSessionRunning}
                     />
                  </div>
                  <div className='flex flex-col space-y-2'>
                     <Button
                        type='submit'
                        size='icon'
                        disabled={
                           !input.trim() || isLoading || !isSessionRunning
                        }
                        className='h-[60px] w-12'
                     >
                        <Send className='h-4 w-4' />
                     </Button>
                  </div>
               </div>

               <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                     <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        disabled={!isSessionRunning}
                     >
                        <Paperclip className='h-4 w-4' />
                     </Button>
                     <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        disabled={!isSessionRunning}
                     >
                        <Image className='h-4 w-4' />
                     </Button>
                     <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        disabled={!isSessionRunning}
                     >
                        <Code2 className='h-4 w-4' />
                     </Button>
                  </div>

                  <div className='text-xs text-muted-foreground'>
                     {input.length > 0 && `${input.length} characters`}
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}
