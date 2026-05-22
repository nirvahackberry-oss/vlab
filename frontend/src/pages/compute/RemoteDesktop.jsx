// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Box,
//   Typography,
//   IconButton,
//   Tooltip,
//   Paper,
//   Avatar,
//   Divider,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions
// } from '@mui/material';
// import {
//   MdClose,
//   MdMinimize,
//   MdCropSquare,
//   MdTerminal,
//   MdLanguage,
//   MdSettings,
//   MdFolder,
//   MdPowerSettingsNew,
//   MdWifi,
//   MdVolumeUp,
//   MdSearch,
//   MdWarning
// } from 'react-icons/md';
// import { VscCode } from 'react-icons/vsc';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';
// import { fetchUserActiveSession, startLabSession, fetchLabSessionStatus, stopLabSession } from '../../services/labService';
// import CloudEditor from './Editor';
// import Terminal from './Terminal';

// const appsConfig = [
//   { id: 'vscode', title: 'Visual Studio Code', icon: 'vscode', component: CloudEditor },
//   { id: 'terminal', title: 'SSH Terminal', icon: 'terminal', component: Terminal },
//   { id: 'browser', title: 'Ignito Browser', icon: 'browser', component: () => <Box className="p-10 text-white">Browser simulation coming soon...</Box> },
//   { id: 'files', title: 'File Explorer', icon: 'files', component: () => <Box className="p-10 text-white">Files simulation coming soon...</Box> }
// ];

// const getAppIcon = (iconId, size = 24) => {
//   switch (iconId) {
//     case 'vscode': return <VscCode size={size} className="text-blue-400" />;
//     case 'terminal': return <MdTerminal size={size} className="text-emerald-400" />;
//     case 'browser': return <MdLanguage size={size} className="text-red-400" />;
//     case 'files': return <MdFolder size={size} className="text-yellow-400" />;
//     default: return <MdSettings size={size} />;
//   }
// };

// const RemoteDesktop = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [connecting, setConnecting] = useState(true);
//   const [connectionLog, setConnectionLog] = useState([]);
//   const [openWindows, setOpenWindows] = useState([]);
//   const [activeWindow, setActiveWindow] = useState(null);
//   const [maximizedWindows, setMaximizedWindows] = useState([]);
//   const [minimizedWindows, setMinimizedWindows] = useState([]);
//   const [showStartMenu, setShowStartMenu] = useState(false);
//   const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
//   const hasAutoOpenedRef = useRef(false);

//   const user = useAuthStore(state => state.user);
//   const [session, setSession] = useState(null);
//   const [error, setError] = useState('');

//   const initStartedRef = useRef(false);
//   const [showStopModal, setShowStopModal] = useState(false);
//   const [isStopping, setIsStopping] = useState(false);

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const labId = params.get('labId');

//     const initializeSession = async () => {
//       if (!labId || !user?.email || initStartedRef.current) return;
//       initStartedRef.current = true;

//       try {
//         setConnectionLog(prev => [`[${new Date().toLocaleTimeString()}] Connecting to Ignito Cloud Core...`]);

//         // 1. Check for existing session
//         const activeRes = await fetchUserActiveSession(user.email);
//         let activeSession = null;

//         if (activeRes.success && activeRes.session && activeRes.session.labId === labId) {
//           activeSession = activeRes.session;
//           setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Found existing session: ${activeSession.sessionId}`]);
//         } else {
//           // 2. Start new session
//           const startRes = await startLabSession({ labId, userId: user.email });
//           activeSession = startRes;
//           setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Provisioning new environment...`]);
//         }

//         // Wait if starting
//         let currentStatus = activeSession.status || 'starting';
//         let statusRes = activeSession;

//         while (currentStatus === 'starting') {
//           statusRes = await fetchLabSessionStatus(activeSession.sessionId);
//           currentStatus = statusRes.status;
//           if (currentStatus === 'starting') {
//             setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Provisioning environment...`]);
//             await new Promise(r => setTimeout(r, 1000));
//           }
//         }

