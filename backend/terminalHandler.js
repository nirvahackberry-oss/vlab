import pty from 'node-pty';
import os from 'os';
import fs from 'fs';
import { getSession } from './services/sessionRepository.js';

const LOCAL_SHELL = os.platform() === 'win32' ? 'cmd.exe' : 'bash';

export const setupTerminal = (io) => {
  io.on('connection', async (socket) => {
    console.log('Terminal Connected:', socket.id);

    // =====================================
    // GET SESSION
    // =====================================
    const sessionId = socket.handshake.query.sessionId;
    let session = null;
    
    try {
      session = await getSession(sessionId);
    } catch (err) {
      console.error('[Session Error]', err.message);
    }

    const cluster = process.env.ECS_CLUSTER || session?.cluster;
    
    console.log('[Terminal Debug]', {
      sessionId,
      sessionExists: !!session,
      taskArn: session?.taskArn,
      cluster: cluster,
    });

    let ptyProcess = null;
    let isContainer = false;

    // =====================================
    // TRY ECS TERMINAL
    // =====================================
    if (session && session.taskArn && cluster) {
      try {
        const taskId = session.taskArn.split('/').pop();
        const containerName = 'lab-runtime';
        const interactiveShell = '/bin/sh';

        console.log('Connecting terminal to ECS container via /bin/sh...');

        // =====================================
        // AWS CLI PATH & DYNAMIC FALLBACK
        // =====================================
        let awsExePath = 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe';
        const localPipAwsPath = 'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\aws';
        const localPythonExe = 'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';
        
        let isLocalWinSetup = false;
        let awsExists = fs.existsSync(awsExePath);

        if (!awsExists && os.platform() === 'win32' && fs.existsSync(localPipAwsPath) && fs.existsSync(localPythonExe)) {
          // absolute python path is mandatory for node-pty to prevent "File not found" errors
          awsExePath = localPythonExe;
          isLocalWinSetup = true;
          awsExists = true;
        }

        console.log('AWS CLI Exists:', awsExists);
        
        if (!awsExists) {
          throw new Error('AWS CLI not installed');
        }

        // =====================================
        // SESSION MANAGER PLUGIN VERIFICATION
        // =====================================
        const standardSsmPath = 'C:\\Program Files\\Amazon\\SessionManagerPlugin\\bin\\session-manager-plugin.exe';
        const localPipSsmPath = 'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\session-manager-plugin.exe';
        const ssmExists = fs.existsSync(standardSsmPath) || fs.existsSync(localPipSsmPath);

        console.log('Session Manager Plugin Exists:', ssmExists);
        
        if (!ssmExists) {
          throw new Error('AWS Session Manager Plugin not installed');
        }

        const region = process.env.AWS_REGION || 'ap-south-1';

        const ptyArgs = [
          'ecs', 'execute-command',
          '--cluster', cluster,
          '--task', taskId,
          '--container', containerName,
          '--interactive',
          '--command', interactiveShell,
          '--region', region,
        ];

        if (isLocalWinSetup) {
          ptyArgs.unshift(localPipAwsPath);
        }

        const ptyEnv = { ...process.env };
        const pathDelimiter = os.platform() === 'win32' ? ';' : ':';
        const pathKey = Object.keys(ptyEnv).find(k => k.toUpperCase() === 'PATH') || 'PATH';

        // Ensure both Session Manager Plugin directories (standard and local pip scripts) are explicitly in PATH
        const additions = [
          'C:\\Program Files\\Amazon\\SessionManagerPlugin\\bin',
          'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts'
        ];
        const pathString = additions.join(pathDelimiter);
        ptyEnv[pathKey] = `${pathString}${pathDelimiter}${ptyEnv[pathKey] || ''}`;

        console.log('[AWS Execute-Command Config]', {
          taskId,
          cluster,
          containerName,
          awsExePath,
          ptyArgs,
        });

        // Calculate if we need to wait based on how long ago the container was launched
        let waitTime = 15000;
        if (session.Timestamp) {
           const timeSinceLaunch = Date.now() - session.Timestamp;
           waitTime = Math.max(0, 20000 - timeSinceLaunch); // Give it up to 20s from launch
        } else if (session.createdAt) {
           const timeSinceLaunch = Date.now() - new Date(session.createdAt).getTime();
           waitTime = Math.max(0, 20000 - timeSinceLaunch);
        }

        if (waitTime > 0) {
          socket.emit('terminal-output', `\r\n\x1b[36m[Connecting to AWS ECS Container. Please wait ${Math.ceil(waitTime / 1000)} seconds...]\x1b[0m\r\n`);
          console.log(`Waiting ${Math.ceil(waitTime / 1000)} seconds for ExecuteCommandAgent...`);
          // Prevent race conditions before launching ExecuteCommand on new tasks
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        ptyProcess = pty.spawn(awsExePath, ptyArgs, {
          name: 'xterm-color',
          cols: 120,
          rows: 30,
          cwd: process.cwd(),
          env: {
            ...ptyEnv,
            TERM: 'xterm-256color',
            AWS_PAGER: '',
          },
        });

        isContainer = true;
        console.log('[SUCCESS] ECS terminal connected');
        
      } catch (err) {
        console.error('[ECS TERMINAL FAILED]', err.message);
        socket.emit('terminal-output', `\r\n\x1b[31m[ECS TERMINAL FAILED: ${err.message}]\x1b[0m\r\n`);
      }
    }

    // =====================================
    // LOCAL FALLBACK
    // =====================================
    if (!ptyProcess) {
      console.log('[LOCAL FALLBACK TERMINAL]');
      try {
        ptyProcess = pty.spawn(LOCAL_SHELL, [], {
          name: 'xterm-color',
          cols: 120,
          rows: 30,
          cwd: process.env.HOME || process.env.USERPROFILE || process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-256color',
          },
        });
      } catch (err) {
        console.error('[LOCAL TERMINAL FAILED]', err.message);
        socket.emit('terminal-output', `\r\n\x1b[31m[Failed to launch local terminal: ${err.message}]\x1b[0m\r\n`);
        return; // Stop here if even the local fallback fails
      }
    }

    // =====================================
    // CONNECTION BANNER
    // =====================================
    if (isContainer) {
      socket.emit('terminal-output', '\r\n\x1b[32m[CONNECTED TO AWS ECS CONTAINER]\x1b[0m\r\n\r\n');
    } else {
      socket.emit('terminal-output', '\r\n\x1b[33m[LOCAL TERMINAL FALLBACK]\x1b[0m\r\n\r\n');
    }

    // =====================================
    // TERMINAL EVENT LISTENERS
    // =====================================
    if (ptyProcess) {
      ptyProcess.onData((data) => {
        if (isContainer) {
          // Suppress AWS Session Manager boilerplate text and trailing newlines
          data = data.replace(/The Session Manager plugin was installed successfully\.\s*Use the AWS CLI to start a session\.[\r\n]*/g, '');
          data = data.replace(/Starting session with SessionId:\s*[a-zA-Z0-9-]+[\r\n]*/g, '');
          
          // Avoid sending empty chunks if they were completely replaced
          if (!data || !data.trim() && !data.includes('\x1b') && !data.includes('\n')) {
            return;
          }
        }
        
        socket.emit('terminal-output', data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        console.log('PTY EXIT CODE:', exitCode);
        socket.emit('terminal-output', `\r\n[Terminal exited with code ${exitCode}]\r\n`);
        ptyProcess = null; // Prevent memory leak / double kill
      });
    }

    // =====================================
    // TERMINAL INPUT
    // =====================================
    socket.on('terminal-input', (data) => {
      if (ptyProcess) {
        try {
          ptyProcess.write(data);
        } catch (err) {
          console.error('[PTY WRITE ERROR]', err.message);
        }
      }
    });

    // =====================================
    // TERMINAL RESIZE
    // =====================================
    socket.on('terminal-resize', ({ cols, rows }) => {
      if (ptyProcess) {
        try {
          ptyProcess.resize(cols, rows);
        } catch (err) {
          console.warn('Resize failed:', err.message);
        }
      }
    });

    // =====================================
    // DISCONNECT
    // =====================================
    socket.on('disconnect', () => {
      console.log('Terminal disconnected:', socket.id);

      // DO NOT kill immediately
      // browser reconnects can trigger disconnect events
      setTimeout(() => {
        try {
          if (ptyProcess && !socket.connected) {
            console.log('[KILLING PTY AFTER DISCONNECT]');
            ptyProcess.kill();
            ptyProcess = null;
          }
        } catch (err) {
          console.warn('PTY kill failed:', err.message);
        }
      }, 5000);
    });
  });
};
