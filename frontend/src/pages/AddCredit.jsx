import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, IconButton, Chip, Skeleton, Alert, Snackbar, Grid, Divider, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAddCard, MdRefresh, MdHistory, MdPayment, MdWarning, MdCheckCircle, MdAccountBalanceWallet, MdSchool, MdArrowForward, MdCode } from 'react-icons/md';
import { SiPython, SiJavascript, SiReact, SiMysql, SiLinux } from 'react-icons/si';
import { FaJava } from 'react-icons/fa';
import Header from '../components/Header';
import PaymentGateway from '../components/PaymentGateway';
import { useLabStore } from '../store/labStore';

const getTechDetails = (lab) => {
  const title = lab.title?.toLowerCase() || '';
  const id = lab.id?.toLowerCase() || '';
  
  if (title.includes('python') || id.includes('python')) return { label: 'Python', icon: <SiPython className="text-[#3776AB]" />, color: 'bg-[#3776AB]/10 text-[#3776AB]' };
  if (title.includes('java') || id.includes('java')) return { label: 'Java', icon: <FaJava className="text-[#007396]" />, color: 'bg-[#007396]/10 text-[#007396]' };
  if (title.includes('react') || id.includes('react')) return { label: 'React.js', icon: <SiReact className="text-[#61DAFB]" />, color: 'bg-[#61DAFB]/10 text-[#61DAFB]' };
  if (title.includes('dbms') || title.includes('sql') || id.includes('dbms')) return { label: 'DBMS / SQL', icon: <SiMysql className="text-[#4479A1]" />, color: 'bg-[#4479A1]/10 text-[#4479A1]' };
  if (title.includes('linux') || id.includes('linux')) return { label: 'Linux', icon: <SiLinux className="text-[#FCC624]" />, color: 'bg-[#FCC624]/10 text-[#FCC624]' };
  return { label: 'Technical', icon: <MdCode className="text-slate-500" />, color: 'bg-slate-100 text-slate-500' };
};

