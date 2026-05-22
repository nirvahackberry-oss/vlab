import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { MdTerminal, MdClose, MdAdd, MdPowerSettingsNew, MdArrowBack } from 'react-icons/md';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import { Button } from '@mui/material';
import 'xterm/css/xterm.css';

const Terminal = ({ session, hideHeader, onStopLab, onBack }) => {
  const [tabs, setTabs] = useState([
    { id: 'default', name: 'bash', active: true }
  ]);
  const [activeTabId, setActiveTabId] = useState('default');
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io
    const socket = io('http://localhost:8080');
    socketRef.current = socket;

    // Initialize XTerm
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

    // Communication
    term.onData((data) => {
      socket.emit('terminal-input', data);
    });

    socket.on('terminal-output', (data) => {
      term.write(data);
    });

    socket.on('connect', () => {
      term.write('\r\n\x1b[32m[Connected to Ignito Cloud Shell]\x1b[0m\r\n');
      // Trigger initial resize
      const dims = { cols: term.cols, rows: term.rows };
      socket.emit('terminal-resize', dims);
    });

    socket.on('disconnect', () => {
      term.write('\r\n\x1b[31m[Disconnected from Server]\x1b[0m\r\n');
    });

    // Resize handling
    const handleResize = () => {
      if (fitAddonRef.current) {
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
  }, []);

  const addNewTab = () => {
    // For now, multiple tabs share the same socket for simplicity 
    // or you'd need to manage multiple pty sessions on backend
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
    <Box className="h-full w-full bg-[#0c0c0c] flex flex-col overflow-hidden">
      {/* Terminal Header */}
      {!hideHeader && (
        <Box className="h-9 bg-[#1e1e1e] flex items-center px-2 border-b border-black/40 shrink-0 overflow-x-auto no-scrollbar">
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
      <Box
        className="flex-1 p-2 bg-[#0c0c0c] overflow-hidden relative"
        sx={{
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
export default Terminal;
