#!/usr/bin/env python3

import json
import subprocess
import tempfile
import os
import platform
import stat
import re
import resource
import signal
from datetime import datetime
from typing import Dict, List, Any
import difflib

try:
    from backend.windows_sandbox import WindowsSandbox, ProcessKiller
except ImportError:
    from windows_sandbox import WindowsSandbox, ProcessKiller

class SandboxManager:
    MEMORY_LIMIT_MB = 256
    CPU_TIME_LIMIT = 30
    FILE_SIZE_LIMIT = 50
    
    def __init__(self):
        self.windows_sandbox = None
        if platform.system() == 'Windows':
            self.windows_sandbox = WindowsSandbox()
            self.windows_sandbox.initialize_job_object()
    
    @staticmethod
    def set_unix_resource_limits():
        try:
            memory_limit = SandboxManager.MEMORY_LIMIT_MB * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))
            
            cpu_limit = SandboxManager.CPU_TIME_LIMIT
            resource.setrlimit(resource.RLIMIT_CPU, (cpu_limit, cpu_limit))
            
            file_limit = SandboxManager.FILE_SIZE_LIMIT * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_FSIZE, (file_limit, file_limit))
            
        except (resource.error, AttributeError):
            pass
    
    def create_sandboxed_process(self, cmd, **kwargs):
        default_kwargs = {
            'stdin': subprocess.PIPE,
            'stdout': subprocess.PIPE,
            'stderr': subprocess.PIPE,
            'text': True,
            'encoding': 'utf-8'
        }
        
        input_data = kwargs.pop('input', None)
        timeout = kwargs.pop('timeout', 10)
        
        default_kwargs.update(kwargs)
        
        if platform.system() == 'Windows' and self.windows_sandbox and self.windows_sandbox.initialized:
            process = subprocess.Popen(cmd, **default_kwargs)
            try:
                self.windows_sandbox.assign_process_to_job(process._handle)
            except:
                pass
        elif hasattr(os, 'fork') and platform.system() != 'Windows':
            def preexec_fn():
                SandboxManager.set_unix_resource_limits()
                signal.signal(signal.SIGINT, signal.SIG_IGN)
            
            default_kwargs['preexec_fn'] = preexec_fn
            process = subprocess.Popen(cmd, **default_kwargs)
        else:
            process = subprocess.Popen(cmd, **default_kwargs)
        
        import threading
        
        def run_with_aggressive_timeout(process, timeout):
            def timeout_handler():
                try:
                    ProcessKiller.kill_process_tree(process.pid, aggressive=True)
                except:
                    try:
                        process.kill()
                    except:
                        pass
            
            timer = threading.Timer(timeout, timeout_handler)
            timer.start()
            return timer
        
        timer = run_with_aggressive_timeout(process, timeout)
        
        return process, timer, input_data
    
    def cleanup(self):
        if self.windows_sandbox:
            self.windows_sandbox.cleanup()

class InputValidator:
    MAX_FILE_SIZE = 10 * 1024 * 1024
    MAX_INPUT_SIZE = 1024 * 1024
    MAX_TESTS = 100
    
    @staticmethod
    def validate_config(config: Dict[str, Any]) -> None:
        if not isinstance(config, dict):
            raise ValueError("Configuration must be a dictionary")
        
        test_cases = config.get('test_cases', [])
        if len(test_cases) > InputValidator.MAX_TESTS:
            raise ValueError(f"Maximum of {InputValidator.MAX_TESTS} tests allowed")
        
        for i, test_case in enumerate(test_cases):
            if not isinstance(test_case, dict):
                raise ValueError(f"Test {i+1}: must be a dictionary")
            
            input_data = test_case.get('input', '')
            expected = test_case.get('expected', '')
            
            if len(input_data) > InputValidator.MAX_INPUT_SIZE:
                raise ValueError(f"Test {i+1}: input exceeds maximum size")
            
            if len(expected) > InputValidator.MAX_INPUT_SIZE:
                raise ValueError(f"Test {i+1}: expected output exceeds maximum size")
    
    @staticmethod
    def validate_file_content(content: str, file_type: str) -> None:
        if len(content) > InputValidator.MAX_FILE_SIZE:
            raise ValueError(f"File {file_type} exceeds maximum size")
        
        if re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', content):
            raise ValueError(f"File {file_type} contains control characters")
    
    @staticmethod
    def sanitize_path(path: str) -> str:
        path = re.sub(r'\.\./|\.\.\\', '', path)
        path = re.sub(r'^/|^\\', '', path)
        
        if os.path.isabs(path):
            raise ValueError("Absolute paths are not allowed")
        
        return path
    
    @staticmethod
    def validate_executable_path(path: str) -> None:
        if not path:
            raise ValueError("Executable path cannot be empty")
        
        InputValidator.sanitize_path(path)
        
        allowed_extensions = ['.exe', '']
        file_ext = os.path.splitext(path)[1].lower()
        if file_ext not in allowed_extensions:
            raise ValueError("File extension not allowed for executable")

