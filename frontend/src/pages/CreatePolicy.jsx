import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Breadcrumbs,
  MenuItem,
  Select,
  FormControl,
  Switch,
  FormControlLabel
} from '@mui/material';
import { MdChevronRight } from 'react-icons/md';
import Header from '../components/Header';
import { motion } from 'motion/react';

const CreatePolicy = ({ onMenuClick }) => {
  const [labTitle, setLabTitle] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isDateActive, setIsDateActive] = useState(false);
  const [isTimeActive, setIsTimeActive] = useState(false);

  return (
    <Box className="flex-1 flex flex-col min-h-0 app-shell">
      <Header 
        onMenuClick={onMenuClick} 
        title="Security Protocol" 
        onBack={() => window.history.back()}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <Box className="max-w-[1200px] mx-auto relative z-10">
          <Breadcrumbs 
            separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>}
            className="mb-8"
          >
            <Typography className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">Governance</Typography>
            <Typography className="text-sm font-bold text-red-600">Policy Initialization</Typography>
          </Breadcrumbs>

          <Paper 
            elevation={0}
            className="rounded-[32px] border border-slate-200 p-8 md:p-12 bg-white shadow-xl shadow-slate-200/50"
          >
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Typography variant="h4" className="font-black text-slate-900 mb-10 tracking-tighter uppercase">
                Initialize <span className="text-red-600">Security Policy</span>
              </Typography>

              <Box className="flex flex-col gap-8 mb-12">
                {[
                  { label: "PROTOCOL ACTIVE STATE", value: isActive, setter: setIsActive },
                  { label: "CHRONOS DATE VALIDATION", value: isDateActive, setter: setIsDateActive },
                  { label: "QUANTUM TIME VALIDATION", value: isTimeActive, setter: setIsTimeActive }
                ].map((toggle, idx) => (
                  <Box key={idx} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-500/20 transition-all group">
                    <div>
                      <Typography className="text-xs font-black text-red-600 tracking-[0.2em] mb-1">{toggle.label}</Typography>
                      <Typography className="text-slate-500 text-[11px] font-bold">Configure active verification for target instances.</Typography>
                    </div>
                    <Switch 
                      checked={toggle.value} 
                      onChange={(e) => toggle.setter(e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#dc2626' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#dc2626' },
                        '& .MuiSwitch-track': { bgcolor: 'rgba(0,0,0,0.1)' }
                      }}
                    />
                  </Box>
                ))}

                <Box className="pt-4">
                  <Typography variant="caption" className="text-red-600 font-black text-[10px] uppercase tracking-widest mb-3 block ml-1">TARGET VIRTUAL ENVIRONMENT</Typography>
                  <FormControl fullWidth variant="outlined">
                    <Select
                      value={labTitle}
                      onChange={(e) => setLabTitle(e.target.value)}
                      displayEmpty
                      className="rounded-2xl h-[64px] text-slate-900 bg-slate-50"
                      sx={{ 
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '& .MuiSelect-select': { fontWeight: 'bold', fontSize: '15px' }
                      }}
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <span className="text-slate-500">Select target laboratory instance</span>;
                        }
                        return <span className="text-slate-900">{selected}</span>;
                      }}
                    >
                      <MenuItem value="Cloud Security">Cloud Security Labs</MenuItem>
                      <MenuItem value="DevOps Foundation">DevOps Foundation</MenuItem>
                      <MenuItem value="Advanced Networking">Advanced Networking</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <div className="flex gap-6 mt-12 bg-slate-100 p-8 rounded-3xl border border-slate-200">
                <Button
                  variant="contained"
                  className="!bg-red-600 hover:!bg-red-700 text-white rounded-2xl px-12 py-4 normal-case font-black text-sm shadow-lg border border-red-500/20 transition-all active:scale-95"
                >
                  COMMIT POLICY
                </Button>
                <Button
                  className="text-slate-500 font-bold px-10 py-4 normal-case hover:text-slate-900 transition-colors"
                  onClick={() => window.history.back()}
                >
                  ABORT
                </Button>
              </div>
            </motion.div>
          </Paper>
        </Box>
      </main>
    </Box>
  );
};

export default CreatePolicy;
