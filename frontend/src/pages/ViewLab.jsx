import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Grid,
  Paper,
  Rating,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  MdAccessTime,
  MdBarChart,
  MdChevronRight,
  MdContentCopy,
  MdFolderOpen,
  MdCode,
  MdMonitor,
  MdOpenInNew,
  MdOutlineTerminal,
  MdStars,
} from 'react-icons/md';
import { motion } from 'motion/react';
import Header from '../components/Header';
import { fetchLabDetails, fetchLabSessionStatus, fetchUserActiveSession, startLabSession, stopLabSession } from '../services/labService';
import { useAuthStore } from '../store/authStore';
import SessionTimeoutModal from '../components/SessionTimeoutModal.jsx';

const ViewLab = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore(state => state.user);
  const [activeStep, setActiveStep] = useState(1);
  const [labDetails, setLabDetails] = useState(null);
  const [session, setSession] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(120 * 60);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadLab = async () => {
      try {
        const response = await fetchLabDetails(id);
        if (mounted) {
          setLabDetails(response.lab);
        }

        // Check if user already has an active session for this lab
        if (user?.id) {
          const sessionResponse = await fetchUserActiveSession(user.id, id);
          if (mounted && sessionResponse.success && sessionResponse.session) {
            setSession(sessionResponse.session);
          }
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Unable to load lab details');
        }
      }
    };

    loadLab();

    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  // Polling for session status
  useEffect(() => {
    if (!session || session.status !== 'starting') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetchLabSessionStatus(session.sessionId);
        if (response.status === 'running' || response.status === 'failed') {
          setSession(response);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [session]);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== 'running') return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartLab = async () => {
    try {
      setIsStarting(true);
      setError('');
      const startResponse = await startLabSession({
        labId: id,
      });

      const statusResponse = await fetchLabSessionStatus(startResponse.sessionId);
      setSession(statusResponse);

      // If it starts successfully, go directly to RDP
      if (statusResponse.status === 'running' || statusResponse.status === 'starting') {
        navigate(`/admin/compute/rdp?labId=${id}&app=vscode`);
      }
    } catch (startError) {
      setError(startError.message || 'Unable to start lab');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndLab = async () => {
    if (!session?.sessionId) return;

    await stopLabSession(session.sessionId);
    setSession(null);
    setSecondsLeft(120 * 60);
  };

  const handleRestartLab = async () => {
    if (!session?.sessionId) return;
    try {
      setIsStarting(true);
      await stopLabSession(session.sessionId);
      const startResponse = await startLabSession({ labId: id });
      const statusResponse = await fetchLabSessionStatus(startResponse.sessionId);
      setSession(statusResponse);
    } catch (err) {
      setError(err.message || 'Unable to restart lab');
    } finally {
      setIsStarting(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const metricItems = useMemo(() => ([
    { icon: <MdBarChart size={22} />, label: (labDetails?.complexity || 'Expert').toUpperCase(), sub: 'Complexity' },
    { icon: <MdFolderOpen size={22} />, label: (labDetails?.category || 'General').toUpperCase(), sub: 'Category' },
  ]), [labDetails]);

  const isLabRunning = session?.status === 'running';
  const isLabStarting = session?.status === 'starting' || isStarting;
  const hasActiveSession = session?.status === 'running' || session?.status === 'starting';

  const openMainTool = () => {
    navigate(`/admin/compute/rdp?labId=${id}&sessionId=${session?.sessionId || ''}&app=vscode`);
  };

  return (
    <Box className="flex-1 flex flex-col min-h-0 bg-slate-50 app-shell">
      <Header onMenuClick={onMenuClick} title="View Lab" onBack={() => window.history.back()} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans">
        <Box className="max-w-[1700px] mx-auto">
          {error && (
            <Alert severity="warning" className="mb-6 rounded-2xl">
              {error}
            </Alert>
          )}

          <Breadcrumbs separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>} className="mb-6 md:mb-8">
            <Typography className="text-xs sm:text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">Dashboard</Typography>
            <Typography className="text-xs sm:text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">{labDetails?.category || 'Lab'}</Typography>
            <Typography className="text-sm font-bold text-red-600">View lab</Typography>
          </Breadcrumbs>

          <Paper elevation={0} className="p-4 sm:p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-slate-200 mb-8 md:mb-10 bg-white shadow-2xl shadow-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center" className="relative z-10">
              <Grid item xs={12} lg="auto">
                <Box className="w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 mx-auto lg:mx-0 flex items-center justify-center p-4 md:p-6 border border-slate-100 rounded-3xl bg-slate-50/50 backdrop-blur-sm shadow-inner">
                  <img src={labDetails?.logo || '/assets/logo.png'} alt="Lab Logo" className="max-w-full max-h-full object-contain filter drop-shadow-xl" />
                </Box>
              </Grid>

              <Grid item xs={12} lg>
                <div className="flex flex-col gap-1 text-center lg:text-left">
                  <Typography variant="body2" className="text-red-600 font-black text-xs tracking-[0.3em] uppercase mb-1">
                    {labDetails?.subtitle || 'Enterprise Infrastructure Hub'}
                  </Typography>
                  <Typography variant="h3" className="font-black text-slate-900 tracking-tighter text-2xl sm:text-3xl md:text-5xl lg:text-6xl mb-4 md:mb-6 break-words">
                    {labDetails?.title || 'Loading lab...'}
                  </Typography>
                </div>

                <Box className="flex items-center gap-3 mb-6 md:mb-8 bg-slate-50 w-fit max-w-full mx-auto lg:mx-0 px-4 py-2 rounded-full border border-slate-100">
                  <Rating value={labDetails?.rating || 0} size="small" readOnly />
                  <Typography variant="caption" className="text-slate-400 font-black tracking-widest">
                    ({(labDetails?.rating || 0).toFixed(1)}) {labDetails?.reviewCount ? `${labDetails.reviewCount} REVIEWS` : 'NO REVIEWS YET'}
                  </Typography>
                </Box>

                <div className="flex flex-wrap gap-6 md:gap-10">
                  {metricItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                        {item.icon}
                      </div>
                      <div>
                        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.sub}</Typography>
                        <Typography className="font-bold text-slate-700 text-sm">{item.label}</Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </Grid>

              <Grid item xs={12} lg="auto" sx={{ ml: { lg: 'auto' } }}>
                <div className="flex flex-col items-center lg:items-end gap-4 md:gap-6 bg-slate-50/50 p-5 sm:p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-100 backdrop-blur-sm w-full">
                  {isLabRunning ? (
                    <div className="text-center lg:text-right">
                      <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Remaining</Typography>
                      <Typography className="font-mono font-black text-red-600 text-3xl sm:text-4xl md:text-5xl tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        {formatTime(secondsLeft)}
                      </Typography>
                    </div>
                  ) : isLabStarting ? (
                    <Typography className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      PROVISIONING HUB...
                    </Typography>
                  ) : (
                    <Typography className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {(labDetails?.status || 'ready').toUpperCase()}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    onClick={hasActiveSession ? handleEndLab : handleStartLab}
                    disabled={isLabStarting}
                    className={`text-white rounded-2xl px-6 sm:px-10 md:px-12 py-4 md:py-5 font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-500 shadow-2xl active:scale-95 w-full lg:w-auto ${hasActiveSession
                      ? '!bg-slate-900 hover:!bg-black border border-white/10'
                      : '!bg-red-600 hover:!bg-red-700 border border-red-500/20 shadow-red-500/30'
                      }`}
                  >
                    {isLabStarting ? 'STARTING LAB...' : isLabRunning ? 'TERMINATE SESSION' : 'INITIALIZE HUB'}
                  </Button>
                </div>
              </Grid>
            </Grid>

            {session?.status === 'running' && (
              <Box className="mt-8 md:mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 relative">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <Typography className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Environment Access Tools</Typography>
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Button
                      variant="contained"
                      onClick={openMainTool}
                      startIcon={<MdCode size={22} />}
                      className="!bg-slate-900 !text-white hover:!bg-black font-black rounded-2xl py-6 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-sm tracking-widest uppercase"
                    >
                      Open Cloud IDE
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/compute/terminals?sessionId=${session.sessionId}`)}
                      startIcon={<MdOutlineTerminal size={22} />}
                      className="!bg-white !text-slate-900 hover:!bg-slate-50 border border-slate-200 font-black rounded-2xl py-6 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-sm tracking-widest uppercase"
                    >
                      Open Terminal
                    </Button>
                  </div>
                </div>
              </Box>
            )}
          </Paper>
        </Box>
      </main>
      <SessionTimeoutModal session={session} onRestart={handleRestartLab} />
    </Box>
  );
};

export default ViewLab;