//         if (currentStatus === 'running') {
//           setSession(statusRes);
//           setConnecting(false);
//         } else {
//           throw new Error(statusRes.message || 'Failed to start lab environment');
//         }

//       } catch (err) {
//         setError(err.message || 'Failed to initialize session');
//         setConnectionLog(prev => [...prev, `[ERROR] ${err.message}`]);
//         initStartedRef.current = false; // Allow retry on error
//       }
//     };

//     if (user?.email) {
//       initializeSession();
//     }
//   }, [location.search, user?.email]);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
//     }, 60000);
//     return () => clearInterval(timer);
//   }, []);

//   const toggleWindow = (appId) => {
//     const app = appsConfig.find(a => a.id === appId);
//     if (!app) return;

//     if (openWindows.find(w => w.id === appId)) {
//       if (minimizedWindows.includes(appId)) {
//         setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
//       }
//       setActiveWindow(appId);
//     } else {
//       setOpenWindows([...openWindows, app]);
//       setActiveWindow(appId);
//       if (appId === 'vscode' || appId === 'terminal') {
//         setMaximizedWindows(prev => [...prev, appId]);
//       }
//     }
//     setShowStartMenu(false);
//   };

//   const handleStopLab = async () => {
//     setIsStopping(true);
//     try {
//       if (session?.sessionId) {
//         await stopLabSession(session.sessionId);
//         localStorage.removeItem(`lastGrade_${session.sessionId}`);
//       }
//       navigate('/');
//     } catch (err) {
//       console.error('Failed to stop lab:', err);
//       navigate('/');
//     } finally {
//       setIsStopping(false);
//       setShowStopModal(false);
//     }
//   };

//   const closeWindow = (id) => {
//     setOpenWindows(openWindows.filter(w => w.id !== id));
//     setMaximizedWindows(maximizedWindows.filter(winId => winId !== id));
//     setMinimizedWindows(minimizedWindows.filter(winId => winId !== id));
//     if (activeWindow === id) setActiveWindow(null);
//   };

//   const minimizeWindow = (id) => {
//     setMinimizedWindows(prev => [...prev, id]);
//     if (activeWindow === id) setActiveWindow(null);
//   };

//   const toggleMaximize = (id) => {
//     if (maximizedWindows.includes(id)) {
//       setMaximizedWindows(maximizedWindows.filter(winId => winId !== id));
//     } else {
//       setMaximizedWindows([...maximizedWindows, id]);
//     }
//   };

//   useEffect(() => {
//     if (connecting || hasAutoOpenedRef.current) return;

//     const params = new URLSearchParams(location.search);
//     const appToOpen = params.get('app');
//     const labId = params.get('labId')?.toLowerCase() || '';

//     // If explicit app is requested, open it
//     if (appToOpen) {
//       toggleWindow(appToOpen);
//       hasAutoOpenedRef.current = true;
//     }
//     // Fallback based on labId if no app requested
//     else if (labId) {
//       const isTerminalLab = labId.includes('linux') || labId.includes('dbms') || labId.includes('sql');
//       toggleWindow(isTerminalLab ? 'terminal' : 'vscode');
//       hasAutoOpenedRef.current = true;
//     }
//   }, [connecting, location.search]);

//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [loadingStatus, setLoadingStatus] = useState('Initializing connection...');

//   useEffect(() => {
//     if (!connecting) return;

//     const interval = setInterval(() => {
//       setLoadingProgress(prev => {
//         if (prev >= 95) return 95;
//         // Progress slows down as it gets closer to 95
//         const increment = Math.max(0.1, (95 - prev) / 20);
//         return prev + increment;
//       });
//     }, 100);

//     return () => clearInterval(interval);
//   }, [connecting]);

