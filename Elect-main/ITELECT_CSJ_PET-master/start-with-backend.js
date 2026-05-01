const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const BACKEND_PORT = 5000;
// Path to the backend relative to the customer site directory
const BACKEND_DIR = path.resolve(__dirname, '../revise-elect-master/backend');

function checkBackendStatus() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(1000);
    client.on('connect', () => {
      client.destroy();
      resolve(true);
    });
    client.on('error', () => {
      client.destroy();
      resolve(false);
    });
    client.on('timeout', () => {
      client.destroy();
      resolve(false);
    });
    client.connect(BACKEND_PORT, '127.0.0.1');
  });
}

async function start() {
  const isRunning = await checkBackendStatus();
  
  if (!isRunning) {
    console.log(`\x1b[33m[INFO] Backend not detected on port ${BACKEND_PORT}. Starting Flask backend...\x1b[0m`);
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const backendProcess = spawn(pythonCmd, ['app.py'], {
      cwd: BACKEND_DIR,
      stdio: 'pipe', // Pipe to filter out excessive logs if desired, but we'll print them
      shell: true
    });
    
    backendProcess.stdout.on('data', (data) => console.log(`[BACKEND] ${data.toString().trim()}`));
    backendProcess.stderr.on('data', (data) => console.error(`[BACKEND] ${data.toString().trim()}`));
    
    // Give it a second to start
    await new Promise(res => setTimeout(res, 2000));
  } else {
    console.log(`\x1b[32m[INFO] Backend is already running on port ${BACKEND_PORT}.\x1b[0m`);
  }
  
  console.log(`\x1b[36m[INFO] Starting React Frontend...\x1b[0m`);
  const reactCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  spawn(reactCmd, ['react-scripts', 'start'], {
    stdio: 'inherit',
    shell: true
  });
}

start();
