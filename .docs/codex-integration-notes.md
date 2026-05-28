# Codex Integration Notes

## Overview
OpenAI Codex provides both Python (`openai-codex`) and TypeScript (`@openai/codex-sdk`) SDKs for programmatic integration. The architecture involves SDK wrappers around either the `codex` CLI or `app-server` process, communicating via JSON-RPC over standard I/O.

## Key Architecture Components

### Installation & Setup
```bash
# Python SDK
pip install openai-codex

# TypeScript SDK
npm install @openai/codex-sdk
```

### Two SDK Approaches

#### Python SDK (`openai-codex`)
Uses JSON-RPC v2 over stdio to communicate with `codex app-server`:

```python
from openai_codex import Codex, AsyncCodex

# Synchronous client
with Codex() as codex:
    thread = codex.thread_start()
    result = thread.run("Create a React component")
    
# Asynchronous client  
async with AsyncCodex() as codex:
    thread = await codex.thread_start()
    async for event in thread.turn("Fix this bug"):
        # Handle streaming events
        pass
```

#### TypeScript SDK (`@openai/codex-sdk`)
Wraps the `codex` CLI and exchanges JSONL events over stdio:

```typescript
import { Codex } from '@openai/codex-sdk';

const codex = new Codex({
  // Global configuration
});

const thread = await codex.startThread();

// Buffered response
const turn = await thread.run("Create an API endpoint");

// Streaming response
for await (const event of thread.runStreamed("Add tests")) {
  switch (event.type) {
    case 'turn.completed':
      // Turn finished
      break;
    case 'item.completed':
      // Individual item (tool call, reasoning) completed
      break;
  }
}
```

## Integration Strategy for Omnia

### Mapping to Our Interface (TypeScript)
```typescript
export class CodexProvider implements AIProvider {
  private codex: Codex;
  private threads: Map<string, any> = new Map(); // sessionId -> Thread
  
  constructor() {
    this.codex = new Codex({
      // Global config - model, permissions, etc.
    });
  }

  async createSession(provider: Provider): Promise<Session> {
    const sessionId = crypto.randomUUID();
    
    const thread = await this.codex.startThread();
    this.threads.set(sessionId, thread);
    
    return {
      id: sessionId,
      provider,
      title: "Codex",
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
    const thread = this.threads.get(sessionId);
    if (!thread) throw new Error(`Session ${sessionId} not found`);

    // Use streaming API for real-time updates
    for await (const event of thread.runStreamed(message)) {
      yield* this.transformEvent(event);
    }
  }

  private async *transformEvent(event: any): AsyncGenerator<AgentEvent> {
    switch (event.type) {
      case 'item.started':
        if (event.item.type === 'tool_call') {
          yield {
            id: event.item.id,
            type: 'tool_call',
            tool: event.item.tool_name,
            args: event.item.args,
            status: 'running',
          };
        }
        break;
        
      case 'item.completed':
        if (event.item.type === 'reasoning' || event.item.type === 'text') {
          yield {
            id: event.item.id,
            type: 'text', 
            content: event.item.content,
            streaming: false,
          };
        } else if (event.item.type === 'tool_result') {
          yield {
            id: crypto.randomUUID(),
            type: 'tool_result',
            toolCallId: event.item.tool_call_id,
            content: event.item.content,
            isError: event.item.is_error || false,
          };
        }
        break;
        
      case 'turn.completed':
        // Turn finished - could emit final event if needed
        break;
        
      case 'error':
        yield {
          id: crypto.randomUUID(),
          type: 'error',
          message: event.message || String(event),
        };
        break;
    }
  }

  confirm(sessionId: string, toolCallId: string, approved: boolean): void {
    // Codex handles approvals internally via its permission system
    // May need to implement if SDK exposes approval callbacks
  }

  getSessions(): Session[] {
    // Return list of active sessions
    return Array.from(this.threads.entries()).map(([id, thread]) => ({
      id,
      provider: 'codex' as Provider,
      title: 'Codex',
      status: 'idle' as const,
      createdAt: Date.now(), // Should track actual creation time
      updatedAt: Date.now(),
    }));
  }

  getEvents(sessionId: string): AgentEvent[] {
    // Return conversation history for session
    const thread = this.threads.get(sessionId);
    if (!thread) return [];
    
    // Extract events from thread conversation history
    return this.extractEventsFromThread(thread);
  }

  static isAvailable(): boolean {
    try {
      require('@openai/codex-sdk');
      return true;
    } catch {
      return false;
    }
  }
}
```

