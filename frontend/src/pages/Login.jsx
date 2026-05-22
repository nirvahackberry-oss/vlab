import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Fade,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Invalid email or password.');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginId.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      setError(true);
      setTimeout(() => setError(false), 5000);
      return;
    }

    const result = await login(loginId.trim(), password);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(result.message || 'Unable to sign in. Please try again.');
      setError(true);
      setTimeout(() => setError(false), 5000);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      bgcolor: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'rgba(226, 232, 240, 0.8)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(251, 113, 133, 0.4)',
      },
      '&.Mui-focused': {
        bgcolor: '#ffffff',
        '& fieldset': {
          borderColor: '#fb7185',
          borderWidth: '2px',
        },
        boxShadow: '0 10px 25px -5px rgba(251, 113, 133, 0.1), 0 8px 10px -6px rgba(251, 113, 133, 0.1)',
      },
    },
    '& .MuiInputBase-input': {
      fontSize: '15px',
      fontWeight: 500,
      padding: '16px 14px',
    }
  };

  return (
    <Box className="min-h-screen bg-[#f1f5f9] font-sans flex items-center justify-center relative overflow-hidden">
      {/* Premium Light Background UI */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-200/40 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-100/40 blur-[100px]" />

        {/* Subtle Technical Grid for Light Theme */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#64748b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Particles - Darker for visibility */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 0.2, 0]
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-1.5 h-1.5 bg-slate-400 rounded-full blur-[1px]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[1200px] px-4 z-10"
      >
        <Paper
          elevation={0}
          className="overflow-hidden rounded-[40px] shadow-[0_48px_100px_rgba(15,23,42,0.15)] border border-white flex flex-col lg:flex-row min-h-[700px] bg-white/40 backdrop-blur-xl"
        >
          {/* Left Side: Educational Hero */}
          <Box className="lg:w-1/2 relative min-h-[400px] lg:min-h-full overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
              style={{
                backgroundImage: 'url("/assets/vlab-premium-bg.png")',
              }}
            />
            {/* Brand Red Overlay - Deepened for better readability */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,113,133,0.15),transparent_60%)]" />

            <motion.div
              animate={{
                y: [0, 30, 0],
                x: [0, 20, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[20%] left-[5%] w-24 h-24 bg-red-500/10 border border-white/5 rounded-full backdrop-blur-2xl hidden lg:block"
            />

            <div className="relative z-10 h-full flex flex-col justify-between p-10 md:p-14 text-white">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <Box className="w-14 h-14 rounded-[20px] bg-white border border-white/10 flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]">
                  <img src="/assets/logo-icon.png" alt="VL" className="w-9 h-9 object-contain" />
                </Box>
                <div className="drop-shadow-lg">
                  <Typography className="text-xl font-black tracking-tighter leading-none">IGNITO</Typography>
                  <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mt-1">Virtual Labs</Typography>
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Typography variant="h1" className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-6 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                    IgnitoLearn <span className="text-rose-500 text-shadow-glow">Virtual</span> <br />Laboratory.
                  </Typography>
                  <Typography className="text-lg text-white/80 leading-relaxed max-w-md font-medium drop-shadow-md">
                    Experience seamless infrastructure management and interactive learning in our state-of-the-art virtual environment.
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-8 pt-8"
                >
                  <div className="text-center group">
                    <Typography className="text-3xl font-black text-white drop-shadow-xl group-hover:scale-110 transition-transform">450+</Typography>
                    <Typography className="text-[10px] uppercase font-bold tracking-widest text-white/50 mt-1 drop-shadow-sm">Active Labs</Typography>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center group">
                    <Typography className="text-3xl font-black text-white drop-shadow-xl group-hover:scale-110 transition-transform">99.9%</Typography>
                    <Typography className="text-[10px] uppercase font-bold tracking-widest text-white/50 mt-1 drop-shadow-sm">Uptime Rate</Typography>
                  </div>
                </motion.div>
              </div>

              <Typography className="text-[10px] text-white/30 font-bold tracking-widest uppercase drop-shadow-sm">
                © 2026 IgnitoLearn. Redefining Digital Education.
              </Typography>
            </div>
          </Box>

          {/* Right Side: Login Form */}
          <Box className="lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-20 relative overflow-hidden bg-white">
            {/* Rich Mesh Gradient Background */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-rose-100/60 blur-[100px] animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/40 blur-[100px]" />
              <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[80px]" />
            </div>

            {/* Technical Grid Pattern - More Visible */}
            <div className="absolute inset-0 z-1 opacity-[0.07] pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(#fb7185 1.5px, transparent 1.5px), linear-gradient(180deg, #fb7185 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />

            {/* Floating Decorative UI Elements */}
            <motion.div
              animate={{
                y: [0, -25, 0],
                rotate: [0, 45, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-[15%] right-[15%] w-20 h-20 border-2 border-rose-200/30 rounded-3xl z-1 hidden lg:block"
            />

            <motion.div
              animate={{
                y: [0, 30, 0],
                x: [0, 20, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[15%] left-[10%] w-32 h-32 border border-blue-200/20 rounded-full z-1 hidden lg:block"
            >
              <div className="absolute inset-4 border border-blue-200/10 rounded-full animate-spin-slow" />
            </motion.div>

            {/* Floating Icons - More Pronounced */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-10 text-rose-300 opacity-40 hidden xl:block"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </motion.div>

            <div className="w-full max-w-[420px] relative z-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Typography variant="h4" className="font-black text-slate-900 tracking-tight mb-6">Welcome Back</Typography>
                <Typography className="text-slate-500 font-medium mb-16 leading-relaxed">
                  Enter your credentials to access your workspace
                </Typography>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <Alert
                      severity="error"
                      className="rounded-[18px] border border-rose-100 bg-rose-50/50 text-rose-700"
                    >
                      {errorMessage}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-6 mt-4">
                <Box>
                  <Typography className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Identity</Typography>
                  <TextField
                    fullWidth
                    placeholder="admin@ignito.com"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    sx={textFieldStyles}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" className="ml-2">
                          <MdEmail size={20} className="text-slate-400" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Password</Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={textFieldStyles}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" className="ml-2">
                          <MdLock size={20} className="text-slate-400" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" className="mr-1">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <div className="flex items-center justify-between px-1">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={keepLoggedIn}
                        onChange={(e) => setKeepLoggedIn(e.target.checked)}
                        sx={{
                          color: '#e2e8f0',
                          '&.Mui-checked': { color: '#fb7185' },
                          '& .MuiSvgIcon-root': { fontSize: 20 }
                        }}
                      />
                    }
                    label={<span className="text-sm font-bold text-slate-500">Remember me</span>}
                  />
                  <Typography className="text-sm font-bold text-rose-500 hover:text-rose-600 cursor-pointer transition-colors">
                    Reset Password?
                  </Typography>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    endIcon={!isLoading && <MdArrowForward />}
                    className="!rounded-2xl !py-4.5 !text-white !font-black !text-sm !tracking-widest !bg-slate-900 hover:!bg-slate-800 !shadow-2xl !shadow-slate-200 !transition-all !mt-2 h-14"
                  >
                    {isLoading ? 'VERIFYING...' : 'SIGN INTO DASHBOARD'}
                  </Button>
                </motion.div>

                <Typography className="text-center text-xs text-slate-400 font-medium pt-6">
                  Secured by Ignito Infrastructure Cloud.
                </Typography>
              </form>
            </div>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}
