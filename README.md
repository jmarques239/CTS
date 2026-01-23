# 🧪 CTS | Code Test Studio

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.6%2B-blue)
![Platform](https://img.shields.io/badge/Platform-Cross--platform-success)

**Universal Code Testing Solution** - A modern web-based testing environment for C programs and executables.

> **Testing platform that bridges the gap between development and automated assessment**

<img src="assets/preview.gif" width="600" alt="App Preview">

## 📑 Table of Contents

- [🎓 Motivation & Educational Context](#-motivation--educational-context)
- [🚀 Install & Run](#-install--run)
- [📖 Quick Usage](#-quick-usage)
- [🌟 Key Features](#-key-features)
- [📚 Technical Documentation](#-technical-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

CTS is a **modern web-based testing platform** designed for educators, developers, and students. It provides automated testing of C programs with **real-time visual comparison** and **detailed feedback**.

### Why CTS?

- **🚀 Instant Setup** - Web-based interface, no complex installations
- **⚡ Dual Mode** - Test both source code and pre-compiled executables
- **📊 Visual Results** - Color-coded side-by-side comparison
- **🏠 100% Offline** - Runs locally, no internet required
- **🎨 Modern UI** - Dark/Light themes with professional design

---

## 🎓 Motivation & Educational Context

### The Problem That Inspired CTS

As a Computer Science student at Universidade Aberta (UAb), I encountered significant limitations with the university's testing platform, **[VPL (Virtual Programming Lab)](https://moodle.org/plugins/mod_vpl)**, a Moodle module used to manage programming assignments.

**Key Challenges:**
- 🚫 **Online-Only** - Automatic Testing was only possible through the online platform
- 🔍 **Manual Comparison** - Failed tests showed only raw output, requiring character-by-character comparison
- ⏱️ **Time-Consuming** - Identifying subtle differences became tedious and error-prone
- 💻 **Limited Feedback** - No visual assistance for identifying mismatches

**The Solution:**
CTS was born from the need for a **local, visual testing environment** that provides:
- ✅ **Immediate Difference Identification** - Color-coded visual comparison
- 🏠 **Offline Operation** - Complete independence from internet connectivity
- 🎯 **Educational Focus** - Designed specifically for learning and debugging
- 🔧 **Developer-Friendly** - Professional tools for serious code validation

**Impact on Education:**
- Faster learning through immediate feedback
- Better debugging with visual comparison
- Flexible environment for learning anywhere

---

## 🚀 Install & Run

### Prerequisites
- **Python 3.6+**
- **GCC Compiler** (for C code compilation)
- **Modern Web Browser** (Chrome, Brave, Firefox, Safari, Edge)

---

### Step 1: Clone Repository

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/jmarques239/CTS.git
cd CTS
```

**Option B: Download ZIP**
1. Visit: https://github.com/jmarques239/CTS
2. Click the green **Code** button
3. Select **Download ZIP**
4. Extract and navigate to the folder

---

### Step 2: Install Dependencies

**Linux/macOS:**
```bash
chmod +x check_dependencies.sh && ./check_dependencies.sh
```

**Windows:**
```batch
check_dependencies.bat
```

---

### Step 3: Run the Software

```bash
python3 backend/server.py
```

**Access the Interface:**
Open your browser at: **http://localhost:8090**

---

### Manual Installation

If you prefer not to use the dependency scripts:

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install python3 python3-pip gcc build-essential
```

**macOS:**
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python3 gcc
```

**Windows:**
1. Install Python 3.12 from https://www.python.org/downloads/
2. Install MSYS2 from https://www.msys2.org/
3. Run in MSYS2: `pacman -S mingw-w64-ucrt-x86_64-gcc`

---

## 📖 Quick Usage

### Step 1: Load Your Code
- **C Source Files**: Upload `.c` files for automatic compilation
- **Pre-compiled Executables**: Test binaries directly (`.exe` on Windows)

### Step 2: Create or Import Tests
1. Click **"Add Test"** button
2. Enter input data in the left textarea
3. Enter expected output in the right textarea
4. Tests are saved automatically

**Import Test Files:** Only files exported by CTS are guaranteed to work correctly.

### Step 3: Execute Tests
- **Single Test**: Click "Run" on individual tests
- **Batch Testing**: Use "Run All Tests" for comprehensive assessment

### Step 4: Analyze Results
- **Summary Dashboard**: Total tests, pass/fail counts, success rate
- **Visual Comparison**: Side-by-side expected vs actual output
- **Error Analysis**: Color-coded diff highlighting differences

---

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **C Code Compilation** | Automatic GCC compilation with error handling |
| **Executable Support** | Test pre-compiled binaries directly |
| **Batch Processing** | Run multiple tests simultaneously |
| **Visual Diff** | Color-coded comparison highlights differences |
| **Smart Reload** | Intelligent file monitoring with user confirmation |
| **Offline-First** | 100% local operation, no internet required |
| **Theme System** | Automatic Dark/Light mode switching |
| **Export/Import** | Share test cases across projects |

For detailed documentation on all features, see **[docs/FEATURES.md](docs/FEATURES.md)**.

---

## 📚 Technical Documentation

Comprehensive documentation for developers and advanced users:

### Core Documentation
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System architecture and components
- **[Security Implementation](docs/SECURITY.md)** - Security measures and sandboxing
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation

### Development Resources
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, coding standards, workflow
- **[File Formats](docs/FILE_FORMATS.md)** - Supported formats and specifications
- **[Configuration Guide](docs/CONFIGURATION.md)** - Environment variables and customization

### Support
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - How to contribute
- **[Troubleshooting Guide](docs/TROUBLESHOOTING_TECH.md)** - Advanced troubleshooting

---

## 🤝 Contributing

We welcome contributions from the educational and developer communities!

### How to Contribute
1. Fork the repository: https://github.com/jmarques239/CTS
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed guidelines, see **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**.

---

## 📄 License

This project is licensed under the **MIT License**.

This provides maximum freedom for:
- ✅ Educational use in schools and universities
- ✅ Commercial use in companies
- ✅ Modification and distribution
- ✅ Integration with other projects

---

**CTS | Code Test Studio** - *Making code testing accessible, visual, and effective for everyone.*

⭐ **If you find this project helpful, please give it a star!**
