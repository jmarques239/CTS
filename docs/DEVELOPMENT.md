# CTS Development Guide

## Development Environment Setup

### Prerequisites
- **Python 3.6+**
- **GCC compiler** (or Clang)
- **Modern web browser** for testing
- **Git** for version control

### Quick Setup
```bash
git clone <repository-url>
cd CTS
python3 backend/server.py
```

## Project Structure

```
CTS/
├── backend/
│   ├── backend.py          # Main backend logic
│   ├── server.py           # HTTP server
│   └── windows_sandbox.py  # Windows-specific sandbox
├── frontend/
│   ├── index.html          # Main UI
│   ├── styles.css          # Styling
│   ├── validator.js        # Main frontend logic
│   └── test_parser.js      # Test file parsing
├── docs/                   # Documentation
├── assets/                 # Logos and icons
└── start scripts           # Platform-specific startup
```

## Code Organization

### Backend Architecture

**Main Components:**
- `CTSBackend`: Core test processing engine
- `SandboxManager`: Cross-platform resource limits
- `InputValidator`: Security and input validation
- `TestReporter`: Result generation and comparison

**Key Design Patterns:**
- Separation of concerns between components
- Exception-based error handling
- Resource cleanup with context managers pattern
- Configuration validation before execution

### Frontend Architecture

**Main Components:**
- `CodeTestStudio`: Main application controller
- `TabManager`: Tab navigation system
- `TestFileParser`: File format parsing
- Theme system: Dark/light mode management

**Design Patterns:**
- Event-driven architecture
- LocalStorage for state persistence
- Async/await for file operations
- Modular class-based structure

## Development Workflow

### Making Changes

1. **Backend Changes**:
   - Modify files in `backend/` directory
   - Test with `python3 backend/server.py`
   - Ensure proper error handling and cleanup

2. **Frontend Changes**:
   - Modify files in `frontend/` directory
   - Test in browser with live server
   - Check cross-browser compatibility

3. **Testing Changes**:
   - Create test cases in the UI
   - Verify both C code and executable testing
   - Test error conditions and edge cases

### Code Standards

**Python Code**:
- Follow PEP 8 style guide
- Use type hints for function signatures
- Document complex logic with comments
- Handle exceptions appropriately

**JavaScript Code**:
- Use modern ES6+ features
- Follow consistent naming conventions
- Use async/await for asynchronous operations
- Maintain browser compatibility

## API Development

### Adding New Endpoints

1. **Define endpoint** in `server.py`:
```python
def handle_new_endpoint(self):
    # Implementation logic
    pass
```

2. **Add route handling**:
```python
def do_GET(self):
    if parsed_path.path == '/api/new_endpoint':
        self.handle_new_endpoint()
```

3. **Update CORS headers** if needed

### Backend-Frontend Communication

**Request Flow**:
1. Frontend prepares JSON configuration
2. POST request to `/api/execute`
3. Backend processes and validates
4. Response with results or errors

**Error Handling**:
- Consistent error response format
- Appropriate HTTP status codes
- User-friendly error messages

## Security Considerations

### Input Validation
- Always validate incoming data in `InputValidator`
- Use size limits and character filtering
- Sanitize file paths and user inputs

### Resource Management
- Implement proper cleanup in `cleanup_environment`
- Use temporary directories with auto-removal
- Set appropriate resource limits

### Sandbox Implementation
- Maintain cross-platform compatibility
- Test resource limits on all platforms
- Ensure process termination works correctly

## Testing Strategies

### Manual Testing Checklist

**Backend Testing**:
- [ ] C code compilation
- [ ] Executable testing
- [ ] Error handling
- [ ] Resource limits
- [ ] Cleanup functionality

**Frontend Testing**:
- [ ] File upload and parsing
- [ ] Test creation and management
- [ ] Result display
- [ ] Theme switching
- [ ] LocalStorage persistence

### Automated Testing (Future)

Consider adding:
- Unit tests for backend components
- Integration tests for API endpoints
- Browser automation tests for UI

## Performance Optimization

### Backend Optimizations
- Efficient temporary file management
- Proper process resource limits
- Optimized diff algorithm usage

### Frontend Optimizations
- Efficient DOM manipulation
- Debounced input handling
- Optimized file reading operations

## Debugging Tips

### Backend Debugging
```python
# Add debug prints for complex operations
print(f"Processing test {test_number}")

# Use try-catch for error tracking
try:
    # operation
except Exception as e:
    print(f"Error in operation: {e}")
```

### Frontend Debugging
```javascript
// Use browser developer tools
console.log('Current state:', this.config);

// Error handling
try {
    // operation
} catch (error) {
    console.error('Operation failed:', error);
}
```

## Contributing Guidelines

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit pull request with description

### Documentation
- Update relevant documentation files
- Add comments for complex logic
- Maintain README.md for users

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] Testing performed

## Deployment Considerations

### Platform Support
- Ensure Windows/Linux/macOS compatibility
- Test with different Python versions (3.6+)
- Verify GCC/Clang compiler support

### Dependencies
- Minimal external dependencies
- Cross-platform compatibility
- Easy installation process

## Future Development Ideas

### Potential Enhancements
- Additional programming language support
- Advanced diff visualization
- Test suite management features
- Plugin system for custom validators

### Technical Debt
- Consider adding comprehensive test suite
- Explore performance profiling
- Evaluate modular architecture improvements

For API reference, see [API_REFERENCE.md](./API_REFERENCE.md)
For security details, see [SECURITY.md](./SECURITY.md)
For architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md)
