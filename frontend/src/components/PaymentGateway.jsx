import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdClose, 
  MdCreditCard, 
  MdQrCode, 
  MdAccountBalance, 
  MdAccountBalanceWallet, 
  MdLock, 
  MdCheckCircle,
  MdArrowForward,
  MdShield
} from 'react-icons/md';

const PaymentMethodItem = ({ id, label, icon: Icon, active, onSelect, subtext }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(id)}
    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
      active 
        ? 'border-red-600 bg-red-50/50 shadow-md shadow-red-100' 
        : 'border-slate-100 bg-white hover:border-slate-300'
    }`}
  >
    <div className={`p-3 rounded-xl ${active ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <Typography className={`text-[14px] font-black tracking-tight ${active ? 'text-red-700' : 'text-slate-900'}`}>
        {label}
      </Typography>
      <Typography className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        {subtext}
      </Typography>
    </div>
    {active && (
      <motion.div layoutId="active-indicator" className="w-2 h-2 rounded-full bg-red-600" />
    )}
  </motion.div>
);

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[1, 2, 3].map((step) => (
      <React.Fragment key={step}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all duration-500 ${
          currentStep >= step ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-400'
        }`}>
          {currentStep > step ? <MdCheckCircle size={18} /> : step}
        </div>
        {step < 3 && (
          <div className={`w-12 h-[2px] transition-all duration-500 ${currentStep > step ? 'bg-red-600' : 'bg-slate-100'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const PaymentGateway = ({ open, onClose, lab, onPaymentSuccess, initialAmount = 500 }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState(initialAmount);

  useEffect(() => {
    if (open) {
      setPlan(initialAmount);
      setStep(2);
    }
  }, [open, initialAmount]);

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      setTimeout(() => {
        onPaymentSuccess(lab, plan);
        onClose();
        setStep(1); // Reset for next time
      }, 2500);
    }, 2000);
  };

  const plans = [
    { credits: 100, price: '₹99' },
    { credits: 500, price: '₹449', popular: true },
    { credits: 1000, price: '₹799' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "!rounded-[32px] !overflow-hidden !bg-slate-50",
        sx: { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
      }}
    >
      <DialogContent className="!p-0 flex flex-col md:flex-row min-h-[500px]">
        {/* Left Side: Order Summary */}
        <Box className="w-full md:w-[350px] bg-slate-900 p-8 text-white flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <Avatar src="/assets/logo-icon.png" className="w-10 h-10 bg-white p-1" />
            <div>
              <Typography className="text-[14px] font-black tracking-tight leading-none">VLAB IGNITO</Typography>
              <Typography className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Payment Gateway</Typography>
            </div>
          </div>

          <div className="flex-1">
            <Typography className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">You are buying</Typography>
            <Typography className="text-2xl font-black mb-2">{lab?.name}</Typography>
            <Typography className="text-slate-400 text-sm font-medium mb-8">{lab?.semester || 'Academic Lab'}</Typography>

            <Box className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <Typography className="text-slate-400 text-sm">Credits</Typography>
                <Typography className="font-black">{plan}</Typography>
              </div>
              <div className="flex justify-between items-center mb-6">
                <Typography className="text-slate-400 text-sm">Amount</Typography>
                <Typography className="text-xl font-black text-red-500">₹{Math.round(plan * 0.85)}</Typography>
              </div>
              <Divider className="!border-white/10 !mb-6" />
              <div className="flex items-center gap-2 text-emerald-400">
                <MdShield size={18} />
                <Typography className="text-[11px] font-black uppercase tracking-widest">Secure 256-bit SSL</Typography>
              </div>
            </Box>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-3 text-slate-500">
            <MdLock size={16} />
            <Typography className="text-[10px] font-bold">Payments are encrypted and secure.</Typography>
          </div>
        </Box>

        {/* Right Side: Payment Methods */}
        <Box className="flex-1 p-8 md:p-12 bg-white relative">
          <IconButton 
            onClick={onClose} 
            className="!absolute !top-4 !right-4 !bg-slate-50 hover:!bg-slate-100"
          >
            <MdClose />
          </IconButton>

          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography className="text-2xl font-black text-slate-900 mb-2">Payment Method</Typography>
                <Typography className="text-slate-500 text-sm mb-8">Choose your preferred way to pay.</Typography>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  <PaymentMethodItem 
                    id="card" 
                    label="Credit / Debit Card" 
                    icon={MdCreditCard} 
                    active={method === 'card'} 
                    onSelect={setMethod}
                    subtext="Visa, Mastercard, RuPay"
                  />
                  <PaymentMethodItem 
                    id="upi" 
                    label="UPI Payment" 
                    icon={MdQrCode} 
                    active={method === 'upi'} 
                    onSelect={setMethod}
                    subtext="Google Pay, PhonePe, Paytm"
                  />
                  <PaymentMethodItem 
                    id="netbanking" 
                    label="Net Banking" 
                    icon={MdAccountBalance} 
                    active={method === 'netbanking'} 
                    onSelect={setMethod}
                    subtext="All major Indian banks"
                  />
                </div>

                <Collapse in={method === 'card'}>
                  <Box className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField 
                          fullWidth 
                          label="Card Number" 
                          placeholder="0000 0000 0000 0000"
                          variant="outlined"
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth 
                          label="Expiry" 
                          placeholder="MM/YY"
                          variant="outlined"
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth 
                          label="CVV" 
                          placeholder="***"
                          variant="outlined"
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>

                <div className="flex gap-4">
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={isProcessing}
                    onClick={handlePay}
                    className="!bg-red-600 !py-4 !rounded-2xl !font-black !text-[12px] !uppercase !tracking-[0.2em] hover:!bg-red-700 disabled:!bg-slate-200"
                  >
                    {isProcessing ? <CircularProgress size={20} color="inherit" /> : `Pay ₹${Math.round(plan * 0.85)}`}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-8"
                >
                  <MdCheckCircle size={60} />
                </motion.div>
                <Typography className="text-3xl font-black text-slate-900 mb-2">Payment Successful!</Typography>
                <Typography className="text-slate-500 font-medium mb-8">
                  {plan} credits have been added to your {lab?.name} wallet.
                </Typography>
                <Box className="w-full max-w-[300px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</Typography>
                    <Typography className="text-[10px] font-black text-slate-900">#IGN-{Math.floor(Math.random() * 1000000)}</Typography>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</Typography>
                    <Typography className="text-[10px] font-black text-slate-900">{new Date().toLocaleDateString()}</Typography>
                  </div>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGateway;
