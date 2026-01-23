class TabManager {
    constructor() {
        this.currentTab = 'main';
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanels = document.querySelectorAll('.tab-panel');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTabVisibility();
    }

    setupEventListeners() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;
        this.currentTab = tabName;
        this.updateTabVisibility();
    }

    updateTabVisibility() {
        this.tabButtons.forEach(button => {
            const tabName = button.getAttribute('data-tab');
            button.classList.toggle('active', tabName === this.currentTab);
        });

        this.tabPanels.forEach(panel => {
            const panelId = panel.id.replace('-tab', '');
            panel.classList.toggle('active', panelId === this.currentTab);
        });
    }
}

class CodeTestStudio {
    constructor() {
        this.config = {
            autoCompile: true,
            sourceFile: null,
            executableFile: null,
            isExecutable: false,
            testCases: [],
            fileTimestamps: { loadTime: null, reloadTime: null },
            testFileTimestamps: { loadTime: null, reloadTime: null },
            lastFileInputPath: null,
            lastTestFileInputPath: null,
            originalFileObject: null,
            originalTestFileObject: null,
            fileMetadata: null,
            testFileMetadata: null,
            darkMode: localStorage.getItem('ctsDarkMode') === 'true'
        };

        this.currentResults = null;
        this.serverUrl = 'http://localhost:8090';
        this.tabManager = null;
        this.testParser = new TestFileParser();
        
        this.init();
    }

