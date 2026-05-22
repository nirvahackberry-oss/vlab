import { spawn } from 'node-pty';
import os from 'os';

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

export const setupTerminal = (io) => {
  io.on('connection', (socket) => {
    console.log('Terminal: New connection', socket.id);

    // Default pty options
    const ptyProcess = spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env
    });

    // Send data from PTY to frontend
    ptyProcess.onData((data) => {
      socket.emit('terminal-output', data);
    });

    // Handle input from frontend
    socket.on('terminal-input', (data) => {
      if (ptyProcess) {
        ptyProcess.write(data);
      }
    });

    // Handle resize
    socket.on('terminal-resize', (size) => {
      if (ptyProcess) {
        ptyProcess.resize(size.cols, size.rows);
      }
    });

    socket.on('disconnect', () => {
      console.log('Terminal: Disconnected', socket.id);
      if (ptyProcess) {
        ptyProcess.kill();
      }
    });
  });
};