class TestReporter:
    def __init__(self):
        self.results = []
    
    def record_result(self, test_number: int, passed: bool, input_data: str, error_msg: str = None):
        self.results.append({
            'test_number': test_number,
            'passed': passed,
            'input': input_data,
            'error': error_msg
        })
    
    def log_diff(self, expected: str, actual: str) -> int:
        expected_lines = expected.splitlines()
        actual_lines = actual.splitlines()
        diff = difflib.unified_diff(expected_lines, actual_lines, lineterm='')
        return sum(1 for line in diff if line.startswith('+') or line.startswith('-'))

class CTSBackend:
    def __init__(self):
        self.temp_dir = None
        self.executable_path = None
        self.reporter = None

    def process_tests(self, config: Dict[str, Any]) -> Dict[str, Any]:
        print(f"Processing {len(config.get('test_cases', []))} tests")
        self.reporter = TestReporter()

        try:
            InputValidator.validate_config(config)
            
            self.prepare_environment(config)
            
            if config.get('is_executable', False):
                results = self.execute_with_executable(config['test_cases'])
            else:
                results = self.process_c_code(config)
            
            return self.prepare_response(results, config)

        except ValueError as e:
            print(f"Validation error: {e}")
            return {
                'success': False,
                'error': f"Validation error: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Processing error: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
        finally:
            self.cleanup_environment()

    def prepare_environment(self, config: Dict[str, Any]):
        self.temp_dir = tempfile.mkdtemp(prefix='cts_')
        
        if not config.get('is_executable', False):
            if os.name == 'nt':
                self.executable_path = os.path.join(self.temp_dir, "main.exe")
            else:
                self.executable_path = os.path.join(self.temp_dir, "main")

    def process_c_code(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        self.write_c_file(config['source_file'])
        if config.get('auto_compile', True):
            self.compile_code()
        return self.execute_tests(config['test_cases'])

    def write_c_file(self, source_file: Dict[str, Any]):
        if 'content' not in source_file:
            raise ValueError("Source file contains no content")
        
        content = source_file['content']
        InputValidator.validate_file_content(content, "C source")
        
        source_path = os.path.join(self.temp_dir, "main.c")
        with open(source_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"C file written: {source_path}")

    def compile_code(self):
        try:
            source_path = os.path.join(self.temp_dir, "main.c")
            result = subprocess.run(
                ["gcc", source_path, "-o", self.executable_path],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                raise RuntimeError(f"Compilation error: {result.stderr}")

            self.set_executable_permissions(self.executable_path)
            print("Code compiled successfully")

        except subprocess.TimeoutExpired:
            raise RuntimeError("Compilation timeout")
        except FileNotFoundError:
            raise RuntimeError("GCC not found")
        except Exception as e:
            raise RuntimeError(f"Compilation failed: {e}")

    def execute_with_executable(self, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        
        for i, test_case in enumerate(test_cases):
            try:
                result = self.execute_single_test(test_case, i + 1)
                results.append(result)
            except Exception as e:
                print(f"Test {i+1} error: {e}")
                results.append({
                    'test': test_case,
                    'passed': False,
                    'error': str(e),
                    'execution_time': 0,
                    'memory_usage': 0
                })
        
        return results

    def execute_tests(self, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        
        for i, test_case in enumerate(test_cases):
            try:
                result = self.execute_single_test(test_case, i + 1)
                results.append(result)
            except Exception as e:
                print(f"Test {i+1} error: {e}")
                results.append({
                    'test': test_case,
                    'passed': False,
                    'error': str(e),
                    'execution_time': 0,
                    'memory_usage': 0
                })
        
        return results

    def execute_single_test(self, test_case: Dict[str, Any], test_number: int) -> Dict[str, Any]:
        input_data = test_case.get('input', '')
        expected_output = test_case.get('expected', '').strip()

        start_time = datetime.now()

        try:
            self.validate_execution_environment()
            
            if os.name == 'nt':
                run_cmd = [self.executable_path]
            else:
                run_cmd = ["./" + os.path.basename(self.executable_path)]
            
            sandbox_manager = SandboxManager()
            process, timer, input_data_value = sandbox_manager.create_sandboxed_process(
                run_cmd,
                input=input_data,
                timeout=5,
                cwd=os.path.dirname(self.executable_path)
            )
            
            stdout, stderr = process.communicate(input=input_data_value)
            timer.cancel()
            execution_time = (datetime.now() - start_time).total_seconds() * 1000

            if process.returncode != 0:
                if process.returncode == -9:
                    raise RuntimeError(f"Memory or CPU limit exceeded: {stderr}")
                raise RuntimeError(f"Execution error: {stderr}")

            actual_output = stdout.strip().replace('\r\n', '\n')
            passed = actual_output == expected_output
            
            if passed:
                self.reporter.record_result(test_number, True, input_data)
            else:
                error_count = self.reporter.log_diff(expected_output, actual_output)
                self.reporter.record_result(test_number, False, input_data, f"Output mismatch ({error_count} differences)")

            return {
                'test': test_case,
                'passed': passed,
                'actual_output': actual_output,
                'execution_time': execution_time,
                'memory_usage': 0,
                'differences': self.get_diff_data(expected_output, actual_output) if not passed else None
            }

        except subprocess.TimeoutExpired:
            self.reporter.record_result(test_number, False, input_data, "Timeout")
            raise RuntimeError("Execution timeout")
        except UnicodeDecodeError:
            self.reporter.record_result(test_number, False, input_data, "Encoding error")
            raise RuntimeError("Output encoding error")
        except ValueError as e:
            self.reporter.record_result(test_number, False, input_data, f"Security validation failed: {str(e)}")
            raise RuntimeError(f"Security validation failed: {str(e)}")
        except Exception as e:
            self.reporter.record_result(test_number, False, input_data, f"Execution failed: {str(e)}")
            raise RuntimeError(f"Test execution failed: {str(e)}")

    def validate_execution_environment(self):
        if not self.executable_path or not os.path.exists(self.executable_path):
            raise ValueError("Executable not found")
        
        if not self.temp_dir or not self.executable_path.startswith(self.temp_dir):
            raise ValueError("Invalid executable path")
        
        if platform.system() != 'Windows':
            file_stat = os.stat(self.executable_path)
            if file_stat.st_mode & stat.S_IXUSR == 0:
                raise ValueError("Executable lacks execution permissions")

    def get_diff_data(self, expected: str, actual: str) -> Dict[str, Any]:
        expected_lines = expected.splitlines()
        actual_lines = actual.splitlines()

        diff = difflib.unified_diff(
            expected_lines,
            actual_lines,
            fromfile='Expected',
            tofile='Actual',
            lineterm=''
        )

        diff_lines = list(diff)
        error_count = sum(1 for line in diff_lines if line.startswith('+') or line.startswith('-'))

        return {
            'lines': diff_lines,
            'error_count': error_count
        }

    def prepare_response(self, results: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
        total = len(results)
        passed = sum(1 for r in results if r['passed'])
        failed = total - passed

        return {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'source_file': config.get('source_file', {}).get('name', 'compiled_executable'),
            'total': total,
            'passed': passed,
            'failed': failed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': results,
            'config': {
                'auto_compile': config.get('auto_compile', True),
                'show_diff': config.get('show_diff', True),
                'is_executable': config.get('is_executable', False)
            }
        }

    def set_executable_permissions(self, path: str):
        try:
            if platform.system() == 'Windows':
                pass
            else:
                os.chmod(path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
        except Exception as e:
            print(f"Warning: Could not set permissions for {path}: {e}")

    def cleanup_environment(self):
        if not self.temp_dir or not os.path.exists(self.temp_dir):
            return

        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print("Environment cleaned successfully")
        except Exception as e:
            print(f"Warning: Could not clean environment: {e}")

def process_json(json_input: str) -> str:
    try:
        config = json.loads(json_input)
        backend = CTSBackend()
        result = backend.process_tests(config)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        return json.dumps(error_result, ensure_ascii=False, indent=2)
