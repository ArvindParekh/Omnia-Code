# Gemini CLI Integration Notes

## Overview
Gemini CLI is Google's open-source terminal AI agent that provides direct access to Gemini models. It offers both interactive CLI usage and programmatic SDK integration.

## Key Architecture Components

### Installation & Setup
```bash
# Global installation
npm install -g @google/gemini-cli

# Or use npx
npx @google/gemini-cli
```

### Authentication Options
1. **Google Account OAuth** - Sign in with Google (60 requests/min, 1000/day)
2. **API Key** - Use `GEMINI_API_KEY` from Google AI Studio (100 requests/day free tier)
3. **Vertex AI** - Enterprise GCP authentication

### SDK Integration (`@google/gemini-cli-sdk`)

#### Core Classes
- `GeminiCliAgent` - Main configuration container (instructions, tools, model)
- `GeminiCliSession` - Interactive conversation session with lifecycle management
- `sendStream()` - Returns async generator of JSONL events

#### Event Types (JSONL Stream)
- `init` - Session initialization
- `message` - Text content chunks
- `tool_use` - Tool invocation events  
- `tool_result` - Tool execution results
- `error` - Error conditions
- `result` - Final completion

#### Basic Usage Pattern
```typescript
import { GeminiCliAgent } from '@google/gemini-cli-sdk';

const agent = new GeminiCliAgent({
  model: { id: 'gemini-2.0-flash-exp' },
  instructions: 'You are a helpful coding assistant',
  tools: [customTools],
});

const session = agent.session();

// Streaming responses
for await (const event of session.sendStream('Create a React component')) {
  switch (event.type) {
    case 'message':
      // Handle text chunks
      break;
    case 'tool_use':
      // Handle tool calls
      break;
    case 'tool_result':
      // Handle tool results
      break;
  }
}
```

## Integration Strategy for Omnia

### Mapping to Our Interface
```typescript
export class GeminiProvider implements AIProvider {
  private agent: GeminiCliAgent;
  private sessions: Map<string, GeminiCliSession> = new Map();

  async createSession(provider: Provider): Promise<Session> {
    // Initialize GeminiCliAgent with project configuration
    // Create new GeminiCliSession
    // Return our Session format
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
    const session = this.sessions.get(sessionId);
    
    for await (const event of session.sendStream(message)) {
      // Transform JSONL events to our AgentEvent format:
      // - 'message' events -> { type: 'text', content, streaming: true }  
      // - 'tool_use' events -> { type: 'tool_call', tool, args, status }
      // - 'tool_result' events -> { type: 'tool_result', content }
      // - 'error' events -> { type: 'error', message }
    }
  }

  static isAvailable(): boolean {
    // Check if @google/gemini-cli-sdk is installed
    // Verify GEMINI_API_KEY exists or OAuth is configured
  }
}
```

### Event Stream Mapping
| Gemini JSONL Event | Our AgentEvent Type | Notes |
|-------------------|-------------------|-------|
| `{ type: 'message', content }` | `{ type: 'text', content, streaming: true }` | Text streaming chunks |
| `{ type: 'tool_use', name, input }` | `{ type: 'tool_call', tool: name, args: input, status: 'running' }` | Tool invocation |
| `{ type: 'tool_result', content }` | `{ type: 'tool_result', content, isError: false }` | Tool output |
| `{ type: 'error', message }` | `{ type: 'error', message }` | Error conditions |

### Configuration Requirements
- Environment: `GEMINI_API_KEY` from Google AI Studio
- Model Selection: Default to 'gemini-2.0-flash-exp' for performance
- MCP Support: Leverage Gemini CLI's built-in MCP server integration
- Headless Mode: Use SDK for programmatic access (not CLI headless mode)

### Implementation Notes
1. **Session Lifecycle**: GeminiCliAgent is reusable, create one per Omnia session
2. **Tool Integration**: Gemini CLI supports custom tools via SDK, can expose shell/file operations
3. **Rate Limits**: Handle API quota gracefully with exponential backoff
4. **Error Recovery**: Implement retry logic for transient failures
5. **Streaming**: Use AsyncGenerator pattern to match our interface

### Testing Strategy
- Mock GeminiCliAgent for unit tests
- Integration tests with actual API (CI environment variables)
- Test tool call approval flow
- Verify session persistence across reconnections

### Dependencies
```json
{
  "@google/gemini-cli-sdk": "^0.44.0"
}
```

## Reference Implementation
See Google's Gemini CLI source at `google-gemini/gemini-cli` for SDK patterns and best practices.