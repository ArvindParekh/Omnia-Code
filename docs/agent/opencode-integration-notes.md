# OpenCode Integration Notes

## Overview
OpenCode is an open-source AI agent platform that can be embedded via SDK. It provides code generation, file operations, terminal command execution, and session management with multi-LLM support (Anthropic, OpenAI, xAI, etc.).

## Key Architecture Components

### Installation & Setup
```bash
npm install @opencode-ai/sdk opencode-ai
```

### Two Integration Modes

#### 1. Embedded Server Mode
```typescript
import { createOpencodeServer, createOpencodeClient } from "@opencode-ai/sdk";

// Start embedded server
const server = await createOpencodeServer({
  port: 4096,
  directory: "/path/to/workspace"
});

// Create client bound to server
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096"
});
```

#### 2. External Server Mode
```typescript
import { createOpencodeClient } from "@opencode-ai/sdk";

// Connect to existing OpenCode server
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096"
});
```

### Core SDK API

#### Session Management
```typescript
// Create session
const session = await client.session.create();
const sessionId = session.data.id;

// Send prompts
await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [
      { type: "text", text: "Create a Node.js Express server" }
    ]
  }
});

// List sessions
const sessions = await client.session.list();

// Get session details
const sessionDetails = await client.session.get({ path: { id: sessionId } });

// Delete session
await client.session.delete({ path: { id: sessionId } });
```

#### Event Streaming (SSE)
```typescript
// Subscribe to session events
const eventStream = client.event.subscribe({
  path: { id: sessionId }
});

for await (const event of eventStream) {
  switch (event.type) {
    case 'message':
      // Handle text content
      break;
    case 'tool_call':
      // Handle tool invocations
      break;
    case 'tool_result':
      // Handle tool results
      break;
  }
}
```

### High-Level Agent SDK (`opencode-agent-sdk`)

For more agent-oriented workflow:

```typescript
import { createAgentRuntime } from 'opencode-agent-sdk';

// Managed mode (starts OpenCode server)
const runtime = await createAgentRuntime({
  model: 'claude-haiku-4-5',
  mcp: { /* MCP server configs */ },
  permission: { mode: 'ask' }
});

// Attach mode (connect to existing server)  
const runtime = await createAgentRuntime({
  serverUrl: 'http://localhost:4096'
});

// Create session
const session = await runtime.createSession({
  agent: 'coding-assistant'
});

// Send query and consume streaming events
for await (const event of session.query('Fix the failing tests')) {
  // Handle normalized events: text, tool-call, status, error, final-result
}
```

## Integration Strategy for Omnia

### Mapping to Our Interface
```typescript
export class OpenCodeProvider implements AIProvider {
  private client: any; // OpenCode client
  private server: any; // Embedded server (optional)
  private sessions: Map<string, string> = new Map(); // sessionId -> opencode sessionId

  async initialize() {
    // Option 1: Start embedded server
    this.server = await createOpencodeServer({
      port: 4096,
      directory: process.cwd()
    });
    
    this.client = createOpencodeClient({
      baseUrl: "http://localhost:4096"
    });

    // Option 2: Connect to external server
    // this.client = createOpencodeClient({ baseUrl: "http://localhost:4096" });
  }

  async createSession(provider: Provider): Promise<Session> {
    const sessionId = crypto.randomUUID();
    
    const opencodeSession = await this.client.session.create();
    this.sessions.set(sessionId, opencodeSession.data.id);
    
    return {
      id: sessionId,
      provider,
      title: "OpenCode",
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
    const opencodeSessionId = this.sessions.get(sessionId);
    if (!opencodeSessionId) throw new Error(`Session ${sessionId} not found`);

    // Start the prompt
    await this.client.session.prompt({
      path: { id: opencodeSessionId },
      body: {
        parts: [{ type: "text", text: message }]
      }
    });

    // Subscribe to events
    const eventStream = this.client.event.subscribe({
      path: { id: opencodeSessionId }
    });

    for await (const event of eventStream) {
      yield* this.transformEvent(event);
    }
  }

  private async *transformEvent(event: any): AsyncGenerator<AgentEvent> {
    switch (event.type) {
      case 'message':
        yield {
          id: crypto.randomUUID(),
          type: 'text',
          content: event.content || event.text,
          streaming: event.streaming ?? true,
        };
        break;
        
      case 'tool_call':
        yield {
          id: event.id || crypto.randomUUID(),
          type: 'tool_call',
          tool: event.name || event.tool,
          args: event.arguments || event.args,
          status: 'running',
        };
        break;
        
      case 'tool_result':
        yield {
          id: crypto.randomUUID(),
          type: 'tool_result', 
          toolCallId: event.tool_call_id || event.toolCallId,
          content: event.content || event.result,
          isError: event.is_error || event.error || false,
        };
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

  static isAvailable(): boolean {
    try {
      require('@opencode-ai/sdk');
      return true;
    } catch {
      return false;
    }
  }

  async cleanup() {
    if (this.server) {
      await this.server.close();
    }
  }
}
```

