# CTS Architecture Documentation

## System Overview

CTS (Code Test Studio) is a web-based testing platform designed for offline/local operation. The system follows a client-server architecture with a clean separation between frontend and backend components.

## Architecture Diagram

```
CTS Architecture
├── 🖥️ Frontend (Browser)
│   ├── Single Page Application (SPA)
│   ├── Vanilla JavaScript + Material Design
│   └── Real-time UI Management
│
├── ⚙️ Backend (Python Server)
│   ├── HTTP Server (Port 8090)
│   ├── C Compilation & Execution Engine
│   └── Sandbox Management
│
└── 🔧 Core Components
    ├── File Management
    ├── Test Execution Engine
    └── Security/Sandbox Layer
```

## Component Details

### Frontend Architecture

**Technology Stack:**
- **HTML5**: Modern semantic markup
- **CSS3**: Material Design inspired styling with CSS variables
- **Vanilla JavaScript**: No external frameworks for maximum compatibility
- **Material Icons**: Google's Material Symbols

**Key Components:**
- `CodeTestStudio` class: Main application controller
- `TabManager`: Tab navigation system
- `TestFileParser`: Intelligent test file parsing
- Theme system: Dark/Light mode with localStorage persistence

### Backend Architecture

**Technology Stack:**
- **Python 3.6+**: Core server and processing engine
- **HTTP Server**: Built-in Python HTTP server
- **GCC/Clang**: C compilation backend
- **Cross-platform**: Windows/Linux/macOS support

**Key Components:**
- `CTSBackend`: Main processing engine
- `SandboxManager`: Resource limitation and process management
- `InputValidator`: Security validation and sanitization
- `TestReporter`: Test result generation and comparison

## Data Flow

### Test Execution Flow
1. **User Input** → Frontend collects test configuration
2. **API Request** → POST /api/execute with JSON payload
3. **Backend Processing** → Compilation → Execution → Comparison
4. **Response** → JSON results with detailed metrics
5. **UI Update** → Visual presentation of results

### File Management Flow
1. **File Selection** → Browser File API
2. **Content Reading** → Async file reading with validation
3. **Storage** → Browser localStorage for session persistence
4. **Reload System** → Metadata-based change detection

## Communication Protocol

### API Endpoints
- `GET /api/status` - Server health check
- `POST /api/execute` - Test execution request

### Request Format (POST /api/execute)
```json
{
  "test_cases": [
    {
      "input": "test input",
      "expected": "expected output"
    }
  ],
  "source_file": {
    "name": "filename.c",
    "content": "C code content"
  },
  "auto_compile": true,
  "is_executable": false
}
```

### Response Format
```json
{
  "success": true,
  "total": 1,
  "passed": 1,
  "results": [
    {
      "passed": true,
      "execution_time": 15.5,
      "differences": null
    }
  ]
}
```

## Session Management

### Frontend State
- **Configuration**: Stored in browser localStorage
- **File Metadata**: Timestamps and file information
- **Theme Preferences**: Dark/light mode settings
- **Test Cases**: Current test suite in memory

### Backend State
- **Temporary Files**: Auto-cleaned after execution
- **Process Management**: Sandboxed execution environments
- **Resource Tracking**: Memory, CPU, and file limits

## Security Architecture

### Sandbox Implementation
- **Unix Systems**: Resource limits via `setrlimit`
- **Windows Systems**: Job Objects API via ctypes
- **Cross-platform**: Process killing and timeout management

### Input Validation
- **File Size Limits**: 10MB maximum for source files
- **Path Sanitization**: Prevention of directory traversal
- **Character Validation**: Control character filtering
- **Test Limits**: Maximum 100 tests per execution

## Performance Considerations

### Optimizations
- **Temporary File Management**: Auto-cleanup after execution
- **Async Operations**: Non-blocking file operations
- **Memory Management**: Limited resource usage
- **Caching**: Browser localStorage for configuration

### Resource Limits
- **Memory**: 256MB per process
- **CPU Time**: 30 seconds maximum
- **File Size**: 50MB output limit
- **Execution Time**: 5 second timeout per test

## Extension Points

The architecture supports future extensions through:
- Modular backend components
- Well-defined API interfaces
- Plugin-based test execution
- Custom validation rules

For detailed security implementation, see [SECURITY.md](./SECURITY.md)
For API reference, see [API_REFERENCE.md](./API_REFERENCE.md)
