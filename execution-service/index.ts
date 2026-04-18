import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TIMEOUT_MS = 5000;

app.post('/api/execute', async (req, res) => {
  const { code, language = 'cpp', config } = req.body;

  if (!code || language !== 'cpp') {
    return res.status(400).json({ error: 'Only C++ is currently supported' });
  }

  const id = uuidv4();
  const sourcePath = `/tmp/${id}.cpp`;
  const executablePath = `/tmp/${id}_bin`;
  
  try {
    // 1. Write code to file
    await fs.writeFile(sourcePath, code, 'utf8');

    // 2. Compile code with Debug Symbols
    await executeCmd(`clang++ -g -O0 -o ${executablePath} ${sourcePath}`);

    // inputs handling would be added to stdin of the python runner. For now passing as empty string
    const inputValues = config?.inputValues?.join(' ') || '';

    // 3. Trace execution via Python LLDB script
    // Python script traces the executable and outputs JSON directly
    const traceOut = await executeCmd(`python3 tracer.py ${executablePath}`, TIMEOUT_MS);
    
    // Parse the JSON representation of the Timeline
    const timeline = JSON.parse(traceOut);
    
    res.json({ timeline });
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      res.json({
         errorType: 'timeout',
         timeline: [{
           line: 0,
           variables: {},
           callStack: [],
           consoleOutput: [{ type: 'error', message: 'Execution timed out.' }],
           isError: true,
           errorMessage: 'Timeout'
         }]
      });
    } else {
       res.json({
         errorType: 'runtime',
         timeline: [{
           line: 0,
           variables: {},
           callStack: [],
           consoleOutput: [{ type: 'error', message: err.toString() }],
           isError: true,
           errorMessage: err.toString()
         }]
       });
    }
  } finally {
    // Cleanup generated files
    fs.unlink(sourcePath).catch(() => {});
    fs.unlink(executablePath).catch(() => {});
    fs.unlink(`${executablePath}.dSYM`).catch(() => {}); // cleanup mac dsym if any
  }
});

function executeCmd(command: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeout: NodeJS.Timeout;
    
    const child = exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      clearTimeout(timeout);
      if (error) {
         if (error.killed) {
             return reject(new Error('TIMEOUT'));
         }
         return reject(error.message || stderr);
      }
      resolve(stdout);
    });

    timeout = setTimeout(() => {
      child.kill();
      reject(new Error('TIMEOUT'));
    }, timeoutMs);
  });
}

app.listen(PORT, () => {
  console.log(`Execution Service running on port ${PORT}`);
});
