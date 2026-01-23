# CTS API Reference

## API Overview

CTS provides a simple RESTful API for communication between the frontend and backend. All API endpoints are designed for local/offline operation.

## Base Information

**Server URL**: `http://localhost:8090`
**Content Type**: `application/json`
**CORS**: Restricted to localhost origins only

## API Endpoints

### GET /api/status

**Description**: Health check endpoint to verify server availability

**Request**:
```http
GET /api/status
```

**Response**:
```json
{
  "status": "online",
  "server": "Code Test Studio Server v1",
  "version": "1.0.0",
  "timestamp": 1735057200.123456
}
```

**Status Codes**:
- `200 OK`: Server is running
- Connection errors indicate server unavailable

### POST /api/execute

**Description**: Execute tests against C code or pre-compiled executables

**Request**:
```http
POST /api/execute
Content-Type: application/json
```

**Request Body**:
```json
{
  "test_cases": [
    {
      "input": "test input data",
      "expected": "expected output"
    }
  ],
  "source_file": {
    "name": "filename.c",
    "content": "C source code content"
  },
  "executable_path": "path/to/executable",
  "auto_compile": true,
  "show_diff": true,
  "is_executable": false
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `test_cases` | Array | Yes | Array of test cases to execute |
| `test_cases[].input` | String | Yes | Input data for the test |
| `test_cases[].expected` | String | Yes | Expected output for the test |
| `source_file` | Object | Conditional* | Source code information |
| `source_file.name` | String | Yes | Name of the source file |
| `source_file.content` | String | Yes | Content of the C source file |
| `executable_path` | String | Conditional* | Path to pre-compiled executable |
| `auto_compile` | Boolean | No | Whether to auto-compile C code (default: true) |
| `show_diff` | Boolean | No | Whether to generate diff data (default: true) |
| `is_executable` | Boolean | No | Whether testing executable (default: false) |

*Note: Either `source_file` or `executable_path` must be provided.*

**Response**:

**Success Response (200 OK)**:
```json
{
  "success": true,
  "timestamp": "2025-01-01T12:00:00.000000",
  "source_file": "main.c",
  "total": 1,
  "passed": 1,
  "failed": 0,
  "success_rate": 100.0,
  "results": [
    {
      "test": {
        "input": "5 10",
        "expected": "15"
      },
      "passed": true,
      "actual_output": "15",
      "execution_time": 15.5,
      "memory_usage": 0,
      "differences": null
    }
  ],
  "config": {
    "auto_compile": true,
    "show_diff": true,
    "is_executable": false
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Validation error: Maximum of 100 tests allowed",
  "timestamp": "2025-01-01T12:00:00.000000"
}
```

**Error Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "Server error: GCC not found",
  "timestamp": "2025-01-01T12:00:00.000000"
}
```

## Response Fields Detail

### Main Response Object

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Overall operation success |
| `timestamp` | String ISO 8601 | When the operation completed |
| `source_file` | String | Name of the tested source file |
| `total` | Integer | Total number of tests executed |
| `passed` | Integer | Number of tests that passed |
| `failed` | Integer | Number of tests that failed |
| `success_rate` | Float | Percentage of tests passed (0-100) |
| `results` | Array | Detailed results for each test |
| `config` | Object | Configuration used for execution |

### Individual Test Result

| Field | Type | Description |
|-------|------|-------------|
| `test` | Object | Original test case data |
| `passed` | Boolean | Whether the test passed |
| `actual_output` | String | Actual output from execution |
| `execution_time` | Float | Execution time in milliseconds |
| `memory_usage` | Integer | Memory usage (currently 0, reserved) |
| `differences` | Object/null | Diff data if test failed |

### Differences Object (When test fails)

| Field | Type | Description |
|-------|------|-------------|
| `lines` | Array | Unified diff lines |
| `error_count` | Integer | Number of differences found |

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful execution
- `400 Bad Request`: Invalid input or validation error
- `404 Not Found`: Invalid endpoint
- `500 Internal Server Error`: Server-side error

### Error Categories

**Validation Errors** (400):
- Invalid JSON format
- Missing required fields
- Size limitations exceeded
- Security validation failures

**Execution Errors** (500):
- Compilation failures
- Process execution errors
- Resource limit violations
- System errors

## Frontend Integration

### JavaScript Example

```javascript
async function executeTests(config) {
  try {
    const response = await fetch('http://localhost:8090/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Configuration Examples

**C Code Testing**:
```json
{
  "test_cases": [
    {"input": "5 10", "expected": "15"},
    {"input": "Hello", "expected": "HELLO"}
  ],
  "source_file": {
    "name": "calculator.c",
    "content": "#include <stdio.h>\nint main() { /* code */ }"
  },
  "auto_compile": true,
  "is_executable": false
}
```

**Executable Testing**:
```json
{
  "test_cases": [
    {"input": "test input", "expected": "expected output"}
  ],
  "executable_path": "myprogram.exe",
  "is_executable": true
}
```

## Security Considerations

### Input Validation
- Maximum 100 test cases per request
- 10MB file size limit for source code
- 1MB limit for individual test inputs/outputs
- Path sanitization for executable paths

### CORS Policy
- Only localhost origins allowed
- No credential support
- Limited HTTP methods (GET, POST, OPTIONS)

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)
For security implementation, see [SECURITY.md](./SECURITY.md)
