import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { MdTerminal, MdClose, MdAdd, MdPowerSettingsNew, MdArrowBack, MdRefresh } from 'react-icons/md';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';
import { APP_ENV } from '../../config/env';

const TerminalInstance = ({ session, isActive }) => {
  const [terminalState, setTerminalState] = useState('initializing');
  const [statusMessage, setStatusMessage] = useState('Starting Lab Environment...');

  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);

  const initConnection = () => {
    setTerminalState('initializing');
    setStatusMessage('Starting Lab Environment...');
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const socketUrl = APP_ENV.apiBaseUrl ? APP_ENV.apiBaseUrl.replace(/\/api$/, '') : `${window.location.protocol}//${window.location.hostname}:8082`;
    const socket = io(socketUrl, {
      query: {
        sessionId: session?.sessionId || '',
      },
    });
    socketRef.current = socket;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#f00',
        selectionBackground: 'rgba(239, 68, 68, 0.3)',
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => {
      socket.emit('terminal-input', data);
    });

    socket.on('terminal-output', (data) => {
      term.write(data);
    });

    socket.on('terminal-status', (payload) => {
      if (payload.status === 'timeout') {
        setTerminalState('timeout');
      } else if (payload.status === 'ready') {
        term.reset();
        setTerminalState('ready');
      } else {
        setTerminalState(payload.status);
      }
      if (payload.message) {
        setStatusMessage(payload.message);
      }
    });

    socket.on('connect', () => {
      const dims = { cols: term.cols, rows: term.rows };
      socket.emit('terminal-resize', dims);
    });

    socket.on('disconnect', () => {
      setTerminalState('error');
      setStatusMessage('Disconnected from Server');
    });

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        socket.emit('terminal-resize', {
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows
        });
      }
    };

    window.addEventListener('resize', handleResize);
 
    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  };

  useEffect(() => {
    const cleanup = initConnection();
    return () => {
      cleanup();
    };
  }, []);

  // When tab becomes active, trigger a refit just in case the window resized while hidden
  useEffect(() => {
    if (isActive && fitAddonRef.current && xtermRef.current && socketRef.current) {
      // small delay to ensure DOM is fully visible before measuring
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
          socketRef.current.emit('terminal-resize', {
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows
          });
        } catch(e) {}
      }, 50);
    }
  }, [isActive]);

  useEffect(() => {
    let timer;
    if (terminalState === 'initializing' || terminalState === 'polling') {
      timer = setTimeout(() => {
        if (terminalState !== 'ready') {
          setTerminalState('timeout');
          setStatusMessage('Lab is taking longer than expected.');
        }
      }, 65000);
    }
    return () => clearTimeout(timer);
  }, [terminalState]);

  return (
    <Box 
      className="absolute inset-0 flex-1 flex flex-col bg-[#0c0c0c] overflow-hidden"
      sx={{
        opacity: isActive ? 1 : 0,
        visibility: isActive ? 'visible' : 'hidden',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: isActive ? 10 : 0
      }}
    >
      {terminalState !== 'ready' && (
        <Box className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0c0c0c] text-white">
          <Box className="flex flex-col items-center gap-6 p-8 rounded-xl bg-[#1e1e1e] border border-black/40 shadow-2xl">
            {terminalState === 'timeout' || terminalState === 'error' ? (
              <Box className="text-red-500 bg-red-500/10 p-4 rounded-full">
                <MdPowerSettingsNew size={48} />
              </Box>
            ) : (
              <CircularProgress size={48} thickness={4} sx={{ color: '#ef4444' }} />
            )}
            <Box className="text-center">
              <Typography className="text-xl font-bold tracking-wide text-slate-200 mb-2">
                {terminalState === 'timeout' ? 'Connection Timeout' : 
                 terminalState === 'error' ? 'Connection Error' : 
                 'Connecting to Lab'}
              </Typography>
              <Typography className="text-sm text-slate-400 font-mono">
                {statusMessage}
              </Typography>
            </Box>
            {(terminalState === 'timeout' || terminalState === 'error') && (
              <Button
                onClick={initConnection}
                variant="contained"
                startIcon={<MdRefresh />}
                className="!bg-red-600 hover:!bg-red-700 !text-white !px-6 !py-2 shadow-lg shadow-red-500/20"
              >
                Retry Connection
              </Button>
            )}
          </Box>
        </Box>
      )}

      <Box
        className="h-full w-full p-0 absolute inset-0"
        sx={{
          opacity: terminalState === 'ready' ? 1 : 0,
          visibility: terminalState === 'ready' ? 'visible' : 'hidden',
          '& .xterm-viewport': {
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' }
          }
        }}
      >
        <div ref={terminalRef} className="h-full w-full" />
      </Box>
    </Box>
  );
};

