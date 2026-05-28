# Cursor CLI Integration Notes

## Overview
Cursor provides official SDKs for both TypeScript (`@cursor/sdk`) and Python (`cursor-sdk`) that enable programmatic access to the same agent that runs in Cursor IDE, CLI, and web app. The SDK supports both local and cloud runtime execution.

## Key Architecture Components

### Installation & Setup
```bash
# TypeScript
npm install @cursor/sdk

# Python  
pip install cursor-sdk
```

### Authentication
- Requires `CURSOR_API_KEY` environment variable
- Supports user API keys and service account API keys
- Team Admin API keys not yet supported

### Core Concepts
- **Agent** - Durable handle with conversation state, workspace config, model selection
- **Run** - Single prompt submission with its own stream, status, result, conversation
- **SDKMessage** - Typed stream message yielded during runs (same shape across local/cloud)

### TypeScript SDK

#### Basic Usage Pattern
```typescript
import { Agent } from "@cursor/sdk";

// Local agent (runs against local workspace)
const agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  local: { cwd: process.cwd() },
});

// Cloud agent (runs on Cursor's infrastructure)  
const cloudAgent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  cloud: { 
    repos: [{ url: "https://github.com/user/repo" }],
  },
});

// Send message and stream events
const run = agent.send("Fix the failing tests");
for await (const event of run.stream()) {
  // Handle SDKMessage events
  switch (event.type) {
    case 'message':
      // Text content
      break;
    case 'tool_call':
      // Tool invocation
      break;
    case 'tool_result':  
      // Tool execution result
      break;
  }
}

// Wait for completion
const result = await run.wait();
```

#### Agent Management
```typescript
// Resume existing agent
const resumedAgent = await Agent.resume(agentId);

// One-shot prompt (no persistent agent)
const result = await Agent.prompt("Create a README", {
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: "composer-2.5" },
  local: { cwd: process.cwd() },
});
```

## Integration Strategy for Omnia

### Mapping to Our Interface
```typescript
export class CursorProvider implements AIProvider {
  private agents: Map<string, any> = new Map(); // Agent instances
  
  async createSession(provider: Provider): Promise<Session> {
    const sessionId = crypto.randomUUID();
    
    const agent = await Agent.create({
      apiKey: process.env.CURSOR_API_KEY!,
      model: { id: "composer-2.5" },
      local: { cwd: process.cwd() },
      // Could also use cloud mode with repo config
    });
    
    this.agents.set(sessionId, agent);
    
    return {
      id: sessionId,
      provider,
      title: "Cursor",
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
    const agent = this.agents.get(sessionId);
    if (!agent) throw new Error(`Session ${sessionId} not found`);
    
    const run = agent.send(message);
    
    for await (const event of run.stream()) {
      // Map Cursor SDKMessage to our AgentEvent format
      yield* this.transformEvent(event, run.runId);
    }
  }

  private async *transformEvent(event: any, runId: string): AsyncGenerator<AgentEvent> {
    switch (event.type) {
      case 'message':
        yield {
          id: crypto.randomUUID(),
          type: 'text',
          content: event.content || event.text,
          streaming: !event.finished,
        };
        break;
        
      case 'tool_call':
        yield {
          id: event.id || crypto.randomUUID(),
          type: 'tool_call', 
          tool: event.name,
          args: event.arguments,
          status: 'running',
        };
        break;
        
      case 'tool_result':
        yield {
          id: crypto.randomUUID(),
          type: 'tool_result',
          toolCallId: event.tool_call_id,
          content: event.content,
          isError: event.is_error || false,
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
    // Check if @cursor/sdk is installed and CURSOR_API_KEY is available
    return !!process.env.CURSOR_API_KEY;
  }
}
```

### Event Stream Mapping
| Cursor SDKMessage | Our AgentEvent Type | Notes |
|------------------|-------------------|-------|
| `{ type: 'message', content }` | `{ type: 'text', content, streaming }` | Text chunks from model |
| `{ type: 'tool_call', name, arguments }` | `{ type: 'tool_call', tool: name, args: arguments, status: 'running' }` | Tool invocations |
| `{ type: 'tool_result', content }` | `{ type: 'tool_result', content, isError: false }` | Tool outputs |
| `{ type: 'error', message }` | `{ type: 'error', message }` | Error conditions |

### Configuration Options

#### Local vs Cloud Runtime
- **Local**: Runs against local workspace (`local: { cwd }`)
- **Cloud**: Runs on Cursor infrastructure (`cloud: { repos }`)
- Choose based on security/performance requirements

#### Model Selection
Available models (check `Cursor.models.list()`):
- `composer-2.5` - Latest Cursor model
- `claude-3-5-sonnet` - Anthropic Claude
- Custom model configurations

#### Advanced Features
- **MCP Servers**: Inline MCP server definitions (`mcpServers`)
- **Settings**: Ambient Cursor settings from filesystem (`settingSources`)
- **Platform Config**: Advanced persistence/workspace config

### Implementation Notes

1. **Session Management**: 
   - Map Omnia session IDs to Cursor Agent instances
   - Use `Agent.resume()` for session persistence
   - Handle agent cleanup on session deletion

2. **Streaming**: 
   - Cursor SDK provides native async generators
   - Transform events in real-time to our format
   - Handle backpressure and cancellation via `AbortSignal`

3. **Error Handling**:
   - Wrap SDK calls in try-catch for connection issues
   - Implement retry logic for transient failures  
   - Graceful degradation when API key is invalid

4. **Tool Confirmation**:
   - Cursor handles tool approval internally
   - May need to expose confirmation events if SDK supports it
   - Monitor for `tool_call` -> `tool_result` sequences

5. **Performance**:
   - Reuse Agent instances across messages in same session
   - Consider connection pooling for multiple sessions
   - Cache model/settings configuration

### Testing Strategy
- Mock `@cursor/sdk` Agent for unit tests
- Integration tests with real API (use test API key)
- Test both local and cloud runtime modes
- Verify session persistence and resume functionality
- Test cancellation and cleanup paths

### Dependencies
```json
{
  "@cursor/sdk": "latest"
}
```

### Environment Variables
```bash
CURSOR_API_KEY=your_cursor_api_key_here
```

## Reference Implementation
- Official Cursor SDK docs at cursor.com/docs/sdk/
- Example usage patterns in SDK documentation
- Consider studying existing Cursor CLI integration patterns