//   useEffect(() => {
//     if (!connecting) return;
//     const statuses = [
//       'Allocating cloud resources...',
//       'Requesting Fargate task...',
//       'Pulling container image...',
//       'Configuring network bridge...',
//       'Initializing secure tunnel...',
//       'Starting container services...',
//       'Optimizing display stream...',
//       'Preparing your workspace...'
//     ];
//     let i = 0;
//     const interval = setInterval(() => {
//       setLoadingStatus(statuses[i % statuses.length]);
//       i++;
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [connecting]);

//   if (connecting) {
//     return (
//       <Box className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6">
//         <Box className="max-w-md w-full relative">
//           {/* Animated Background Glow */}
//           <div className="absolute -inset-20 bg-red-600/10 blur-[100px] rounded-full animate-pulse" />

//           <div className="relative flex flex-col items-center gap-8 text-center">
//             {/* Logo / Icon */}
//             <Box className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-2xl animate-bounce">
//               <img src="/assets/logo.png" alt="Ignito Vlab" className="w-16 h-16 object-contain" />
//             </Box>

//             <div className="space-y-2">
//               <Typography className="text-white font-black text-3xl tracking-tighter uppercase">Ignito Vlab</Typography>
//               <Typography className="text-slate-500 text-xs uppercase tracking-[0.3em] font-bold">Secure WebRTC Tunnel</Typography>
//             </div>

//             {/* Progress Area */}
//             <Box className="w-full space-y-6">
//               {!error ? (
//                 <>
//                   <Box className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
//                     <Box
//                       className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
//                       style={{ width: `${loadingProgress}%` }}
//                     />
//                   </Box>

//                   <div className="flex justify-between items-center px-1">
//                     <Typography className="text-slate-400 text-[11px] font-black uppercase tracking-widest animate-pulse">
//                       {loadingStatus}
//                     </Typography>
//                     <Typography className="text-red-500 font-mono text-sm font-bold">
//                       {Math.round(loadingProgress)}%
//                     </Typography>
//                   </div>
//                 </>
//               ) : (
//                 <Box className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
//                   <Typography className="text-red-500 text-sm font-bold mb-4">{error}</Typography>
//                   <Button
//                     onClick={() => navigate('/')}
//                     variant="outlined"
//                     className="!border-red-500 !text-red-500 !font-black !text-[10px] uppercase tracking-widest !rounded-xl !px-6"
//                   >
//                     Go Back to Dashboard
//                   </Button>
//                 </Box>
//               )}
//             </Box>
//           </div>
//         </Box>
//       </Box>
//     );
//   }

//   return (
//     <Box
//       className="h-screen w-screen overflow-hidden relative select-none"
//       sx={{
//         background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
//       }}
//     >

//       {/* Desktop Icons */}
//       <Box className="p-6 flex flex-col gap-6">
//         {appsConfig.map(app => (
//           <div
//             key={app.id}
//             onDoubleClick={() => toggleWindow(app.id)}
//             className="w-20 flex flex-col items-center gap-1 cursor-pointer group"
//           >
//             <Box className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all shadow-2xl">
//               {getAppIcon(app.icon)}
//             </Box>
//             <Typography className="text-white text-[11px] font-bold text-center drop-shadow-lg">{app.title}</Typography>
//           </div>
//         ))}
//       </Box>

//       {/* Windows Overlay */}
//       <div className="absolute inset-0 pointer-events-none">
//         {openWindows.map((win, index) => {
//           const isMaximized = maximizedWindows.includes(win.id);
//           const isMinimized = minimizedWindows.includes(win.id);
//           if (isMinimized) return null;

