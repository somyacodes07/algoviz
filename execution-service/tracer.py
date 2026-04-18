import lldb # type: ignore
import sys
import json
import os

def trace_execution(exe_path):
    # Initialize debugger
    debugger = lldb.SBDebugger.Create()
    debugger.SetAsync(False)
    
    # Create target
    target = debugger.CreateTargetWithFileAndArch(exe_path, lldb.LLDB_ARCH_DEFAULT)
    if not target:
        print(json.dumps({"error": "Failed to create target"}))
        sys.exit(1)

    # Set breakpoint at main
    breakpoint = target.BreakpointCreateByName("main", target.GetExecutable().GetFilename())

    # Launch process
    process = target.LaunchSimple(None, None, os.getcwd())
    
    if not process or process.GetState() != lldb.eStateStopped:
        print(json.dumps([{"line": 0, "variables": {}, "callStack": [], "consoleOutput": [{"type": "error", "message": "Failed to launch process"}], "isError": True, "errorMessage": "Launch Failed"}]))
        sys.exit(1)

    timeline = []
    max_steps = 2000
    steps = 0

    thread = process.GetSelectedThread()

    while process.GetState() == lldb.eStateStopped and steps < max_steps:
        steps += 1
        
        frame = thread.GetFrameAtIndex(0)
        line_entry = frame.GetLineEntry()
        line = line_entry.GetLine()
        
        # Only capture if in the user file
        file_spec = line_entry.GetFileSpec()
        filename = file_spec.GetFilename()
        
        if filename and exe_path.endswith(filename.replace(".cpp", "_bin")):
           pass # For matching target. We will just trace all frames in user code if it starts with /tmp
           
        if filename and filename.startswith("/tmp/"):
            
            # Variables
            variables = {}
            vars_list = frame.GetVariables(True, True, True, True)
            for var in vars_list:
                name = var.GetName()
                val = var.GetValue()
                if val is None:
                    summary = var.GetSummary()
                    val = summary if summary else "{ complex }"
                variables[name] = val
                
            # Call stack
            call_stack = []
            for i in range(thread.GetNumFrames()):
                f = thread.GetFrameAtIndex(i)
                func_name = f.GetFunctionName()
                if func_name:
                    call_stack.append(func_name)

            # Console Output (stdout buffer reading)
            console_output = []
            stdout_stream = ""
            while True:
                out = process.GetSTDOUT(1024)
                if not out: break
                stdout_stream += out
            
            if stdout_stream:
                console_output.append({"type": "log", "message": stdout_stream})

            step_data = {
                "line": line,
                "variables": variables,
                "callStack": call_stack,
                "consoleOutput": console_output
            }
            timeline.append(step_data)
        
        # Step into next instruction
        thread.StepInto()
        
        # Check if process exited
        if process.GetState() == lldb.eStateExited:
            break

    # Read remaining stdout
    stdout_stream = ""
    while True:
        out = process.GetSTDOUT(1024)
        if not out: break
        stdout_stream += out
    
    if stdout_stream and len(timeline) > 0:
        timeline[-1]["consoleOutput"].append({"type": "log", "message": stdout_stream})
    elif stdout_stream:
         timeline.append({"line": 0, "variables": {}, "callStack": [], "consoleOutput": [{"type": "log", "message": stdout_stream}]})

    print(json.dumps(timeline))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    trace_execution(sys.argv[1])