const LabCreditCard = ({ lab, onBuy }) => {
  const isOutOfCredit = (lab.credits || 0) <= 0;
  const [amount, setAmount] = useState(100);
  const tech = getTechDetails(lab);

  const handleIncrement = () => setAmount(prev => prev + 5);
  const handleDecrement = () => setAmount(prev => Math.max(5, prev - 5));
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative flex flex-col bg-white border border-slate-200/60 rounded-[32px] p-7 shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 group overflow-hidden"
    >
      {/* Visual Accents */}
      <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full opacity-[0.03] -mr-20 -mt-20 ${isOutOfCredit ? 'bg-red-600' : 'bg-blue-600'}`} />
      
      <div className="flex justify-between items-start mb-8">
        <div className="relative">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm flex items-center justify-center">
            {lab.logo ? (
              <img src={lab.logo} alt={tech.label} className="w-8 h-8 object-contain" />
            ) : (
              <Box className="text-2xl">{tech.icon}</Box>
            )}
          </div>
          {isOutOfCredit && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
           <Chip 
              label={isOutOfCredit ? "Low Credit" : "Sufficient"} 
              size="small" 
              className={`!font-black !text-[10px] !uppercase !tracking-widest !rounded-lg ${
                isOutOfCredit ? '!bg-red-50 !text-red-600' : '!bg-emerald-50 !text-emerald-600'
              }`} 
           />
           <div className={`px-2 py-0.5 rounded-md border border-current opacity-70 font-black text-[8px] uppercase tracking-widest ${tech.color}`}>
              {tech.label}
           </div>
        </div>
      </div>

      <div className="flex-1">
        <Typography className="text-[15px] font-black text-slate-900 mb-1 leading-tight line-clamp-1 group-hover:text-red-600 transition-colors">
          {lab.title || lab.name}
        </Typography>
        <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <MdSchool size={12} className="opacity-40" /> {lab.semester || 'Academic Lab'}
        </Typography>

        <Box className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between">
          <div>
            <Typography className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Balance</Typography>
            <Typography className={`text-2xl font-black tracking-tighter ${isOutOfCredit ? 'text-red-600' : 'text-slate-900'}`}>
              {lab.credits || 0}
            </Typography>
          </div>
          <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credits</Typography>
        </Box>

        <Box className="space-y-4">
           <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Top-up Value</Typography>
           <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-1 shadow-sm focus-within:border-red-500 transition-colors">
              <IconButton onClick={handleDecrement} className="!w-10 !h-10 !bg-slate-50 hover:!bg-slate-100 !text-slate-900 !rounded-xl transition-all"><Typography className="font-black text-xl">-</Typography></IconButton>
              <input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))} className="w-20 text-center text-lg font-black text-slate-900 outline-none bg-transparent" />
              <IconButton onClick={handleIncrement} className="!w-10 !h-10 !bg-slate-900 hover:!bg-red-600 !text-white !rounded-xl transition-all shadow-lg shadow-slate-200"><Typography className="font-black text-xl">+</Typography></IconButton>
           </div>

           <Button
            fullWidth
            onClick={() => onBuy(lab, amount)}
            className={`!rounded-2xl !py-4 !text-[11px] !font-black !uppercase !tracking-[0.15em] !shadow-none hover:!shadow-xl hover:!shadow-red-200 transition-all active:scale-95 ${
              isOutOfCredit ? '!bg-red-600 !text-white' : '!bg-slate-900 !text-white hover:!bg-red-600'
            }`}
            startIcon={<MdPayment size={18} />}
          >
            Buy {amount} Credits
          </Button>
        </Box>
      </div>
    </motion.div>
  );
};

export default function AddCredit({ onMenuClick }) {
  const { labs, isLoading, loadLabs, updateLab } = useLabStore();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(100);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const groupedLabs = useMemo(() => {
    if (!labs) return {};
    return labs.reduce((acc, lab) => {
      const sem = lab.semester || 'Other Curriculum';
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(lab);
      return acc;
    }, {});
  }, [labs]);

  const handleBuy = (lab, amount) => {
    setSelectedLab(lab);
    setSelectedAmount(amount);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (lab, creditsToAdd) => {
    const newTotal = (lab.credits || 0) + creditsToAdd;
    
    // Call the store action which handles both backend and frontend sync
    const { rechargeLab } = useLabStore.getState();
    await rechargeLab(lab.id, newTotal);

    setSnackbar({
      open: true,
      message: `Recharge of ${creditsToAdd} credits successful for ${lab.name}!`,
      severity: 'success'
    });
  };

  return (
    <Box className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden">
      <Header onMenuClick={onMenuClick} title="Recharge Hub" />

      <Box component="main" className="flex-1 p-4 md:p-10 overflow-auto">
        <div className="max-w-[1600px] mx-auto">


          {/* Grouped Lab Grid */}
          <div className="space-y-16 pb-20">
            {isLoading ? (
               <Grid container spacing={4}>
                 {[...Array(4)].map((_, i) => (
                   <Grid item xs={12} sm={6} lg={4} xl={3} key={i}>
                     <Skeleton variant="rounded" height={400} className="rounded-[32px]" />
                   </Grid>
                 ))}
               </Grid>
            ) : Object.keys(groupedLabs).length > 0 ? (
              Object.keys(groupedLabs).sort().map((semester) => (
                <div key={semester} className="space-y-8">
                  <div className="flex items-center gap-6 px-1">
                    <div className="flex items-center gap-2">
                       <MdSchool size={24} className="text-red-600" />
                       <Typography className="text-xl font-black text-slate-900 uppercase tracking-tight">{semester}</Typography>
                    </div>
                    <Divider className="flex-1 !border-slate-200" />
                    <Chip label={`${groupedLabs[semester].length} Labs`} className="!bg-slate-900 !text-white !font-black !text-[10px] uppercase tracking-widest !rounded-xl" />
                  </div>

                  <Grid container spacing={4}>
                    {groupedLabs[semester].map((lab) => (
                      <Grid item xs={12} sm={6} lg={4} xl={3} key={lab.id}>
                        <LabCreditCard lab={lab} onBuy={handleBuy} />
                      </Grid>
                    ))}
                  </Grid>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[48px] border border-dashed border-slate-200 opacity-60">
                <MdAccountBalanceWallet size={64} className="text-slate-300 mb-6" />
                <Typography className="text-lg font-bold text-slate-400 uppercase tracking-[0.2em]">No assigned laboratories found</Typography>
              </div>
            )}
          </div>
        </div>
      </Box>
      
      <PaymentGateway
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        lab={selectedLab}
        initialAmount={selectedAmount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} className="rounded-2xl shadow-2xl font-black border border-white/10 !bg-slate-900 !text-white" icon={<MdCheckCircle size={28} className="text-emerald-500" />}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