//           return (
//             <div
//               key={win.id}
//               onMouseDown={() => setActiveWindow(win.id)}
//               className={`absolute bg-[#1e1e1e] shadow-2xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ${(isMaximized || window.innerWidth < 768) ? 'inset-0 bottom-0' : 'inset-10 rounded-2xl'}`}
//               style={{ zIndex: activeWindow === win.id ? 100 : 10 + index }}
//             >
//               <Box className="flex-1 overflow-hidden">
//                 <win.component
//                   onMenuClick={() => { }}
//                   session={session}
//                   onStopLab={() => setShowStopModal(true)}
//                   onBack={() => navigate('/')}
//                   hideHeader={win.id === 'terminal' ? !((new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('linux') || (new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('dbms') || (new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('sql')) : true}
//                   onOpenTerminal={() => {
//                     // Minimize VS Code and Open Terminal Fullscreen
//                     minimizeWindow('vscode');
//                     toggleWindow('terminal');
//                     if (!maximizedWindows.includes('terminal')) {
//                       setMaximizedWindows(prev => [...prev, 'terminal']);
//                     }
//                   }}
//                 />
//               </Box>
//             </div>
//           );
//         })}
//       </div>
//       {/* Start Menu Simulation */}
//       {showStartMenu && (
//         <Box className="absolute bottom-16 left-2 w-[400px] h-[500px] bg-black/80 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 z-[500]">
//           <Typography className="text-white/40 text-[10px] font-black uppercase mb-4">Pinned</Typography>
//           <Box className="grid grid-cols-4 gap-4">
//             {appsConfig.map(app => (
//               <div key={app.id} onClick={() => toggleWindow(app.id)} className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-xl">
//                 {getAppIcon(app.icon)}
//                 <Typography className="text-white/80 text-[10px]">{app.title.split(' ')[0]}</Typography>
//               </div>
//             ))}
//           </Box>
//         </Box>
//       )}
//       {/* Stop Lab Confirmation Modal */}
//       <Dialog
//         open={showStopModal}
//         onClose={() => !isStopping && setShowStopModal(false)}
//         PaperProps={{
//           className: "bg-[#1e1e1e] border border-white/10 rounded-2xl p-2",
//           style: { backgroundColor: '#1e1e1e', borderRadius: '20px' }
//         }}
//       >
//         <Box className="p-4 flex flex-col items-center gap-4 text-center">
//           <Box className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-2">
//             <MdWarning size={32} />
//           </Box>
//           <div className="space-y-1">
//             <Typography className="text-white text-xl font-black uppercase tracking-tighter">Stop Lab Session?</Typography>
//             <Typography className="text-slate-400 text-sm">Are you sure you want to stop this lab? All unsaved work will be permanently lost.</Typography>
//           </div>
//           <Box className="flex gap-3 w-full mt-4">
//             <Button
//               onClick={() => setShowStopModal(false)}
//               disabled={isStopping}
//               className="flex-1 !py-3 !rounded-xl !text-slate-400 !bg-white/5 hover:!bg-white/10 !font-black !text-[11px] uppercase tracking-widest"
//             >
//               No, Keep Working
//             </Button>
//             <Button
//               onClick={handleStopLab}
//               disabled={isStopping}
//               variant="contained"
//               className="flex-1 !py-3 !rounded-xl !bg-red-600 hover:!bg-red-700 !text-white !font-black !text-[11px] uppercase tracking-widest shadow-xl shadow-red-600/20"
//             >
//               {isStopping ? 'Stopping...' : 'Yes, Stop Lab'}
//             </Button>
//           </Box>
//         </Box>
//       </Dialog>
//     </Box>
//   );
// };

// export default RemoteDesktop;


import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  MdClose,
  MdMinimize,
  MdCropSquare,
  MdTerminal,
  MdLanguage,
  MdSettings,
  MdFolder,
  MdPowerSettingsNew,
  MdWifi,
  MdVolumeUp,
  MdSearch,
  MdWarning
} from 'react-icons/md';
import { VscCode } from 'react-icons/vsc';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { fetchUserActiveSession, startLabSession, fetchLabSessionStatus, stopLabSession } from '../../services/labService';
import CloudEditor from './Editor';
import Terminal from './Terminal';


