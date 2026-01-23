#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo "========================================"
    echo "   CTS | Code Test Studio"
    echo "========================================"
    echo ""
}

print_section() {
    echo "========================================"
    echo "         Dependency Check"
    echo "========================================"
    echo ""
}

print_notice() {
    echo "========================================"
    echo "    IMPORTANT NOTICE"
    echo "========================================"
    echo -e "  ${YELLOW}VS Code may open during installation.${NC}"
    echo -e "  ${YELLOW}This is NORMAL and will NOT affect the process.${NC}"
    echo -e "  ${YELLOW}You can close any VS Code windows that open.${NC}"
    echo -e "  ${YELLOW}They are just empty files.${NC}"
    echo "========================================"
    echo ""
}

print_step() {
    echo "[STEP $1] $2..."
}

print_ok() {
    echo "[OK] $1"
}

print_not_found() {
    echo "[NOT FOUND] $1"
}

print_installing() {
    echo "Installing $1..."
}

print_success() {
    echo "[OK] $1"
}

print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "macos" ;;
        *)          echo "unknown" ;;
    esac
}

# Check if Python 3.12+ is installed
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
        
        # Extract major and minor version
        MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 6 ]; then
            print_ok "Python $PYTHON_VERSION found (3.6+)"
            return 0
        else
            print_not_found "Python version too old ($PYTHON_VERSION, need 3.6+)"
            return 1
        fi
    else
        print_not_found "Python not found"
        return 1
    fi
}

# Install pyenv
install_pyenv() {
    print_status "Installing pyenv..."
    
    if [ "$OS" = "linux" ]; then
        # Install dependencies
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y build-essential libssl-dev zlib1g-dev \
                libbz2-dev libreadline-dev libsqlite3-dev curl git
        elif command -v yum &> /dev/null; then
            sudo yum install -y gcc zlib-devel bzip2-devel openssl-devel \
                ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel xz-devel
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y gcc zlib-devel bzip2-devel openssl-devel \
                ncurses-devel sqlite-devel readline-devel tk-devel gdbm-devel xz-devel
        elif command -v pacman &> /dev/null; then
            sudo pacman -Sy base-devel
        fi
        
        # Install pyenv
        curl https://pyenv.run | bash
    elif [ "$OS" = "macos" ]; then
        # Install Homebrew if not present
        if ! command -v brew &> /dev/null; then
            print_status "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        # Install pyenv via Homebrew
        print_status "Installing pyenv via Homebrew..."
        brew install pyenv
    fi
    
    # Add pyenv to PATH if not already configured
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
    eval "$(pyenv virtualenv-init -)" 2>/dev/null || true
    
    print_success "pyenv installed"
}

# Install Python 3.12 via pyenv
install_python_312() {
    print_status "Installing Python 3.12 via pyenv..."
    
    # Ensure pyenv is available
    if ! command -v pyenv &> /dev/null; then
        install_pyenv
    fi
    
    # Configure pyenv for interactive shell
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)" 2>/dev/null || true
    
    # Install Python 3.12
    pyenv install -s 3.12.10
    pyenv global 3.12.10
    
    print_success "Python 3.12.10 installed and set as global"
}

# Check if GCC is installed
check_gcc() {
    if command -v gcc &> /dev/null; then
        GCC_VERSION=$(gcc --version | head -n1 | cut -d' ' -f3-)
        print_ok "GCC $GCC_VERSION found"
        return 0
    else
        print_not_found "GCC not found"
        return 1
    fi
}

# Install GCC
install_gcc() {
    print_status "Installing GCC..."
    
    if [ "$OS" = "linux" ]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y gcc build-essential
        elif command -v yum &> /dev/null; then
            sudo yum install -y gcc gcc-c++
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y gcc gcc-c++
        elif command -v pacman &> /dev/null; then
            sudo pacman -Sy gcc base-devel
        fi
    elif [ "$OS" = "macos" ]; then
        if ! xcode-select -p &> /dev/null; then
            print_status "Installing Xcode Command Line Tools..."
            xcode-select --install
            echo "Please wait for Xcode installation to complete..."
            until xcode-select -p &> /dev/null; do
                sleep 5
            done
        fi
        print_success "Xcode Command Line Tools installed"
    fi
    
    print_success "GCC installed"
}

# Prompt for installation
prompt_install() {
    echo ""
    read -p "Install $1? [Y/n]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        return 0
    else
        echo "[SKIPPED] $1 installation skipped"
        return 1
    fi
}

# Main
main() {
    print_header
    print_section
    print_notice
    
    OS=$(detect_os)
    
    if [ "$OS" = "unknown" ]; then
        echo "Unsupported operating system"
        exit 1
    fi
    
    print_status "Detected OS: $OS"
    
    # STEP 1: Check Python
    print_step "1" "Checking Python 3.6+"
    
    MISSING_PYTHON=0
    set +e
    check_python
    PYTHON_RESULT=$?
    set -e
    if [ $PYTHON_RESULT -ne 0 ]; then
        MISSING_PYTHON=1
        if prompt_install "Python 3.12"; then
            install_python_312
            print_success "Python 3.12 installed"
        fi
    fi
    
    echo ""
    
    # STEP 2: Check GCC
    print_step "2" "Checking GCC"
    
    MISSING_GCC=0
    set +e
    check_gcc
    GCC_RESULT=$?
    set -e
    if [ $GCC_RESULT -ne 0 ]; then
        MISSING_GCC=1
        if prompt_install "GCC"; then
            install_gcc
            print_success "GCC installed"
        fi
    fi
    
    # Summary
    echo ""
    echo "========================================"
    echo "         Summary"
    echo "========================================"
    echo ""
    
    if [ $MISSING_PYTHON -eq 0 ]; then
        PYTHON_VER=$(python3 --version 2>&1 | cut -d' ' -f2)
        echo "Python: $PYTHON_VER (installed)"
    else
        echo "Python: not installed"
    fi
    
    if [ $MISSING_GCC -eq 0 ]; then
        GCC_VER=$(gcc --version | head -n1 | cut -d' ' -f3-)
        echo "GCC: $GCC_VER (installed)"
    else
        echo "GCC: not installed"
    fi
    
    echo ""
    echo "Press Enter to close..."
    read
}

main "$@"
