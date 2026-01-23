# CTS Security Documentation

## Security Overview

CTS implements comprehensive security measures designed for safe offline/local operation. The security architecture focuses on resource limitation, input validation, and process isolation.

## Sandbox Architecture

### SandboxManager Implementation

The `SandboxManager` class provides cross-platform resource limitation:

```python
class SandboxManager:
    MEMORY_LIMIT_MB = 256
    CPU_TIME_LIMIT = 30
    FILE_SIZE_LIMIT = 50
```

### Unix Systems (Linux/macOS)

**Resource Limits via `setrlimit`:**
- **Memory**: `RLIMIT_AS` - 256MB address space limit
- **CPU Time**: `RLIMIT_CPU` - 30 second limit
- **File Size**: `RLIMIT_FSIZE` - 50MB output limit
- **Signal Handling**: `SIGINT` ignored in child processes

### Windows Systems

**Job Objects API via ctypes:**
- **Memory Limits**: Process and job memory limits
- **CPU Time**: Per-job user time limitation
- **Exception Handling**: Die on unhandled exceptions
- **Process Isolation**: Job object assignment

### Process Management

**Aggressive Process Killing:**
```python
ProcessKiller.kill_process_tree(pid, aggressive=True)
```

**Cross-platform strategies:**
- **Windows**: `taskkill /F /T /PID` (force kill with tree)
- **Unix**: Signal-based termination (SIGTERM → SIGKILL)
- **Fallback**: psutil for process tree detection when available

## Input Validation

### InputValidator Class

The `InputValidator` implements comprehensive input sanitization:

**Configuration Validation:**
- Maximum 100 test cases per execution
- 1MB maximum input/expected output size
- Dictionary structure validation

**File Content Validation:**
- 10MB maximum file size for source code
- Control character filtering (`[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]`)
- UTF-8 encoding validation

**Path Sanitization:**
```python
def sanitize_path(path: str) -> str:
    path = re.sub(r'\.\./|\.\.\\', '', path)  # Prevent path traversal
    path = re.sub(r'^/|^\\', '', path)        # Remove leading slashes
    if os.path.isabs(path):
        raise ValueError("Absolute paths not allowed")
    return path
```

### Executable Validation
- Extension whitelist: ['.exe', ''] (Windows and Unix binaries)
- Path sanitization before execution
- Execution permission verification on Unix systems

## Network Security

### CORS Configuration

**Restrictive CORS Policy:**
```python
ALLOWED_ORIGINS = [
    f'http://localhost:{PORT}',
    f'http://127.0.0.1:{PORT}',
    f'http://[::1]:{PORT}'
]
```

**Security Headers:**
- `Access-Control-Allow-Origin`: Restricted to localhost only
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS only
- `Access-Control-Allow-Credentials`: false (no credentials)

### Offline-First Design

**No External Dependencies:**
- All operations occur locally
- No data transmission to external servers
- Internet connectivity not required

## Temporary File Management

### Secure Temporary Directories

**Auto-generated Directories:**
```python
self.temp_dir = tempfile.mkdtemp(prefix='cts_')
```

**Automatic Cleanup:**
```python
def cleanup_environment(self):
    if self.temp_dir and os.path.exists(self.temp_dir):
        import shutil
        shutil.rmtree(self.temp_dir)
```

### File Permission Management

**Unix Executable Permissions:**
```python
os.chmod(path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
```

**Windows**: No explicit permission setting required

## Error Handling and Logging

### Secure Error Reporting

**Client-Facing Errors:**
- Generic error messages to avoid information disclosure
- No stack traces exposed to frontend
- Safe error serialization

**Server Logging:**
- Detailed logging for debugging
- Sensitive information filtered
- Console-based logging only

### Exception Hierarchy

**Validation Errors**: User input validation failures
**Security Errors**: Security policy violations  
**Execution Errors**: Test execution failures
**System Errors**: Internal system failures

## Threat Mitigation

### Denial of Service Protection

**Resource Limits:**
- Memory: 256MB per process prevents memory exhaustion
- CPU: 30-second timeout prevents CPU hogging
- Files: Size limits prevent disk space exhaustion
- Processes: Maximum test count limits execution time

### Code Injection Prevention

**Input Sanitization:**
- Path traversal prevention
- Control character filtering
- Size limitation

**Process Isolation:**
- Sandboxed execution environment
- No shell command execution
- Direct binary execution only

### Data Privacy

**Local Storage Only:**
- Browser localStorage for configuration
- No external data transmission
- Temporary file auto-cleanup

## Security Testing Considerations

### Test Scenarios

**Input Validation Tests:**
- Path traversal attempts
- Oversized input testing
- Malformed JSON payloads

**Resource Limit Tests:**
- Memory exhaustion attempts
- CPU-intensive code execution
- Large file processing

### Monitoring and Auditing

**Security Events:**
- Failed validation attempts
- Resource limit violations
- Security policy violations

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)
For API security considerations, see [API_REFERENCE.md](./API_REFERENCE.md)