    async init() {
        try {
            this.tabManager = new TabManager();
            this.setupEventListeners();
            this.createDefaultTest();
            await this.checkServerConnection();
        } catch (error) {
            console.error('Error initializing Code Test Studio:', error);
        }
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.serverUrl}/api/status`);
            if (!response.ok) {
                console.warn('Server not available');
            }
        } catch (error) {
            console.error('Error connecting to server:', error);
        }
    }

    setupEventListeners() {
        const buttons = {
            'loadFileBtn': () => this.handleLoadFileButtonClick(),
            'loadTestFileBtn': () => this.handleLoadTestFileButtonClick(),
            'reloadFileBtn': () => this.reloadFile(),
            'reloadTestFileBtn': () => this.reloadTestFile(),
            'addTestBtn': () => this.addTestCase(true),
            'clearAllBtn': 'clearAllTests',
            'exportTestsBtn': 'exportTests',
            'runTestsBtn': 'runTests',
            'exportResultsBtn': 'exportResults',
            'clearResultsBtn': 'clearResults'
        };

        this.mainFileInput = this.createFileInput('.c,.exe,application/octet-stream');
        this.testFileInput = this.createFileInput('.txt,.md');

        Object.entries(buttons).forEach(([id, method]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', typeof method === 'function' ? method : () => this[method]());
            }
        });

        this.mainFileInput.addEventListener('change', (e) => this.handleFileSelectionAndLoad(e));
        this.testFileInput.addEventListener('change', (e) => this.handleTestFileSelectionAndLoad(e));

        this.setTheme(this.config.darkMode ? 'dark' : 'light');

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    createFileInput(accept) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    }

    async handleLoadFileButtonClick() {
        // Use regular file input - always opens file picker for fresh file access
        return this.mainFileInput.click();
    }

    async handleLoadTestFileButtonClick() {
        // Use regular file input - always opens file picker for fresh file access
        return this.testFileInput.click();
    }

    async handleFileSelectionAndLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const persistentSourceEl = document.getElementById('sourceFileStatus');
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'c') {
            this.config.isExecutable = false;
        } else if (extension === 'exe' || file.type === 'application/octet-stream') {
            this.config.isExecutable = true;
        } else {
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: Invalid file type (${extension})`;
            return;
        }

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            this.config.fileTimestamps.loadTime = timestamp;
            this.config.originalFileObject = file;
            this.config.fileMetadata = this.createFileMetadata(file);
            
            if (this.config.isExecutable) {
                this.config.executableFile = { name: file.name, path: file.name };
            } else {
                const content = await this.readFileContent(file);
                this.config.sourceFile = { name: file.name, content: content, path: file.name };
            }
            
            this.config.lastFileInputPath = file.path ? file.path : file.name;
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon success">task_alt</span> Source: ${file.name} | ${timestamp} | Loaded`;
            this.saveConfig();
            this.updateReloadButtons();
        } catch (error) {
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
        }

        this.mainFileInput.value = '';
    }

    async loadFileWithFileSystemAPI() {
        const persistentSourceEl = document.getElementById('sourceFileStatus');
        
        try {
            // Open file picker using File System Access API
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'C Source Files',
                        accept: { 'text/x-c': ['.c'] }
                    },
                    {
                        description: 'Executables',
                        accept: { 'application/octet-stream': ['.exe'] }
                    }
                ]
            });
            
            // Get file from handle
            const file = await fileHandle.getFile();
            this.config.fileHandle = fileHandle;
            
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'c') {
                this.config.isExecutable = false;
            } else if (extension === 'exe') {
                this.config.isExecutable = true;
            } else {
                persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: Invalid file type (${extension})`;
                return;
            }

            const timestamp = new Date().toLocaleTimeString('pt-PT');
            this.config.fileTimestamps.loadTime = timestamp;
            this.config.originalFileObject = file;
            this.config.fileMetadata = this.createFileMetadata(file);
            
            if (this.config.isExecutable) {
                this.config.executableFile = { name: file.name, path: file.name };
            } else {
                const content = await file.text();
                this.config.sourceFile = { name: file.name, content: content, path: file.name };
            }
            
            this.config.lastFileInputPath = file.name;
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon success">task_alt</span> Source: ${file.name} | ${timestamp} | Loaded`;
            this.saveConfig();
            this.updateReloadButtons();
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error loading file:', error);
                persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
            }
        }
    }

    async handleTestFileSelectionAndLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const persistentTestEl = document.getElementById('testFileStatusPermanent');
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!['txt', 'md'].includes(extension)) {
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: Invalid file type (${extension})`;
            return;
        }

        this.showProgress('Loading and validating multiple tests...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            this.config.testFileTimestamps.loadTime = timestamp;
            this.config.lastTestFileInputPath = file.path ? file.path : file.name;
            this.config.originalTestFileObject = file;
            this.config.testFileMetadata = this.createFileMetadata(file);
            
            const testCases = await this.testParser.parseTestFile(file);
            if (testCases.length === 0) throw new Error('No valid test cases found in file');
            
            this.config.testCases = testCases;
            this.renderTestCases();
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon success">task_alt</span> Tests: ${file.name} (${testCases.length} tests) | ${timestamp} | Loaded`;
            this.saveConfig();
        } catch (error) {
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: ${error.message}`;
        } finally {
            this.hideProgress();
        }

        this.testFileInput.value = '';
        this.updateReloadButtons();
    }

    createFileMetadata(file) {
        return {
            name: file.name,
            type: file.type,
            extension: file.name.split('.').pop().toLowerCase(),
            lastModified: file.lastModified,
            size: file.size
        };
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!e.target || !e.target.result) {
                    reject(new Error('File content not available'));
                    return;
                }
                resolve(e.target.result);
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    async reloadFile() {
        const persistentSourceEl = document.getElementById('sourceFileStatus');
        
        if (!this.config.originalFileObject || !this.config.fileTimestamps.loadTime) {
            if (!(this.config.sourceFile || this.config.executableFile)) {
                return await this.reloadFileWithPicker();
            }
            return;
        }

        this.showProgress('Reloading file...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            const file = this.config.originalFileObject;
            this.config.fileTimestamps.reloadTime = timestamp;
            this.config.lastFileInputPath = file.path ? file.path : file.name;
            
            try {
                const fileStatus = await this.checkSourceFileChanged();
                const message = fileStatus === 'unchanged' ? 'No file change' : 'New version loaded';
                
                if (this.config.isExecutable) {
                    this.config.executableFile = { name: file.name, path: file.name };
                } else {
                    const content = await this.readFileContent(file);
                    this.config.sourceFile = { name: file.name, content: content, path: file.name };
                }
                
                persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon success">refresh</span> Source: ${file.name} | ${timestamp} | Reloaded | <span class="material-symbols-outlined status-icon info">info</span> ${message}`;
                this.saveConfig();
            } catch (error) {
                await this.reloadFileWithIntelligentFallback();
                return;
            }
        } catch (error) {
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
        } finally {
            this.hideProgress();
        }
    }

    async reloadTestFile() {
        const persistentTestEl = document.getElementById('testFileStatusPermanent');
        
        if (!this.config.originalTestFileObject || !this.config.testFileTimestamps.loadTime) {
            if (!this.config.testCases.length > 0) {
                return await this.reloadTestFileWithPicker();
            }
            return;
        }

        this.showProgress('Reloading multiple tests...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            const file = this.config.originalTestFileObject;
            this.config.testFileTimestamps.reloadTime = timestamp;
            this.config.lastTestFileInputPath = file.path ? file.path : file.name;
            
            try {
                const testCases = await this.testParser.parseTestFile(file);
                if (testCases.length === 0) throw new Error('No valid test cases found in file');
                
                this.config.testCases = testCases;
                this.renderTestCases();
                
                const fileStatus = await this.checkTestFileChanged();
                const message = fileStatus === 'unchanged' ? 'No file change' : 'New version loaded';
                persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon success">refresh</span> Tests: ${file.name} (${testCases.length} tests) | ${timestamp} | Reloaded | <span class="material-symbols-outlined status-icon info">info</span> ${message}`;
                this.saveConfig();
            } catch (error) {
                await this.reloadTestFileWithIntelligentFallback();
                return;
            }
        } catch (error) {
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: ${error.message}`;
        } finally {
            this.hideProgress();
        }
    }

    async reloadFileWithPicker() {
        const persistentSourceEl = document.getElementById('sourceFileStatus');
        this.showProgress('Reloading file from filesystem...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            if (!this.config.lastFileInputPath) throw new Error('No file path available');
            
            return this.handleFileReload(this.mainFileInput, persistentSourceEl, timestamp);
        } catch (error) {
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
            this.hideProgress();
        }
    }

    async reloadTestFileWithPicker() {
        const persistentTestEl = document.getElementById('testFileStatusPermanent');
        this.showProgress('Reloading multiple tests from filesystem...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            if (!this.config.lastTestFileInputPath) throw new Error('No test file path available');
            
            return this.handleTestFileReload(this.testFileInput, persistentTestEl, timestamp);
        } catch (error) {
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: ${error.message}`;
            this.hideProgress();
        }
    }

    async reloadTestFileWithIntelligentFallback() {
        const persistentTestEl = document.getElementById('testFileStatusPermanent');
        this.showProgress('Intelligent reload - checking for updated file...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            if (!this.config.testFileMetadata) throw new Error('No file metadata available');

            return this.handleTestFileReload(this.createFileInput('.txt,.md'), persistentTestEl, timestamp, true);
        } catch (error) {
            persistentTestEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: ${error.message}`;
            this.hideProgress();
        }
    }

    async reloadFileWithIntelligentFallback() {
        const persistentSourceEl = document.getElementById('sourceFileStatus');
        this.showProgress('Intelligent reload - checking for updated file...');

        try {
            const timestamp = new Date().toLocaleTimeString('pt-PT');
            if (!this.config.fileMetadata) throw new Error('No file metadata available');

            return this.handleFileReload(this.createFileInput('.c,.exe,application/octet-stream'), persistentSourceEl, timestamp, true);
        } catch (error) {
            persistentSourceEl.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
            this.hideProgress();
        }
    }

    handleFileReload(inputElement, statusElement, timestamp) {
        return new Promise((resolve, reject) => {
            const reloadInput = document.createElement('input');
            reloadInput.type = 'file';
            reloadInput.accept = '.c,.exe,application/octet-stream';
            reloadInput.style.display = 'none';
            document.body.appendChild(reloadInput);
            
            reloadInput.click();
            
            reloadInput.addEventListener('change', async (event) => {
                try {
                    const file = event.target.files[0];
                    if (!file) throw new Error('No file selected');

                    this.config.originalFileObject = file;
                    if (this.config.isExecutable) {
                        this.config.executableFile = { name: file.name, path: file.name };
                    } else {
                        const content = await this.readFileContent(file);
                        this.config.sourceFile = { name: file.name, content: content, path: file.name };
                    }
                    
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon success">refresh</span> Source: ${file.name} | ${timestamp} | Reloaded`;
                    this.config.fileTimestamps.reloadTime = timestamp;
                    this.saveConfig();
                    resolve();
                } catch (error) {
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: ${error.message}`;
                    reject(error);
                } finally {
                    document.body.removeChild(reloadInput);
                    this.hideProgress();
                }
            });
            
            setTimeout(() => {
                if (reloadInput.parentNode) {
                    document.body.removeChild(reloadInput);
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Source: Reload timeout`;
                    this.hideProgress();
                    reject(new Error('Reload timeout'));
                }
            }, 30000);
        });
    }

    handleTestFileReload(inputElement, statusElement, timestamp, isIntelligentFallback = false) {
        return new Promise((resolve, reject) => {
            const reloadInput = document.createElement('input');
            reloadInput.type = 'file';
            reloadInput.accept = '.txt,.md';
            reloadInput.style.display = 'none';
            document.body.appendChild(reloadInput);
            
            reloadInput.click();
            
            reloadInput.addEventListener('change', async (event) => {
                try {
                    const file = event.target.files[0];
                    if (!file) throw new Error('No multiple tests file selected');

                    const extension = file.name.split('.').pop().toLowerCase();
                    if (!['txt', 'md'].includes(extension)) {
                        throw new Error(`Invalid test file type (${extension})`);
                    }

                    this.config.originalTestFileObject = file;
                    this.config.testFileMetadata = this.createFileMetadata(file);
                    this.config.testFileTimestamps.reloadTime = timestamp;
                    this.config.lastTestFileInputPath = file.path ? file.path : file.name;
                    
                    const testCases = await this.testParser.parseTestFile(file);
                    if (testCases.length === 0) throw new Error('No valid test cases found in file');
                    
                    this.config.testCases = testCases;
                    this.renderTestCases();
                    
                    const message = isIntelligentFallback ? 'New version loaded' : 'No file change';
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon success">refresh</span> Tests: ${file.name} (${testCases.length} tests) | ${timestamp} | Reloaded | <span class="material-symbols-outlined status-icon info">info</span> ${message}`;
                    this.saveConfig();
                    resolve();
                } catch (error) {
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: ${error.message}`;
                    reject(error);
                } finally {
                    document.body.removeChild(reloadInput);
                    this.hideProgress();
                }
            });
            
            setTimeout(() => {
                if (reloadInput.parentNode) {
                    document.body.removeChild(reloadInput);
                    statusElement.innerHTML = `<span class="material-symbols-outlined status-icon error">warning</span> Tests: Reload timeout`;
                    this.hideProgress();
                    reject(new Error('Reload timeout'));
                }
            }, 30000);
        });
    }

    async checkTestFileChanged() {
        if (!this.config.originalTestFileObject || !this.config.testFileMetadata) {
            return 'unknown';
        }

        const file = this.config.originalTestFileObject;
        const metadata = this.config.testFileMetadata;
        
        try {
            await this.testParser.parseTestFile(file);
            return (file.lastModified === metadata.lastModified && file.size === metadata.size) ? 'unchanged' : 'modified';
        } catch (error) {
            return 'modified';
        }
    }

    async checkSourceFileChanged() {
        if (!this.config.originalFileObject || !this.config.fileMetadata) {
            return 'unknown';
        }

        const file = this.config.originalFileObject;
        const metadata = this.config.fileMetadata;
        
        try {
            await this.readFileContent(file);
            return (file.lastModified === metadata.lastModified && file.size === metadata.size) ? 'unchanged' : 'modified';
        } catch (error) {
            return 'modified';
        }
    }

    updateReloadButtons() {
        const reloadFileBtn = document.getElementById('reloadFileBtn');
        const reloadTestFileBtn = document.getElementById('reloadTestFileBtn');
        
        if (reloadFileBtn) {
            const hasFile = (this.config.sourceFile || this.config.executableFile) && this.config.fileTimestamps.loadTime;
            reloadFileBtn.disabled = !hasFile;
            reloadFileBtn.classList.toggle('disabled', !hasFile);
            reloadFileBtn.classList.toggle('btn-outline', hasFile);
        }
        
        if (reloadTestFileBtn) {
            const hasTests = this.config.testCases.length > 0 && this.config.testFileTimestamps.loadTime;
            reloadTestFileBtn.disabled = !hasTests;
            reloadTestFileBtn.classList.toggle('disabled', !hasTests);
            reloadTestFileBtn.classList.toggle('btn-outline', hasTests);
        }
    }

    createDefaultTest() {
        if (this.config.testCases.length === 0) {
            this.addTestCase(false);
        }
    }

    addTestCase(scrollToTest = false) {
        const newTest = {
            id: `test_${Date.now()}`,
            number: this.config.testCases.length + 1,
            input: '',
            expected: ''
        };
        this.config.testCases.push(newTest);
        this.renderTestCase(newTest);
        this.saveConfig();
        
        if (scrollToTest) {
            setTimeout(() => {
                const newTestElement = document.getElementById(newTest.id);
                if (newTestElement) {
                    newTestElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inputField = document.getElementById(`${newTest.id}_input`);
                    if (inputField) inputField.focus();
                }
            }, 100);
        }
    }

    renderTestCases() {
        const container = document.getElementById('testsContainer');
        container.innerHTML = '';
        this.config.testCases.forEach(test => this.renderTestCase(test));
        this.updateTestCount();
    }

    renderTestCase(test) {
        const container = document.getElementById('testsContainer');
        const testElement = document.createElement('div');
        testElement.className = 'test-item';
        testElement.id = test.id;

        testElement.innerHTML = `
            <div class="test-item-header">
                <span class="test-number">Test ${test.number}</span>
                <div class="test-actions">
                    <button class="btn btn-secondary" onclick="cts.runSingleTest('${test.id}')"><span class="material-symbols-outlined">play_arrow</span>Run</button>
                    <button class="btn btn-danger" onclick="cts.removeTest('${test.id}')"><span class="material-symbols-outlined">delete</span>Remove</button>
                </div>
            </div>
            <div class="test-textarea-group">
                <div>
                    <label>Input:</label>
                    <textarea id="${test.id}_input" placeholder="Enter test input...">${test.input}</textarea>
                </div>
                <div>
                    <label>Expected Output:</label>
                    <textarea id="${test.id}_expected" placeholder="Enter expected output...">${test.expected}</textarea>
                </div>
            </div>
        `;

        container.appendChild(testElement);

        const inputTextarea = document.getElementById(`${test.id}_input`);
        const expectedTextarea = document.getElementById(`${test.id}_expected`);

        inputTextarea.addEventListener('input', (e) => {
            test.input = e.target.value;
            this.saveConfig();
        });

        expectedTextarea.addEventListener('input', (e) => {
            test.expected = e.target.value;
            this.saveConfig();
        });
    }

    removeTest(testId) {
        const removedIndex = this.config.testCases.findIndex(test => test.id === testId);
        this.config.testCases = this.config.testCases.filter(test => test.id !== testId);
        document.getElementById(testId).remove();
        this.updateTestCount();
        this.saveConfig();
        
        setTimeout(() => {
            const container = document.getElementById('testsContainer');
            if (container && this.config.testCases.length > 0) {
                if (removedIndex > 0 && removedIndex <= this.config.testCases.length) {
                    const remainingTest = this.config.testCases[Math.min(removedIndex, this.config.testCases.length - 1)];
                    const testElement = document.getElementById(remainingTest.id);
                    if (testElement) {
                        testElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else if (this.config.testCases.length === 0) {
                    container.scrollTop = 0;
                }
            }
        }, 100);
    }

    updateTestCount() {
        document.getElementById('testsCount').textContent = `(${this.config.testCases.length})`;
    }

    clearAllTests() {
        if (confirm('Are you sure you want to clear all tests? (Tests can be restored with Reload)')) {
            this.config.originalTestCases = [...this.config.testCases];
            this.config.testCases = [];
            this.renderTestCases();
            this.updateTestCount();
            this.saveConfig();
        }
    }

    async runSingleTest(testId) {
        const test = this.config.testCases.find(t => t.id === testId);
        if (!test) return;

        if (!this.config.sourceFile && !this.config.executableFile) {
            alert('Please load a C file or executable first');
            return;
        }

        this.showProgress('Running single test...');
        this.updateProgress('Executing test...', 50);

        try {
            const result = await this.executeTest(test);
            this.updateProgress('Processing results...', 100);
            setTimeout(() => {
                this.hideProgress();
                this.displaySingleResult(result);
                this.tabManager.switchTab('results');
            }, 500);
        } catch (error) {
            console.error('Error running test:', error);
            this.hideProgress();
        }
    }

    async runTests() {
        if (!this.config.sourceFile && !this.config.executableFile) {
            alert('Please load a C file or executable first');
            return;
        }

        if (this.config.testCases.length === 0) {
            alert('Please add some tests first');
            return;
        }

        this.showProgress('Running tests...');

        try {
            const results = [];
            let passed = 0;

            for (let i = 0; i < this.config.testCases.length; i++) {
                const test = this.config.testCases[i];
                this.updateProgress(`Running test ${i + 1} of ${this.config.testCases.length}...`, (i / this.config.testCases.length) * 100);

                try {
                    const result = await this.executeTest(test);
                    results.push(result);
                    if (result.passed) passed++;
                } catch (error) {
                    console.error(`Error in test ${test.number}:`, error);
                    results.push({ test: test, passed: false, error: error.message });
                }
            }

            this.currentResults = {
                timestamp: new Date().toISOString(),
                source_file: this.config.sourceFile ? this.config.sourceFile.name : this.config.executableFile.name,
                total: this.config.testCases.length,
                passed: passed,
                failed: this.config.testCases.length - passed,
                results: results
            };

            this.displayResults(this.currentResults);
            this.tabManager.switchTab('results');
        } catch (error) {
            console.error('Error running tests:', error);
        } finally {
            this.hideProgress();
        }
    }

    async executeTest(test) {
        const config = {
            test_cases: [test],
            auto_compile: true,
            show_diff: true,
            is_executable: this.config.isExecutable
        };

        if (this.config.isExecutable && this.config.executableFile) {
            config.executable_path = this.config.executableFile.path;
        } else if (this.config.sourceFile) {
            config.source_file = this.config.sourceFile;
        }

        const response = await fetch(`${this.serverUrl}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify(config)
        });

        if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Unknown server error');

        return result.results[0];
    }

    displayResults(results) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'results-summary-card';
        header.innerHTML = `
            <h3>Test Results</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-value">${results.total}</span>
                    <span class="summary-label">Total</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value passed-value">${results.passed}</span>
                    <span class="summary-label">Passed</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value failed-value">${results.failed}</span>
                    <span class="summary-label">Failed</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value">${Math.round((results.passed / results.total) * 100)}%</span>
                    <span class="summary-label">Success Rate</span>
                </div>
            </div>
        `;
        container.appendChild(header);

        this.renderResultsTable(results, container);
        
        const failedResults = results.results.filter(result => !result.passed);
        if (failedResults.length > 0) {
            this.renderFailedTestsDetails(failedResults, container);
        }
    }

    renderResultsTable(results, container) {
        const table = document.createElement('table');
        table.className = 'results-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Test #</th>
                    <th>Status</th>
                    <th>Erros</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        
        results.results.forEach((result, index) => {
            const row = document.createElement('tr');
            const passed = result.passed;
            const errorCount = result.differences ? (result.differences.error_count || 0) : 0;
            
            row.innerHTML = `
                <td><strong>${result.test.number}</strong></td>
                <td class="result-status-cell">
                    <span class="result-icon material-symbols-outlined ${passed ? 'check_circle' : 'cancel'}"></span>
                    <span class="${passed ? 'passed-text' : 'failed-text'}">${passed ? 'PASSED' : 'FAILED'}</span>
                </td>
                <td>${passed ? '-' : `<span class="error-count">${errorCount} erro${errorCount !== 1 ? 's' : ''}</span>`}</td>
                <td>${Math.round(result.execution_time)}ms</td>
            `;
            
            if (!passed) {
                row.classList.add('failed-test-row');
            }
            
            tbody.appendChild(row);
        });

        container.appendChild(table);
    }

    renderFailedTestsDetails(failedResults, container) {
        const section = document.createElement('div');
        section.className = 'failed-tests-section';
        
        section.innerHTML = `
            <h3>Failed Tests (${failedResults.length})</h3>
        `;

        failedResults.forEach(result => {
            const expandable = document.createElement('div');
            expandable.className = 'expandable-details';
            
            expandable.innerHTML = `
                <div class="test-details">
                    <div class="test-details-header">Test ${result.test.number}</div>
                    <div class="test-input"><strong>Input:</strong><br>${this.escapeHtml(result.test.input)}</div>
                    <div>${this.renderDifferences(result.differences)}</div>
                </div>
            `;
            
            section.appendChild(expandable);
        });

        container.appendChild(section);
    }

    displaySingleResult(result) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = `Test ${result.test.number} Result`;
        container.appendChild(title);

        this.renderResultItem(result, container);
    }

    renderResultItem(result, container) {
        const passed = result.passed;
        const resultElement = document.createElement('div');
        resultElement.className = `result-item ${passed ? 'passed' : 'failed'}`;

        resultElement.innerHTML = `
            <div class="result-header">
                <span class="result-status ${passed ? 'passed' : 'failed'}">
                    ${passed ? '<span class="material-symbols-outlined">check_circle</span>' : '<span class="material-symbols-outlined">cancel</span>'} Test ${result.test.number} - ${passed ? 'PASSED' : 'FAILED'}
                </span>
                <span>${Math.round(result.execution_time)}ms</span>
            </div>
            <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">
                <strong>Input:</strong> <code>${this.escapeHtml(result.test.input.substring(0, 50))}${result.test.input.length > 50 ? '...' : ''}</code>
            </div>
            ${!passed && result.differences ? this.renderDifferences(result.differences) : ''}
        `;

        container.appendChild(resultElement);
    }

    renderDifferences(differences) {
        if (!differences || !differences.lines) return '';
        
        const diffHtml = differences.lines.map(line => {
            let cssClass = 'diff-neutral';
            if (line.startsWith('+')) cssClass = 'diff-added';
            else if (line.startsWith('-')) cssClass = 'diff-removed';
            
            return `<div class="diff-line ${cssClass}">${this.escapeHtml(line)}</div>`;
        }).join('');

        return `
            <div style="margin-top: 1rem;">
                <strong>Differences (errors: ${differences.error_count || 0}):</strong>
                <div style="font-family: monospace; font-size: 0.85rem; background: var(--surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--outline);">
                    ${diffHtml}
                </div>
            </div>
        `;
    }

    exportTests() {
        if (this.config.testCases.length === 0) {
            alert('No tests to export. Please add some tests first.');
            return;
        }

        const testFileContent = this.generateTestFile();
        const blob = new Blob([testFileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cts_tests_${new Date().toISOString().replace(/[:.]/g, '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateTestFile() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '');
        
        let content = "";
        content += `# CTS | Code Test Studio - Generated Test File\n`;
        content += `# ID: CTS-${timestamp}\n`;
        content += `# Generation Date: ${now.toLocaleDateString('pt-PT')}, ${now.toLocaleTimeString('pt-PT')}\n`;
        content += `# Total tests: ${this.config.testCases.length}\n\n`;

        this.config.testCases.forEach(test => {
            content += `test ${test.number}:\n`;
            content += `input: ${test.input}\n`;
            content += `expected: ${test.expected}\n\n`;
        });

        return content;
    }

    exportResults() {
        if (!this.currentResults) {
            alert('No results to export');
            return;
        }

        const report = this.generateSimpleReport(this.currentResults);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cts_results_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateSimpleReport(results) {
        let report = `CTS | Code Test Studio - Test Results\n`;
        report += `Source: ${results.source_file}\n`;
        report += `Date: ${new Date(results.timestamp).toLocaleString()}\n`;
        report += `Score: ${results.passed}/${results.total} (${Math.round((results.passed / results.total) * 100)}%)\n\n`;
        
        results.results.forEach(result => {
            report += `Test ${result.test.number}: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
            report += `Input: ${result.test.input.substring(0, 100)}${result.test.input.length > 100 ? '...' : ''}\n`;
            if (!result.passed && result.differences) {
                report += `Errors: ${result.differences.error_count || 0}\n`;
            }
            report += `Time: ${Math.round(result.execution_time)}ms\n\n`;
        });
        
        return report;
    }

    clearResults() {
        if (confirm('Clear all results?')) {
            document.getElementById('resultsContainer').innerHTML = '<div class="empty-state">Run tests to see results here</div>';
            this.currentResults = null;
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('ctsConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Error saving config:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#39;');
    }

    showProgress(message) {
        document.getElementById('progressTextModal').textContent = message;
        document.getElementById('progressPercentage').textContent = '0%';
        document.getElementById('progressFillModal').style.width = '0%';
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('progressModal').classList.remove('hidden');
    }

    updateProgress(message, percentage) {
        document.getElementById('progressTextModal').textContent = message;
        document.getElementById('progressPercentage').textContent = `${Math.round(percentage)}%`;
        document.getElementById('progressFillModal').style.width = `${percentage}%`;
    }

    hideProgress() {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('progressModal').classList.add('hidden');
    }

    toggleTheme() {
        const currentTheme = this.config.darkMode ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.config.darkMode = newTheme === 'dark';
        localStorage.setItem('ctsDarkMode', this.config.darkMode.toString());
        this.forceThemeUpdate();
    }

    forceThemeUpdate() {
        const containers = document.querySelectorAll('.container, .tab-system, .main-section, .tab-panel, .btn');
        containers.forEach(el => {
            const display = el.style.display;
            el.style.display = 'none';
            setTimeout(() => {
                el.style.display = display || '';
            }, 10);
        });
    }

    setTheme(theme) {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
            themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
        }
    }
}

let cts;
document.addEventListener('DOMContentLoaded', () => {
    cts = new CodeTestStudio();
});
