import React, { useEffect, useState } from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { MdWarning } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const SessionTimeoutModal = ({ session, onRestart }) => {
  const navigate = useNavigate();
  const [isTimeOut, setIsTimeOut] = useState(false);

  useEffect(() => {
    if (!session?.expiresAt || session.status !== 'running') {
      setIsTimeOut(false);
      return;
    }

    const checkTimeout = () => {
      const expiresMs = new Date(session.expiresAt).getTime();
      if (Date.now() >= expiresMs) {
        setIsTimeOut(true);
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleGoToDashboard = () => {
    setIsTimeOut(false);
    window.location.href = '/';
  };

  const handleRestart = () => {
    setIsTimeOut(false);
    if (onRestart) {
      onRestart();
    } else {
      window.location.reload();
    }
  };

  return (
    <Dialog 
      open={isTimeOut} 
      disableEscapeKeyDown
      style={{ zIndex: 99999 }}
      PaperProps={{
        className: 'bg-[#1e1e1e] border border-white/10 rounded-2xl p-2',
        style: { backgroundColor: '#1e1e1e', borderRadius: '20px', minWidth: '350px' },
      }}
    >
      <Box className="p-6 flex flex-col items-center gap-4 text-center">
        <MdWarning size={48} className="text-amber-500 mb-2" />
        <Typography className="text-white text-xl font-black uppercase tracking-tighter">
          Session Time Out
        </Typography>
        <Typography className="text-slate-400 text-sm mb-4">
          Your lab session has expired. You will now be redirected to the dashboard.
        </Typography>
        <Box className="flex gap-3 w-full mt-2">
          <Button 
            onClick={handleGoToDashboard} 
            variant="contained"
            className="flex-1 !bg-amber-600 hover:!bg-amber-700 !text-white font-black tracking-widest uppercase"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SessionTimeoutModal;