const Terminal = ({ session, hideHeader, onStopLab, onBack }) => {
  const [tabs, setTabs] = useState([
    { id: 'default', name: 'bash' }
  ]);
  const [activeTabId, setActiveTabId] = useState('default');

  const addNewTab = () => {
    const newId = Date.now().toString();
    setTabs(prev => [...prev, { id: newId, name: `bash (${prev.length + 1})` }]);
    setActiveTabId(newId);
  };

  const closeTab = (e, id) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <Box className="h-full w-full bg-[#0c0c0c] flex flex-col overflow-hidden relative">
      {!hideHeader && (
        <Box className="h-9 bg-[#1e1e1e] flex items-center px-2 border-b border-black/40 shrink-0 overflow-x-auto no-scrollbar z-20 relative">
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 h-full cursor-pointer transition-all border-r border-black/20 min-w-[120px] max-w-[200px] ${activeTabId === tab.id
                ? 'bg-[#0c0c0c] border-t-2 border-t-red-500 text-slate-200'
                : 'hover:bg-[#2a2d2e] text-slate-500'
                }`}
            >
              <MdTerminal size={14} className={activeTabId === tab.id ? 'text-emerald-500' : 'text-slate-600'} />
              <Typography className="text-[11px] font-bold truncate flex-1">{tab.name}</Typography>
              {tabs.length > 1 && (
                <MdClose
                  size={14}
                  className="hover:bg-white/10 rounded p-0.5 text-slate-500 hover:text-white"
                  onClick={(e) => closeTab(e, tab.id)}
                />
              )}
            </Box>
          ))}

          <Box
            onClick={addNewTab}
            className="flex items-center gap-1 px-3 h-full cursor-pointer text-slate-500 hover:text-slate-300 hover:bg-[#2a2d2e] transition-all"
          >
            <MdAdd size={16} />
            <Typography className="text-[10px] font-bold whitespace-nowrap">New Terminal</Typography>
          </Box>
          
          <Box className="flex-1" />

          <Box className="flex items-center gap-3 mr-2">
            {onBack && (
              <Button
                onClick={onBack}
                variant="contained"
                size="small"
                startIcon={<MdArrowBack size={14} />}
                className="!text-[9px] !font-black h-7 px-4 !bg-red-600 !text-white shadow-lg shadow-red-600/20 uppercase tracking-widest transition-all shrink-0"
              >
                Back to Dashboard
              </Button>
            )}

            {onStopLab && (
              <Button
                onClick={onStopLab}
                variant="contained"
                size="small"
                startIcon={<MdPowerSettingsNew size={14} />}
                className="!text-[9px] !font-black h-7 px-4 !bg-red-600 !text-white shadow-lg shadow-red-600/20 uppercase tracking-widest transition-all shrink-0"
              >
                Stop Lab
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Terminal Content Area */}
      <Box className="flex-1 relative bg-[#0c0c0c] overflow-hidden">
        {tabs.map((tab) => (
          <TerminalInstance 
            key={tab.id}
            session={session}
            isActive={activeTabId === tab.id}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Terminal;
