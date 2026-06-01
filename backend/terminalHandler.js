import pty from 'node-pty';
import os from 'os';
import fs from 'fs';

import { getSession } from './services/sessionRepository.js';

const LOCAL_SHELL =
  os.platform() === 'win32'
    ? 'cmd.exe'
    : 'bash';

export const setupTerminal = (io) => {

  io.on('connection', async (socket) => {

    console.log(
      'Terminal Connected:',
      socket.id
    );

    // =====================================
    // GET SESSION
    // =====================================

    const sessionId =
      socket.handshake.query.sessionId;

    const session =
      await getSession(sessionId);

    console.log(
      '[Terminal Debug]',
      {
        sessionId,
        sessionExists: !!session,
        taskArn: session?.taskArn,
        cluster:
          process.env.ECS_CLUSTER ||
          session?.cluster,
      }
    );

    let ptyProcess = null;

    let isContainer = false;

    // =====================================
    // TRY ECS TERMINAL
    // =====================================

    if (
      session &&
      session.taskArn &&
      (
        process.env.ECS_CLUSTER ||
        session.cluster
      )
    ) {

      try {

        const cluster =
          process.env.ECS_CLUSTER ||
          session.cluster;

        const taskArn =
          session.taskArn;

        const containerName =
          'lab-runtime';

        // =====================================
        // LAB SHELL (sh is more universal)
        // =====================================

        const interactiveShell = '/bin/sh';

        console.log(
          'Connecting terminal to ECS container via /bin/sh...'
        );

        if (!interactiveShell) {
          throw new Error('Container interactive shell missing');
        }

        // =====================================
        // AWS CLI PATH & DYNAMIC FALLBACK
        // =====================================

        let awsExePath =
          'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe';

        const localPipAwsPath =
          'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\aws';

        const localPythonExe =
          'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe';

        let isLocalWinSetup = false;

        let awsExists = fs.existsSync(awsExePath);

        if (!awsExists && os.platform() === 'win32' && fs.existsSync(localPipAwsPath) && fs.existsSync(localPythonExe)) {
          // absolute python path is mandatory for node-pty to prevent "File not found" errors
          awsExePath = localPythonExe;
          isLocalWinSetup = true;
          awsExists = true;
        }

        console.log(
          'AWS CLI Exists:',
          awsExists
        );

        if (!awsExists) {
          throw new Error('AWS CLI not installed');
        }

        // =====================================
        // SESSION MANAGER PLUGIN VERIFICATION
        // =====================================

        const standardSsmPath =
          'C:\\Program Files\\Amazon\\SessionManagerPlugin\\bin\\session-manager-plugin.exe';

        const localPipSsmPath =
          'C:\\Users\\Hackberry Softech\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\session-manager-plugin.exe';

        const ssmExists =
          fs.existsSync(standardSsmPath) || fs.existsSync(localPipSsmPath);

        console.log(
          'Session Manager Plugin Exists:',
          ssmExists
        );

        if (!ssmExists) {
          throw new Error('AWS Session Manager Plugin not installed');
        }

        const region = process.env.AWS_REGION || 'ap-south-1';

        const ptyArgs = [
          'ecs',
          'execute-command',

          '--cluster',
          cluster,

          '--task',
          taskArn,

          '--container',
          containerName,

          '--interactive',

          '--command',
          interactiveShell,

          '--region',
          region,
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


        ptyProcess = pty.spawn(
          awsExePath,
          ptyArgs,
          {
            name: 'xterm-color',

            cols: 120,
            rows: 30,

            cwd: process.cwd(),

            env: {
              ...ptyEnv,
              TERM: 'xterm-256color',
            },
          }
        );

        isContainer = true;

        console.log(
          '[SUCCESS] ECS terminal connected'
        );

      } catch (err) {

        console.error(
          '[ECS TERMINAL FAILED]',
          err.message
        );
      }
    }

    // =====================================
    // LOCAL FALLBACK
    // =====================================

    if (!ptyProcess) {

      console.log(
        '[LOCAL FALLBACK TERMINAL]'
      );

      ptyProcess = pty.spawn(
        LOCAL_SHELL,
        [],
        {
          name: 'xterm-color',

          cols: 120,
          rows: 30,

          cwd:
            process.env.HOME ||
            process.env.USERPROFILE,

          env: {
            ...process.env,
            TERM: 'xterm-256color',
          },
        }
      );
    }

    // =====================================
    // CONNECTION BANNER
    // =====================================

    if (isContainer) {

      socket.emit(
        'terminal-output',
        '\r\n\x1b[32m[CONNECTED TO AWS ECS CONTAINER]\x1b[0m\r\n\r\n'
      );

    } else {

      socket.emit(
        'terminal-output',
        '\r\n\x1b[33m[LOCAL TERMINAL FALLBACK]\x1b[0m\r\n\r\n'
      );
    }

    // =====================================
    // TERMINAL OUTPUT
    // =====================================

    ptyProcess.onData((data) => {

      socket.emit(
        'terminal-output',
        data
      );

    });

    // =====================================
    // TERMINAL EXIT
    // =====================================

    ptyProcess.onExit(({ exitCode }) => {

      console.log(
        'PTY EXIT CODE:',
        exitCode
      );

      socket.emit(
        'terminal-output',
        `\r\n[Terminal exited with code ${exitCode}]\r\n`
      );

    });

    // =====================================
    // TERMINAL INPUT
    // =====================================

    socket.on(
      'terminal-input',
      (data) => {

        if (ptyProcess) {

          ptyProcess.write(data);

        }

      }
    );

    // =====================================
    // TERMINAL RESIZE
    // =====================================

    socket.on(
      'terminal-resize',
      ({ cols, rows }) => {

        try {

          ptyProcess.resize(
            cols,
            rows
          );

        } catch (err) {

          console.warn(
            'Resize failed:',
            err.message
          );
        }

      }
    );

    // =====================================
    // DISCONNECT
    // =====================================

    socket.on('disconnect', () => {

      console.log(
        'Terminal disconnected:',
        socket.id
      );

      try {

        if (ptyProcess) {

          ptyProcess.kill();
        }

      } catch (err) {

        console.warn(
          'PTY kill failed:',
          err.message
        );
      }

    });

  });

};