### Event Stream Mapping
| Codex ThreadEvent | Our AgentEvent Type | Notes |
|------------------|-------------------|-------|
| `item.started` (tool_call) | `{ type: 'tool_call', status: 'running' }` | Tool invocation started |
| `item.completed` (reasoning/text) | `{ type: 'text', content, streaming: false }` | Text content from model |
| `item.completed` (tool_result) | `{ type: 'tool_result', content, isError }` | Tool execution result |
| `turn.completed` | N/A or custom event | Turn/conversation completed |
| `error` | `{ type: 'error', message }` | Error conditions |

### Configuration Options

#### Global Codex Configuration
```typescript
const codex = new Codex({
  model: 'codex-4.0', // or latest available
  permissions: {
    mode: 'ask', // 'ask' | 'allow' | 'deny'
    tools: ['filesystem', 'shell', 'browser']
  },
  workspace: process.cwd(),
  // Other global settings
});
```

#### Thread-Level Configuration
```typescript
const thread = await codex.startThread({
  systemPrompt: 'You are a helpful coding assistant',
  // Thread-specific settings
});
```

### Advanced Features

#### Session Management
```typescript
// Resume existing thread
const thread = await codex.resumeThread(savedThreadId);

// Fork thread for experimentation
const forkedThread = await thread.fork();
```

#### Structured Output
```typescript
// Request structured response
const result = await thread.run("Generate API schema", {
  outputSchema: {
    type: 'object',
    properties: {
      endpoints: { type: 'array' },
      models: { type: 'array' }
    }
  }
});
```

#### MCP Server Integration
Codex can also run as an MCP server (`codex mcp-server`) for integration with other MCP clients.

### Implementation Notes

1. **Process Management**:
   - SDK manages `codex` CLI subprocess lifecycle
   - Handle graceful shutdown and cleanup
   - Monitor process health and restart if needed

2. **Threading Model**:
   - Each Omnia session maps to one Codex thread  
   - Threads maintain conversation context
   - Support thread forking for experimentation

3. **Event Streaming**:
   - Use `runStreamed()` for real-time updates
   - Transform Codex events to our standard format
   - Handle event ordering and completion signals

4. **Tool Permissions**:
   - Codex has built-in permission system
   - May need to expose approval requests to UI
   - Configure allowed tools and permission modes

5. **Error Handling**:
   - Handle CLI subprocess failures
   - Implement retry logic for transient errors
   - Graceful degradation when Codex unavailable

6. **Performance**:
   - Reuse Codex instance across sessions
   - Consider thread pooling for concurrent requests
   - Monitor memory usage of long conversations

### Python SDK Alternative
If preferring Python backend integration:

```python
import asyncio
from openai_codex import AsyncCodex

class CodexProvider:
    async def send_message(self, session_id: str, message: str):
        async with AsyncCodex() as codex:
            thread = await codex.thread_resume(session_id)  
            async for event in thread.turn(message):
                # Transform and yield events
                yield self.transform_event(event)
```

### Testing Strategy
- Mock Codex SDK for unit tests
- Integration tests with real Codex CLI
- Test thread lifecycle and session management
- Verify tool permission flows  
- Test structured output and error handling

### Dependencies
```json
{
  "@openai/codex-sdk": "latest"
}
```

### Environment Variables
```bash
# If required by Codex
OPENAI_API_KEY=your_key_here
# Or other auth as needed by specific Codex version
```

## Reference Implementation
- CodexMonitor (Tauri-based) at `Dimillian/CodexMonitor`
- Official Codex SDK documentation
- MCP server implementation patterns