// NEW: Component to embed any tool URL in an iframe
const IframeTool = ({ url, onStopLab, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Box className="w-full h-full flex flex-col bg-[#1e1e1e]">
      <Box className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center border-b border-white/10 shrink-0">
        <Box className="min-w-0">
          <Typography className="text-white text-sm font-bold">Lab Environment</Typography>
          <Typography className="text-slate-500 text-[10px] font-mono truncate max-w-[70vw]">
            {url}
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            size="small"
            onClick={onBack}
            className="!text-slate-400 !text-[10px] !font-black uppercase"
          >
            Dashboard
          </Button>
          <Button
            size="small"
            onClick={onStopLab}
            className="!text-red-400 !text-[10px] !font-black uppercase"
          >
            Stop Lab
          </Button>
        </Box>
      </Box>
      <Box className="relative flex-1 min-h-0 bg-black">
        {isLoading && (
          <Box className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1e1e1e] text-center px-6">
            <Typography className="text-white text-sm font-black uppercase tracking-widest">
              Loading lab IDE...
            </Typography>
            <Typography className="text-slate-500 text-xs font-mono break-all max-w-2xl">
              {url}
            </Typography>
          </Box>
        )}
        <iframe
          src={url}
          title="Lab Tool"
          className="absolute inset-0 h-full w-full border-none bg-white"
          allow="clipboard-read; clipboard-write; fullscreen; autoplay"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </Box>
    </Box>
  );
};

const appsConfig = [
  { id: 'vscode', title: 'Visual Studio Code', icon: 'vscode', component: CloudEditor },
  { id: 'terminal', title: 'SSH Terminal', icon: 'terminal', component: Terminal },
  { id: 'browser', title: 'Ignito Browser', icon: 'browser', component: () => <Box className="p-10 text-white">Browser simulation coming soon...</Box> },
  { id: 'files', title: 'File Explorer', icon: 'files', component: () => <Box className="p-10 text-white">Files simulation coming soon...</Box> }
];

const getAppIcon = (iconId, size = 24) => {
  switch (iconId) {
    case 'vscode': return <VscCode size={size} className="text-blue-400" />;
    case 'terminal': return <MdTerminal size={size} className="text-emerald-400" />;
    case 'browser': return <MdLanguage size={size} className="text-red-400" />;
    case 'files': return <MdFolder size={size} className="text-yellow-400" />;
    default: return <MdSettings size={size} />;
  }
};

