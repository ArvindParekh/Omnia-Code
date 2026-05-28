# Omnia Code Implementation Roadmap

## Project Context
Omnia Code is an Electron desktop app that wraps AI agent CLIs (Claude Code, Gemini CLI, OpenCode, Codex) in a transparent GUI. The core value proposition is transparency - every tool call, agent decision, and confirmation is rendered as an inspectable tree, not hidden behind terminal output.

## Architecture Overview

### Current State
- ✅ Electron + React + TypeScript foundation
- ✅ Basic IPC type-safe communication  
- ✅ Shared type system (`IpcChannels`, `IpcEvents`, `AgentEvent`)
- ✅ Provider interface (`AIProvider`) 
- 🚧 Claude provider implementation (in progress)

### Target Architecture
```
┌─────────────────────────────────────────┐
│           React Frontend UI             │
│  (Session Management, Event Tree View)  │
└─────────────────┬───────────────────────┘
                  │ IPC (contextBridge)
┌─────────────────▼───────────────────────┐
│         Electron Main Process           │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │        Provider Service             │ │
│  │   (Session Orchestration)           │ │
│  └─────────────────┬───────────────────┘ │
│                    │                     │
│  ┌─────────┬───────▼─────┬─────┬─────────┐ │
│  │ Claude  │ Gemini CLI  │ ... │ Codex   │ │
│  │ SDK     │ SDK         │     │ SDK     │ │
│  └─────────┴─────────────┴─────┴─────────┘ │
└─────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1: Core Infrastructure (Complete Claude)
**Target: 1-2 weeks**

1. **Finish Claude Implementation** 
   - ✅ Fix type errors in current implementation
   - ⏳ Complete all AIProvider interface methods
   - ⏳ Handle streaming events properly
   - ⏳ Implement error handling and recovery

2. **Provider Service Integration**
   - ⏳ Wire Claude provider to IPC handlers
   - ⏳ Test full end-to-end flow (UI -> IPC -> Provider -> Claude SDK)
   - ⏳ Implement session lifecycle management

3. **Frontend Event Tree UI**
   - ⏳ Design transparent event visualization
   - ⏳ Real-time streaming event updates
   - ⏳ Tool call approval/confirmation UI

### Phase 2: Multi-Provider Support  
**Target: 2-3 weeks**

#### 2.1 Gemini Integration (Easiest)
- **Complexity**: Low-Medium
- **SDK Maturity**: High (Google-maintained)  
- **Integration Pattern**: Similar to Claude (SDK wrapper)
- **Key Features**: Free tier, MCP support, headless mode
- **Implementation**: `GeminiProvider` using `@google/gemini-cli-sdk`

#### 2.2 Cursor Integration (Medium)
- **Complexity**: Medium
- **SDK Maturity**: High (Official Cursor SDK)
- **Integration Pattern**: Agent-based with local/cloud runtime
- **Key Features**: Local workspace support, cloud execution
- **Implementation**: `CursorProvider` using `@cursor/sdk`

#### 2.3 OpenCode Integration (Medium-High)
- **Complexity**: Medium-High  
- **SDK Maturity**: Medium (Open source, active development)
- **Integration Pattern**: Server/client with embedded server option
- **Key Features**: Multi-LLM support, MCP integration, plugins
- **Implementation**: `OpenCodeProvider` using `@opencode-ai/sdk`

#### 2.4 Codex Integration (High)  
- **Complexity**: High
- **SDK Maturity**: Medium (OpenAI maintained but complex)
- **Integration Pattern**: CLI wrapper with JSON-RPC
- **Key Features**: Advanced tooling, thread management
- **Implementation**: `CodexProvider` using `@openai/codex-sdk`

### Phase 3: Advanced Features
**Target: 2-3 weeks**

1. **Provider Detection & Auto-Configuration**
   - Scan system for installed CLIs and available SDKs
   - Auto-detect API keys and authentication
   - Graceful fallbacks when providers unavailable

2. **Enhanced Session Management**
   - Session persistence across app restarts
   - Session export/import for sharing
   - Multi-provider session comparison

3. **Advanced UI Features**
   - Event filtering and search
   - Performance monitoring and metrics
   - Provider-specific settings and configuration

## Detailed Implementation Guide

### Provider Implementation Pattern

Each provider follows this standard pattern:

```typescript
export class [Provider]Provider implements AIProvider {
  readonly name = "[Provider]";
  private sdk: [ProviderSDK];
  private sessions: Map<string, SessionData> = new Map();

