import os
import platform
import ctypes
import ctypes.wintypes
import subprocess

class WindowsSandbox:
    JOB_OBJECT_LIMIT_WORKING_SET = 0x00000001
    JOB_OBJECT_LIMIT_PROCESS_TIME = 0x00000004
    JOB_OBJECT_LIMIT_JOB_MEMORY = 0x00000200
    JOB_OBJECT_LIMIT_DIE_ON_UNHANDLED_EXCEPTION = 0x00000400
    
    def __init__(self):
        self.job_handle = None
        self.memory_limit_mb = 256
        self.cpu_time_limit = 30
        self.initialized = False
        
    def initialize_job_object(self):
        if platform.system() != 'Windows':
            return False
            
        try:
            kernel32 = ctypes.windll.kernel32
            
            self.job_handle = kernel32.CreateJobObjectW(None, None)
            if not self.job_handle:
                return False
            
            info = ctypes.create_string_buffer(1024)
            result = kernel32.QueryInformationJobObject(
                self.job_handle, 
                1, 
                info, 
                ctypes.sizeof(info), 
                None
            )
            
            limits = self._create_job_limits()
            if not kernel32.SetInformationJobObject(self.job_handle, 2, ctypes.byref(limits)):
                kernel32.CloseHandle(self.job_handle)
                self.job_handle = None
                return False
                
            self.initialized = True
            return True
            
        except Exception:
            if self.job_handle:
                try:
                    ctypes.windll.kernel32.CloseHandle(self.job_handle)
                except:
                    pass
                self.job_handle = None
            return False
    
    def _create_job_limits(self):
        class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", ctypes.c_ulonglong),
                ("PerJobUserTimeLimit", ctypes.c_ulonglong),
                ("LimitFlags", ctypes.c_ulong),
                ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t),
                ("ActiveProcessLimit", ctypes.c_ulong),
                ("Affinity", ctypes.c_size_t),
                ("PriorityClass", ctypes.c_ulong),
                ("SchedulingClass", ctypes.c_ulong)
            ]
        
        class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                ("IoInfo", ctypes.c_ulonglong),
                ("ProcessMemoryLimit", ctypes.c_size_t),
                ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryUsed", ctypes.c_size_t),
                ("PeakJobMemoryUsed", ctypes.c_size_t)
            ]
        
        limits = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        
        cpu_limit_seconds = self.cpu_time_limit * 10000000
        limits.BasicLimitInformation.PerJobUserTimeLimit = cpu_limit_seconds
        limits.BasicLimitInformation.LimitFlags = (
            self.JOB_OBJECT_LIMIT_PROCESS_TIME |
            self.JOB_OBJECT_LIMIT_JOB_MEMORY |
            self.JOB_OBJECT_LIMIT_DIE_ON_UNHANDLED_EXCEPTION
        )
        
        memory_limit_bytes = self.memory_limit_mb * 1024 * 1024
        limits.ProcessMemoryLimit = memory_limit_bytes
        limits.JobMemoryLimit = memory_limit_bytes
        
        return limits
    
    def assign_process_to_job(self, process_handle):
        if not self.initialized or not self.job_handle:
            return False
            
        try:
            kernel32 = ctypes.windll.kernel32
            return kernel32.AssignProcessToJobObject(self.job_handle, process_handle)
        except Exception:
            return False
    
    def cleanup(self):
        if self.job_handle:
            try:
                ctypes.windll.kernel32.CloseHandle(self.job_handle)
            except:
                pass
            self.job_handle = None
        self.initialized = False

class ProcessKiller:
    @staticmethod
    def kill_process_tree(pid, aggressive=False):
        try:
            if platform.system() == 'Windows':
                return ProcessKiller._kill_windows_process_tree(pid, aggressive)
            else:
                return ProcessKiller._kill_unix_process_tree(pid, aggressive)
        except Exception:
            return False
    
    @staticmethod
    def _kill_windows_process_tree(pid, aggressive):
        try:
            if aggressive:
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(pid)], 
                             timeout=5, capture_output=True)
            else:
                subprocess.run(['taskkill', '/T', '/PID', str(pid)], 
                             timeout=5, capture_output=True)
            return True
        except Exception:
            return False
    
    @staticmethod
    def _kill_unix_process_tree(pid, aggressive):
        try:
            import signal
            
            try:
                import psutil
                parent = psutil.Process(pid)
                children = parent.children(recursive=True)
                
                for child in children:
                    try:
                        if aggressive:
                            child.kill()
                        else:
                            child.terminate()
                    except:
                        pass
                
                if aggressive:
                    parent.kill()
                else:
                    parent.terminate()
                    
                return True
            except ImportError:
                pass
            except Exception:
                pass
            
            if aggressive:
                os.kill(pid, signal.SIGKILL)
            else:
                os.kill(pid, signal.SIGTERM)
                
            return True
                
        except Exception:
            return False
