# CTS File Formats Documentation

## Overview

CTS supports various file formats for source code, executables, and test cases. This document details the supported formats and their specifications.

## Supported File Types

### Source Code Files
- **Extension**: `.c`
- **Content**: Standard C source code
- **Encoding**: UTF-8
- **Size Limit**: 10MB

### Executable Files
- **Windows**: `.exe` extension
- **Unix/Linux**: No extension or any executable binary
- **Validation**: File must be executable (Unix) or valid binary

### Test Files
- **Primary Format**: `.txt` (CTS-generated format)
- **Alternative**: `.md` (Markdown, with CTS format sections)
- **Encoding**: UTF-8
- **Size Limit**: Practical limits based on browser capabilities

## CTS Test File Format

### Official Export Format

CTS generates test files in a specific format when using the "Export Tests" functionality. Only files created by CTS export are guaranteed to work correctly.

**Example Format:**
```text
# CTS | Code Test Studio - Generated Test File
# ID: CTS-20251224T040000
# Generation Date: 24/12/2025, 04:00:00
# Total tests: 2

test 1:
input: 5 10
expected: 15

test 2:
input: Hello World
expected: HELLO WORLD
```

### Format Specification

**Header Section:**
- Lines starting with `#` are comments/metadata
- Includes generation timestamp and test count
- Provides file identification

**Test Definition:**
```
test {number}:
input: {input_data}
expected: {expected_output}
```

**Rules:**
- Test numbers must be sequential integers starting from 1
- Input and expected output are on separate lines after the colon
- Empty lines between test definitions
- Trailing whitespace is trimmed during parsing

### Parser Implementation

The `TestFileParser` class handles the parsing:

```javascript
class TestFileParser {
    parseStructuredFormat(content) {
        // Regex pattern for CTS format
        const pattern = /teste?\s*(\d+)\s*:\s*input:\s*([\s\S]*?)\s*expected:\s*([\s\S]*?)(?=teste?\s*\d+\s*:|#\s*=+|$)/gi;
        // ... parsing logic
    }
}
```

## Configuration Storage

### Browser LocalStorage

CTS stores configuration in the browser's localStorage using the key `ctsConfig`.

**Storage Format:**
```json
{
  "autoCompile": true,
  "sourceFile": {
    "name": "example.c",
    "content": "C code content",
    "path": "example.c"
  },
  "executableFile": null,
  "isExecutable": false,
  "testCases": [
    {
      "id": "test_1735057200",
      "number": 1,
      "input": "test input",
      "expected": "expected output"
    }
  ],
  "fileTimestamps": {
    "loadTime": "12:00:00",
    "reloadTime": null
  },
  "darkMode": false
}
```

### Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `autoCompile` | Boolean | Auto-compile C code setting |
| `sourceFile` | Object/null | Loaded C source file info |
| `executableFile` | Object/null | Loaded executable file info |
| `isExecutable` | Boolean | Whether testing executable |
| `testCases` | Array | Current test cases |
| `fileTimestamps` | Object | File load/reload timestamps |
| `darkMode` | Boolean | UI theme preference |

## API Data Formats

### Test Execution Request

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed API format specifications.

### Test Execution Response

Includes detailed results with diff data for failed tests.

## Temporary File Management

### Backend Temporary Files

**Directory Structure:**
```
/tmp/cts_{random}/
├── main.c          # Source code (if compiling)
├── main.exe        # Compiled executable (Windows)
└── main           # Compiled executable (Unix)
```

**Naming Convention:**
- Prefix: `cts_`
- Random suffix: System-generated
- Auto-cleanup: After test execution

### File Permissions

**Unix Systems:**
- Source files: Read/write owner
- Executables: `chmod 755` (rwxr-xr-x)

**Windows Systems:**
- No explicit permission setting
- Relies on system defaults

## Import/Export Functionality

### Test Export

**Features:**
- Generates standardized CTS format
- Includes metadata headers
- Preserves test numbering
- UTF-8 encoding

**Usage:**
```javascript
// Frontend export function
exportTests() {
    const content = this.generateTestFile();
    const blob = new Blob([content], { type: 'text/plain' });
    // ... download logic
}
```

### Test Import

**Process:**
1. File selection via browser File API
2. Content reading with UTF-8 encoding
3. Format detection and parsing
4. Validation and organization
5. Integration into current test suite

**Validation:**
- File type check (.txt or .md)
- Format compatibility verification
- Test count and numbering validation

## Best Practices

### Test File Creation

1. **Use CTS Export**: Always use the built-in export functionality
2. **Manual Editing**: If editing manually, maintain the exact format
3. **Encoding**: Use UTF-8 to avoid character issues
4. **Line Endings**: Use consistent line endings (LF or CRLF)

### File Management

1. **Regular Exports**: Export test suites after significant changes
2. **Version Control**: Consider adding exported test files to version control
3. **Backup**: Keep backups of important test suites
4. **Organization**: Use descriptive filenames for test files

## Troubleshooting

### Common Issues

**Import Failures:**
- File not in CTS format
- Encoding issues
- Malformed test definitions

**Solution**: Use CTS export to create compatible files

**Parsing Errors:**
- Missing test numbers
- Incorrect indentation
- Special character issues

**Solution**: Validate format against the specification above

For API-related file formats, see [API_REFERENCE.md](./API_REFERENCE.md)
For security considerations, see [SECURITY.md](./SECURITY.md)
