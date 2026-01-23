# CTS Technical Troubleshooting Guide

This guide provides technical troubleshooting information for developers and advanced users of CTS.

## Common Issues and Solutions

### Backend Issues

#### Port Already in Use
**Error**: `Error: Port 8090 is already in use!`

**Solution**:
```bash
# Find process using port 8090
sudo lsof -ti:8090

# Kill the process
sudo kill -9 $(sudo lsof -ti:8090)

# Or change port in backend/server.py
PORT = 8080  # Different port
```

#### GCC Not Found
**Error**: `RuntimeError: GCC not found`

**Solution**:
```bash
# Ubuntu/Debian
sudo apt install gcc build-essential

# macOS
xcode-select --install

# Windows (MinGW)
# Download from: https://www.mingw-w64.org/
```

#### Permission Denied
**Error**: `PermissionError: [Errno 13] Permission denied`

**Solution**:
```bash
# Make scripts executable
chmod +x start.sh

# Check file permissions
ls -la start.sh
```

### Frontend Issues

#### Browser Compatibility
**Symptoms**: UI not rendering correctly, features not working

**Solution**:
- Use modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Check browser console for errors (F12)
- Clear browser cache and reload

#### LocalStorage Issues
**Symptoms**: Configuration not persisting between sessions

**Solution**:
- Check browser localStorage settings
- Clear site data and reconfigure
- Verify browser supports localStorage

```javascript
// Test localStorage
if (typeof(Storage) !== "undefined") {
    console.log("localStorage supported");
} else {
    console.log("localStorage not supported");
}
```

### File Processing Issues

#### Large File Handling
**Symptoms**: Slow performance or crashes with large files

**Solution**:
- File size limits: 10MB source files, 1MB test inputs
- Split large test suites into multiple files
- Use efficient algorithms for file processing

#### Encoding Problems
**Symptoms**: Character display issues, parsing errors

**Solution**:
- Ensure files use UTF-8 encoding
- Avoid special control characters
- Use CTS export functionality for test files

## Debugging Techniques

### Backend Debugging

**Enable Detailed Logging**:
```python
# Add to backend.py for debugging
import logging
logging.basicConfig(level=logging.DEBUG)

# Or add print statements
print(f"Processing: {config.get('test_cases', [])}")
```

**Check Process Execution**:
```python
# Monitor subprocess execution
result = subprocess.run(cmd, capture_output=True, text=True)
print(f"Return code: {result.returncode}")
print(f"STDOUT: {result.stdout}")
print(f"STDERR: {result.stderr}")
```

### Frontend Debugging

**Browser Developer Tools**:
- Press F12 to open developer tools
- Check Console tab for JavaScript errors
- Use Network tab to monitor API requests
- Use Elements tab to inspect DOM

**Debug JavaScript**:
```javascript
// Add console logs
console.log('Current state:', this.config);

// Use debugger statement
debugger;  // Pauses execution

// Monitor API calls
console.log('API request:', config);
```

## Performance Optimization

### Backend Performance

**Memory Usage**:
- Monitor with `resource` module on Unix
- Check for memory leaks in long-running processes
- Ensure proper cleanup of temporary files

**CPU Optimization**:
- Use efficient algorithms for diff comparison
- Limit concurrent processes
- Implement proper timeouts

### Frontend Performance

**DOM Optimization**:
- Minimize reflows and repaints
- Use efficient event handlers
 - Optimize file reading operations

**Memory Management**:
- Clean up event listeners
- Manage large file contents efficiently
- Use appropriate data structures

## Security Troubleshooting

### Sandbox Issues

**Resource Limit Violations**:
- Check if processes exceed memory/CPU limits
- Verify sandbox initialization
- Test with different resource-intensive programs

**Process Isolation**:
- Ensure processes are properly contained
- Verify cross-platform sandbox functionality
- Test aggressive process killing

### Input Validation

**Validation Failures**:
- Test with various input sizes and types
- Verify path sanitization works correctly
- Check character filtering

## Platform-Specific Issues

### Windows Issues

**Job Objects Failure**:
- Fallback to basic process management if Job Objects fail
- Check Windows version compatibility
- Verify administrator privileges if needed

**Executable Path Issues**:
- Use proper path separators (`\` vs `/`)
- Check file associations
- Verify executable permissions

### Unix/Linux Issues

**Resource Limits**:
- Check `ulimit` settings
- Verify `setrlimit` functionality
- Test with different user privileges

**File Permissions**:
- Ensure proper `chmod` settings
- Check umask settings
- Verify executable bit is set

## Testing and Validation

### Creating Test Cases

**Backend Testing**:
```python
# Create test configuration
test_config = {
    'test_cases': [{'input': 'test', 'expected': 'result'}],
    'source_file': {'name': 'test.c', 'content': 'int main() { return 0; }'}
}

# Test backend directly
from backend.backend import CTSBackend
backend = CTSBackend()
result = backend.process_tests(test_config)
```

**Frontend Testing**:
- Test file upload functionality
- Verify test creation and management
- Check result display and comparison

### Automated Testing Setup

**Simple Test Script**:
```python
#!/usr/bin/env python3
# test_integration.py

import sys
sys.path.append('backend')
from backend import CTSBackend

def test_basic_functionality():
    # Test implementation
    pass

if __name__ == "__main__":
    test_basic_functionality()
```

## Network and Connectivity

### Local Server Issues

**Server Not Starting**:
- Check Python installation
- Verify no firewall blocking
- Test different ports

**CORS Issues**:
- Verify CORS headers are set correctly
- Check browser same-origin policy
- Test with different browsers

## Recovery Procedures

### Data Recovery

**Configuration Loss**:
- Export test suites regularly
- Backup important configurations
- Use version control for test files

**Session Recovery**:
- Implement session backup features
- Provide import/export functionality
- Maintain file metadata

### System Recovery

**Process Cleanup**:
```bash
# Clean up orphaned processes
ps aux | grep cts
kill -9 <process_ids>

# Clean temporary directories
rm -rf /tmp/cts_*
```

## Getting Further Help

### Diagnostic Information

**Collect System Info**:
```bash
# System information
uname -a
python3 --version
gcc --version

# CTS version
cat README.md | grep "Version"
```

**Log Collection**:
- Browser console logs
- Server console output
- System logs if applicable

### Community Support
- Check existing GitHub issues
- Create detailed bug reports
- Provide reproduction steps

For development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md)
For security details, see [SECURITY.md](./SECURITY.md)
For API reference, see [API_REFERENCE.md](./API_REFERENCE.md)
