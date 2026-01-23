# 🔧 Configuration Guide

This document covers configuration settings for CTS | Code Test Studio.

## Table of Contents

- [Theme Preferences](#theme-preferences)
- [Server Configuration](#server-configuration)
- [Resource Limits](#resource-limits)

---

## Theme Preferences

CTS automatically detects and applies your system's theme preference.

### Automatic Detection

By default, CTS respects your operating system's theme setting:

| System | Theme Source |
|--------|--------------|
| Windows 10/11 | System Settings → Colors |
| macOS | System Preferences → Appearance |
| Linux | Desktop Environment settings |

### Manual Override

You can toggle the theme manually in the web interface:

1. Click the **theme toggle** icon in the toolbar
2. Select **Light** or **Dark** mode
3. Preference is saved to browser localStorage

---

## Server Configuration

### Port Configuration

The server runs on port **8090** by default.

```python
# In backend/server.py
PORT = 8090  # Default port
```

### CORS Settings

For security, CORS is restricted to localhost origins:

```python
# In backend/server.py
ALLOWED_ORIGINS = [
    "http://localhost:8090",
    "http://127.0.0.1:8090",
    "http://[::1]:8090"
]
```

---

## Resource Limits

The following limits are **hard-coded** in the backend for security:

### Memory & CPU Limits

| Resource | Limit | Unit |
|----------|-------|------|
| Memory | 256 | MB |
| CPU Time | 30 | seconds |
| File Size (output) | 50 | MB |

```python
# In backend/backend.py - SandboxManager class
MEMORY_LIMIT_MB = 256
CPU_TIME_LIMIT = 30
FILE_SIZE_LIMIT = 50
```

### File Upload Limits

| Resource | Limit | Description |
|----------|-------|-------------|
| Source File | 10 | MB max size |
| Test Input | 1 | MB max size |
| Test Expected | 1 | MB max size |
| Total Tests | 100 | per request |

```python
# In backend/backend.py - InputValidator class
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_INPUT_SIZE = 1024 * 1024      # 1 MB
MAX_TESTS = 100                   # max tests per batch
```

### Timeout Settings

| Operation | Timeout | Description |
|-----------|---------|-------------|
| Compilation | 30 | seconds |
| Test Execution | 5 | seconds |

---

## Related Documentation

- **[Architecture Overview](ARCHITECTURE.md)** - System architecture
- **[Security Implementation](SECURITY.md)** - Security measures
- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Usage Guide](../README.md#-quick-usage)** - Quick start
- **[Troubleshooting](TROUBLESHOOTING_TECH.md)** - Common issues

---

⭐ **If you find this helpful, please give the main repository a star!**