const RemoteDesktop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [connecting, setConnecting] = useState(true);
  const [connectionLog, setConnectionLog] = useState([]);
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [maximizedWindows, setMaximizedWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const hasAutoOpenedRef = useRef(false);

  const user = useAuthStore(state => state.user);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  const initStartedRef = useRef(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const labId = params.get('labId');

    const initializeSession = async () => {
      if (!labId || !user?.email || initStartedRef.current) return;
      initStartedRef.current = true;

      try {
        setConnectionLog(prev => [`[${new Date().toLocaleTimeString()}] Connecting to Ignito Cloud Core...`]);

        // 1. Check for existing session
        const activeRes = await fetchUserActiveSession(user.id);
        let activeSession = null;

        if (activeRes.success && activeRes.session && activeRes.session.labId === labId) {
          activeSession = activeRes.session;
          setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Found existing session: ${activeSession.sessionId}`]);
        } else {
          // 2. Start new session
          const startRes = await startLabSession({ labId, userId: user.id });
          activeSession = startRes;
          setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Provisioning new environment...`]);
        }

        // Wait if starting
        let currentStatus = activeSession.status || 'starting';
        let statusRes = activeSession;

        while (currentStatus === 'starting') {
          statusRes = await fetchLabSessionStatus(activeSession.sessionId);
          currentStatus = statusRes.status;
          if (currentStatus === 'starting') {
            setConnectionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Provisioning environment...`]);
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        if (currentStatus === 'running') {
          setSession(statusRes);
          setConnecting(false);
        } else {
          throw new Error(statusRes.message || 'Failed to start lab environment');
        }

      } catch (err) {
        setError(err.message || 'Failed to initialize session');
        setConnectionLog(prev => [...prev, `[ERROR] ${err.message}`]);
        initStartedRef.current = false; // Allow retry on error
      }
    };

    if (user?.email) {
      initializeSession();
    }
  }, [location.search, user?.email]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleWindow = (appId) => {
    const app = appsConfig.find(a => a.id === appId);
    if (!app) return;

    if (openWindows.find(w => w.id === appId)) {
      if (minimizedWindows.includes(appId)) {
        setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
      }
      setActiveWindow(appId);
    } else {
      setOpenWindows([...openWindows, app]);
      setActiveWindow(appId);
      if (appId === 'vscode' || appId === 'terminal') {
        setMaximizedWindows(prev => [...prev, appId]);
      }
    }
    setShowStartMenu(false);
  };

  // NEW: Open dynamic tool from session.tools.main.url
  const openDynamicTool = (url) => {
    const toolId = 'dynamic_tool';
    const existing = openWindows.find(w => w.id === toolId);
    if (existing) {
      // If already open, just focus and restore if minimized
      if (minimizedWindows.includes(toolId)) {
        setMinimizedWindows(minimizedWindows.filter(id => id !== toolId));
      }
      setActiveWindow(toolId);
      if (!maximizedWindows.includes(toolId)) {
        setMaximizedWindows([...maximizedWindows, toolId]);
      }
      return;
    }

    const dynamicApp = {
      id: toolId,
      title: 'Lab Tool',
      icon: 'browser',
      component: () => (
        <IframeTool
          url={url}
          onStopLab={() => setShowStopModal(true)}
          onBack={() => navigate('/')}
        />
      )
    };
    setOpenWindows(prev => [...prev, dynamicApp]);
    setActiveWindow(toolId);
    setMaximizedWindows(prev => [...prev, toolId]);
  };

  const handleStopLab = async () => {
    setIsStopping(true);
    try {
      if (session?.sessionId) {
        await stopLabSession(session.sessionId);
        localStorage.removeItem(`lastGrade_${session.sessionId}`);
      }
      navigate('/');
    } catch (err) {
      console.error('Failed to stop lab:', err);
      navigate('/');
    } finally {
      setIsStopping(false);
      setShowStopModal(false);
    }
  };

  const closeWindow = (id) => {
    setOpenWindows(openWindows.filter(w => w.id !== id));
    setMaximizedWindows(maximizedWindows.filter(winId => winId !== id));
    setMinimizedWindows(minimizedWindows.filter(winId => winId !== id));
    if (activeWindow === id) setActiveWindow(null);
  };
  const minimizeWindow = (id) => {
    setMinimizedWindows(prev => [...prev, id]);
    if (activeWindow === id) setActiveWindow(null);
  };

  const toggleMaximize = (id) => {
    if (maximizedWindows.includes(id)) {
      setMaximizedWindows(maximizedWindows.filter(winId => winId !== id));
    } else {
      setMaximizedWindows([...maximizedWindows, id]);
    }
  };

  // --- MODIFIED: Open the correct tool once session is ready ---
useEffect(() => {
  if (connecting || !session || hasAutoOpenedRef.current) return;

  const params = new URLSearchParams(location.search);
  const labId = (session.labId || params.get('labId') || '').toLowerCase();
  const toolType = session.tools?.main?.type;

  if (labId === 'python-lab' || toolType === 'ide') {
    toggleWindow('vscode');
    hasAutoOpenedRef.current = true;
    return;
  }

  if (labId === 'data-science-lab' || toolType === 'jupyter') {
    const url = session.tools?.main?.url;
    if (url) {
      openDynamicTool(url);
    } else {
      setError('Jupyter URL not found for this lab session.');
    }
    hasAutoOpenedRef.current = true;
    return;
  }

  // 1. Check if backend provided a main tool URL
  if (session.tools?.main?.url) {
    const url = session.tools.main.url;
    // If it's a relative URL (starts with '/'), it's the built‑in IDE → use toggleWindow
    if (url.startsWith('/')) {
      toggleWindow('vscode');
      hasAutoOpenedRef.current = true;
      return;
    }
    // Otherwise, it's an external tool (Jupyter, code‑server) → open in iframe
    openDynamicTool(url);
    hasAutoOpenedRef.current = true;
    return;
  }

  // 2. Fallback (no main.url)
  const appToOpen = params.get('app');
  if (appToOpen) {
    toggleWindow(appToOpen);
  } else if (labId) {
    const isTerminalLab = labId.includes('linux') || labId.includes('dbms') || labId.includes('sql');
    toggleWindow(isTerminalLab ? 'terminal' : 'vscode');
  }
  hasAutoOpenedRef.current = true;
}, [connecting, session, location.search]);   

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing connection...');

  useEffect(() => {
    if (!connecting) return;

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return 95;
        const increment = Math.max(0.1, (95 - prev) / 20);
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [connecting]);

  useEffect(() => {
    if (!connecting) return;
    const statuses = [
      'Allocating cloud resources...',
      'Requesting Fargate task...',
      'Pulling container image...',
      'Configuring network bridge...',
      'Initializing secure tunnel...',
      'Starting container services...',
      'Optimizing display stream...',
      'Preparing your workspace...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingStatus(statuses[i % statuses.length]);
      i++;
    }, 3000);
    return () => clearInterval(interval);
  }, [connecting]);

  if (connecting) {
    return (
      <Box className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <Box className="max-w-md w-full relative">
          <div className="absolute -inset-20 bg-red-600/10 blur-[100px] rounded-full animate-pulse" />
          <div className="relative flex flex-col items-center gap-8 text-center">
            <Box className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-2xl animate-bounce">
              <img src="/assets/logo.png" alt="Ignito Vlab" className="w-16 h-16 object-contain" />
            </Box>
            <div className="space-y-2">
              <Typography className="text-white font-black text-3xl tracking-tighter uppercase">Ignito Vlab</Typography>
              <Typography className="text-slate-500 text-xs uppercase tracking-[0.3em] font-bold">Secure WebRTC Tunnel</Typography>
            </div>
            <Box className="w-full space-y-6">
              {!error ? (
                <>
                  <Box className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <Box
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </Box>
                  <div className="flex justify-between items-center px-1">
                    <Typography className="text-slate-400 text-[11px] font-black uppercase tracking-widest animate-pulse">
                      {loadingStatus}
                    </Typography>
                    <Typography className="text-red-500 font-mono text-sm font-bold">
                      {Math.round(loadingProgress)}%
                    </Typography>
                  </div>
                </>
              ) : (
                <Box className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                  <Typography className="text-red-500 text-sm font-bold mb-4">{error}</Typography>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outlined"
                    className="!border-red-500 !text-red-500 !font-black !text-[10px] uppercase tracking-widest !rounded-xl !px-6"
                  >
                    Go Back to Dashboard
                  </Button>
                </Box>
              )}
            </Box>
          </div>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="h-screen w-screen overflow-hidden relative select-none"
      sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      {/* Desktop Icons */}
      <Box className="p-6 flex flex-col gap-6">
        {appsConfig.map(app => (
          <div
            key={app.id}
            onDoubleClick={() => toggleWindow(app.id)}
            className="w-20 flex flex-col items-center gap-1 cursor-pointer group"
          >
            <Box className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all shadow-2xl">
              {getAppIcon(app.icon)}
            </Box>
            <Typography className="text-white text-[11px] font-bold text-center drop-shadow-lg">{app.title}</Typography>
          </div>
        ))}
      </Box>

      {/* Windows Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {openWindows.map((win, index) => {
          const isMaximized = maximizedWindows.includes(win.id);
          const isMinimized = minimizedWindows.includes(win.id);
          if (isMinimized) return null;

          return (
            <div
              key={win.id}
              onMouseDown={() => setActiveWindow(win.id)}
              className={`absolute bg-[#1e1e1e] shadow-2xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ${(isMaximized || window.innerWidth < 768) ? 'inset-0 bottom-0' : 'inset-10 rounded-2xl'}`}
              style={{ zIndex: activeWindow === win.id ? 100 : 10 + index }}
            >
              {/* Window title bar (draggable area) */}
              <Box
                className="bg-[#2d2d2d] px-4 py-2 flex justify-between items-center cursor-move shrink-0"
                onDoubleClick={() => toggleMaximize(win.id)}
              >
                <Box className="flex items-center gap-2">
                  {getAppIcon(win.icon, 16)}
                  <Typography className="text-white text-xs font-bold">{win.title}</Typography>
                </Box>
                <Box className="flex gap-1">
                  <IconButton size="small" onClick={() => minimizeWindow(win.id)} className="!text-white/60 hover:!text-white">
                    <MdMinimize size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => toggleMaximize(win.id)} className="!text-white/60 hover:!text-white">
                    <MdCropSquare size={14} />
                  </IconButton>
                  <IconButton size="small" onClick={() => closeWindow(win.id)} className="!text-white/60 hover:!text-red-500">
                    <MdClose size={16} />
                  </IconButton>
                </Box>
              </Box>
              <Box className="flex-1 overflow-hidden">
                <win.component
                  onMenuClick={() => {}}
                  session={session}
                  onStopLab={() => setShowStopModal(true)}
                  onBack={() => navigate('/')}
                  hideHeader={win.id === 'terminal' ? !((new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('linux') || (new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('dbms') || (new URLSearchParams(location.search).get('labId')?.toLowerCase() || '').includes('sql')) : true}
                  onOpenTerminal={() => {
                    minimizeWindow('vscode');
                    toggleWindow('terminal');
                    if (!maximizedWindows.includes('terminal')) {
                      setMaximizedWindows(prev => [...prev, 'terminal']);
                    }
                  }}
                />
              </Box>
            </div>
          );
        })}
      </div>

      {/* Start Menu */}
      {showStartMenu && (
        <Box className="absolute bottom-16 left-2 w-[400px] h-[500px] bg-black/80 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 z-[500]">
          <Typography className="text-white/40 text-[10px] font-black uppercase mb-4">Pinned</Typography>
          <Box className="grid grid-cols-4 gap-4">
            {appsConfig.map(app => (
              <div key={app.id} onClick={() => toggleWindow(app.id)} className="flex flex-col items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-xl">
                {getAppIcon(app.icon)}
                <Typography className="text-white/80 text-[10px]">{app.title.split(' ')[0]}</Typography>
              </div>
            ))}
          </Box>
        </Box>
      )}

      {/* Taskbar */}
    

      {/* Stop Lab Modal */}
      <Dialog
        open={showStopModal}
        onClose={() => !isStopping && setShowStopModal(false)}
        PaperProps={{
          className: "bg-[#1e1e1e] border border-white/10 rounded-2xl p-2",
          style: { backgroundColor: '#1e1e1e', borderRadius: '20px' }
        }}
      >
        <Box className="p-4 flex flex-col items-center gap-4 text-center">
          <Box className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-2">
            <MdWarning size={32} />
          </Box>
          <div className="space-y-1">
            <Typography className="text-white text-xl font-black uppercase tracking-tighter">Stop Lab Session?</Typography>
            <Typography className="text-slate-400 text-sm">Are you sure you want to stop this lab? All unsaved work will be permanently lost.</Typography>
          </div>
          <Box className="flex gap-3 w-full mt-4">
            <Button
              onClick={() => setShowStopModal(false)}
              disabled={isStopping}
              className="flex-1 !py-3 !rounded-xl !text-slate-400 !bg-white/5 hover:!bg-white/10 !font-black !text-[11px] uppercase tracking-widest"
            >
              No, Keep Working
            </Button>
            <Button
              onClick={handleStopLab}
              disabled={isStopping}
              variant="contained"
              className="flex-1 !py-3 !rounded-xl !bg-red-600 hover:!bg-red-700 !text-white !font-black !text-[11px] uppercase tracking-widest shadow-xl shadow-red-600/20"
            >
              {isStopping ? 'Stopping...' : 'Yes, Stop Lab'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default RemoteDesktop;