### Event Stream Mapping
| OpenCode Event | Our AgentEvent Type | Notes |
|---------------|-------------------|-------|
| `{ type: 'message', content }` | `{ type: 'text', content, streaming }` | Text responses |
| `{ type: 'tool_call', name, args }` | `{ type: 'tool_call', tool: name, args, status: 'running' }` | Tool invocations |
| `{ type: 'tool_result', content }` | `{ type: 'tool_result', content, isError: false }` | Tool outputs |
| `{ type: 'error', message }` | `{ type: 'error', message }` | Error conditions |

### Configuration Options

#### Server Configuration
```typescript
// .opencode/opencode.json
{
  "model": "claude-haiku-4-5",
  "provider": "anthropic", 
  "systemPrompt": "You are a helpful coding assistant",
  "maxTurns": 100,
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx @modelcontextprotocol/server-filesystem",
        "args": ["/path/to/workspace"]
      }
    }
  }
}
```

#### Agent Behavior (AGENTS.md)
```markdown
# Agent Instructions

You are a coding assistant focused on:
- Code generation and refactoring
- File operations and project structure
- Terminal command execution
- Debugging and testing

## Tools Available
- File system operations (read, write, create, delete)
- Terminal/shell command execution  
- Code analysis and linting
- Git operations
```

#### Plugins & Extensions
- Custom plugins in `.opencode/plugins/`
- MCP server integrations for external tools
- Skills system for reusable behaviors

### Implementation Notes

1. **Server Management**:
   - Choose between embedded vs external server based on deployment
   - Handle server lifecycle (startup, shutdown, health checks)
   - Configure workspace directory and permissions

2. **Session Lifecycle**:
   - Map Omnia session IDs to OpenCode session IDs
   - Handle session cleanup and resource management
   - Support session persistence across restarts

3. **Event Streaming**:
   - Use SSE for real-time event streaming
   - Handle connection drops and reconnection
   - Transform OpenCode events to our standard format

4. **Tool Integration**:
   - Leverage OpenCode's built-in file system tools
   - Configure MCP servers for external integrations
   - Handle tool approval and permission requests

5. **Configuration Management**:
   - Support project-specific AGENTS.md and config
   - Handle model/provider selection
   - Manage API keys and authentication

### Testing Strategy
- Mock OpenCode SDK for unit tests
- Integration tests with embedded server
- Test session management and cleanup
- Verify tool call flows and permissions
- Test MCP server integrations

### Dependencies
```json
{
  "@opencode-ai/sdk": "latest",
  "opencode-ai": "latest"
}
```

### Environment Variables
```bash
# For Anthropic models
ANTHROPIC_API_KEY=your_key_here

# For OpenAI models  
OPENAI_API_KEY=your_key_here

# For xAI models
XAI_API_KEY=your_key_here
```

## Reference Implementation
- Official OpenCode SDK docs at frank.dev.opencode.ai/docs/sdk/
- CodexMonitor reference implementation (Tauri-based)
- OpenCode examples and integration guides