  async createSession(provider: Provider): Promise<Session> {
    // 1. Initialize provider SDK
    // 2. Create new session
    // 3. Store session mapping
    // 4. Return standardized Session object
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<AgentEvent> {
    // 1. Get session from map
    // 2. Send message via provider SDK  
    // 3. Stream events from provider
    // 4. Transform to AgentEvent format
    // 5. Yield standardized events
  }

  confirm(sessionId: string, toolCallId: string, approved: boolean): void {
    // Handle tool confirmation if supported by provider
  }

  getSessions(): Session[] {
    // Return all active sessions
  }

  getEvents(sessionId: string): AgentEvent[] {
    // Return conversation history for session
  }

  static isAvailable(): boolean {
    // Check if provider SDK is installed and configured
  }
}
```

### Event Transformation Standards

All providers must transform their native events to our `AgentEvent` format:

```typescript
type AgentEvent =
  | { id: string; type: "text"; content: string; streaming: boolean }
  | { id: string; type: "tool_call"; tool: string; args: unknown; status: "running" | "done" | "error" }
  | { id: string; type: "tool_result"; toolCallId: string; content: string; isError: boolean }
  | { id: string; type: "confirmation_request"; toolCallId: string; tool: string; args: unknown; status: "pending" | "approved" | "rejected" }
  | { id: string; type: "error"; message: string };
```

### Common Implementation Challenges

#### 1. SDK Lifecycle Management
- **Problem**: Each provider SDK has different initialization/cleanup patterns
- **Solution**: Standardize in provider constructor/destructor
- **Example**: OpenCode needs server lifecycle, Cursor needs client cleanup

#### 2. Event Stream Mapping  
- **Problem**: Each provider has different event schemas and timing
- **Solution**: Careful transformation with buffering if needed
- **Example**: Some providers emit rapid deltas, others emit complete messages

#### 3. Tool Call Approval
- **Problem**: Different providers handle confirmations differently
- **Solution**: Standardize on confirmation_request -> approve/reject flow
- **Example**: Some auto-approve, others require explicit confirmation

#### 4. Error Handling
- **Problem**: Provider failures should not crash the app
- **Solution**: Comprehensive try-catch with graceful degradation
- **Example**: Network timeouts, API rate limits, invalid credentials

#### 5. Session Persistence
- **Problem**: App restart should preserve session state
- **Solution**: Serialize session IDs and provider state
- **Example**: Save session mappings to disk, restore on startup

### Testing Strategy

#### Unit Tests (Per Provider)
```typescript
describe('GeminiProvider', () => {
  it('should create session successfully', async () => {
    // Mock GeminiCliAgent
    // Test session creation
    // Verify return format
  });

  it('should stream events correctly', async () => {
    // Mock streaming response
    // Test event transformation
    // Verify AgentEvent format
  });

  it('should handle errors gracefully', async () => {
    // Mock SDK failures
    // Test error recovery
    // Verify error events
  });
});
```

#### Integration Tests  
```typescript
describe('Provider Integration', () => {
  it('should work end-to-end with real API', async () => {
    // Use test API keys
    // Test full message flow
    // Verify UI updates
  });
});
```

#### Manual Testing Checklist
- [ ] Provider detection works correctly
- [ ] Session creation and management  
- [ ] Message streaming and event display
- [ ] Tool call approval flow
- [ ] Error handling and recovery
- [ ] Performance under load

### Performance Considerations

#### Memory Management
- Limit conversation history per session
- Clean up completed sessions automatically  
- Monitor provider SDK memory usage

#### Streaming Performance
- Use AsyncGenerator for memory-efficient streaming
- Implement backpressure handling
- Batch UI updates for rapid events

#### Concurrent Sessions
- Support multiple active sessions per provider
- Handle resource contention gracefully
- Implement session priority/throttling

### Security Considerations

#### API Key Management
- Store credentials securely (electron-store encrypted)
- Never log or expose API keys
- Support environment variable configuration

#### Tool Execution Safety
- Always show tool calls before execution
- Implement approval workflow for dangerous operations
- Sandbox tool execution when possible

#### Process Isolation
- Run provider SDKs in separate processes if possible
- Implement proper cleanup on crashes
- Handle malicious or malformed responses

## Next Steps

1. **Complete Claude implementation** following the patterns above
2. **Test end-to-end flow** with Claude before adding other providers  
3. **Implement Gemini next** as it's most similar to Claude
4. **Iterate on UI/UX** based on real usage with Claude + Gemini
5. **Add remaining providers** in order of complexity

## Success Metrics

- ✅ All 4 providers successfully integrated
- ✅ Transparent event visualization working
- ✅ Tool call approval flow functional
- ✅ Session management robust
- ✅ Error handling graceful
- ✅ Performance acceptable (< 100ms UI response)
- ✅ No crashes or data loss during normal usage