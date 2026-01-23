class TestFileParser {
    constructor() {
        this.formats = {
            structured: /teste?\s*(\d+)\s*:\s*input:\s*([\s\S]*?)\s*expected:\s*([\s\S]*?)(?=teste?\s*\d+\s*:|#\s*=+|$)/gi
        };
    }

    async parseTestFile(file) {
        try {
            const content = await this.readFileContent(file);
            let testCases = this.parseStructuredFormat(content);
            
            if (testCases.length === 0) {
                throw new Error('No valid test cases found');
            }
            
            return this.validateAndOrganize(testCases);
        } catch (error) {
            throw error;
        }
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
            reader.onerror = (e) => reject(new Error('Error reading file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    parseStructuredFormat(content) {
        const testCases = [];
        let match;
        this.formats.structured.lastIndex = 0;
        
        while ((match = this.formats.structured.exec(content)) !== null) {
            const [fullMatch, testNumber, input, expected] = match;
            if (testNumber && input !== undefined && expected !== undefined) {
                testCases.push({
                    originalFormat: 'structured',
                    number: parseInt(testNumber.trim()),
                    rawInput: input.trim(),
                    rawExpected: expected.trim()
                });
            }
        }
        return testCases;
    }

    validateAndOrganize(testCases) {
        if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
            return [];
        }
        
        const validated = [];
        const seenNumbers = new Set();
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            if (!testCase || typeof testCase !== 'object') continue;
            if (!testCase.number || testCase.number <= 0) continue;
            if (seenNumbers.has(testCase.number)) continue;
            
            seenNumbers.add(testCase.number);
            const input = testCase.rawInput || '';
            const expected = testCase.rawExpected || '';
            
            validated.push({
                id: `test_${testCase.number}`,
                number: testCase.number,
                input: input,
                expected: expected,
                _metadata: {
                    originalFormat: testCase.originalFormat || 'structured',
                    inputLength: input.length,
                    expectedLength: expected.length
                }
            });
        }
        
        validated.sort((a, b) => a.number - b.number);
        return validated;
    }
}

window.TestFileParser = TestFileParser;
