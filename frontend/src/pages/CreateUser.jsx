import React from 'react';
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
  InputLabel
} from '@mui/material';
import { MdChevronRight } from 'react-icons/md';
import Header from '../components/Header';
import { motion } from 'motion/react';
const CreateUser = ({ onMenuClick }) => {
  const [role, setRole] = React.useState('');
  return (
    <Box className="flex-1 flex flex-col min-h-0 bg-slate-50 app-shell h-full overflow-hidden">
      <Header
        onMenuClick={onMenuClick}
        title="Create Entity"
        onBack={() => window.history.back()}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <Box className="max-w-[1200px] mx-auto relative z-10">
          <Breadcrumbs
            separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>}
            className="mb-8">
            <Typography className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">Access Control</Typography>
            <Typography className="text-sm font-bold text-red-600">Initialize Identity</Typography>
          </Breadcrumbs>
          <Paper elevation={0}
            className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Typography variant="h4" className="font-black text-slate-900 mb-10 tracking-tighter">
                Initialize <span className="text-red-600">New Identity</span>
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-12">
                <Box>
                  <Typography variant="caption" className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2 block ml-1">PRIMARY DESIGNATION</Typography>
                  <TextField
                    fullWidth
                    placeholder="First Name"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: '#f8fafc',
                        color: '#1e293b',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#dc2626' }
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2 block ml-1">SECONDARY DESIGNATION</Typography>
                  <TextField
                    fullWidth
                    placeholder="Last Name"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: '#f8fafc',
                        color: '#1e293b',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#dc2626' }
                      }
                    }}
                  />
                </Box>
                <Box className="md:col-span-2">
                  <Typography variant="caption" className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2 block ml-1">IDENTITY ENDPOINT (EMAIL)</Typography>
                  <TextField
                    fullWidth
                    placeholder="email@vlab.io"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: '#f8fafc',
                        color: '#1e293b',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: '#dc2626' }
                      }
                    }}
                  />
                </Box>
                <Box className="md:col-span-2">
                  <Typography variant="caption" className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2 block ml-1">ACCESS CLEARANCE LEVEL</Typography>
                  <FormControl fullWidth variant="outlined">
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      displayEmpty
                      className="rounded-2xl h-[56px] text-slate-900 bg-slate-50"
                      sx={{
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '& .MuiSelect-select': { fontWeight: 'bold' }
                      }}
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return <span className="text-slate-500">Select user clearance level</span>;
                        }
                         return <span className="text-slate-900">{selected}</span>;
                      }}
                    >
                      <MenuItem value="Admin">System Administrator</MenuItem>
                      <MenuItem value="Super Admin">Root Supervisor</MenuItem>
                      <MenuItem value="User">Standard Operator</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="contained"
                  className="!bg-red-600 hover:!bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-red-600/20"
                >
                  INITIALIZE IDENTITY
                </Button>
                <Button
                  className="text-slate-400 font-bold px-8 py-3 normal-case hover:text-slate-600"
                  onClick={() => window.history.back()}
                >
                  ABORT PROCESS
                </Button>
              </div>
            </motion.div>
          </Paper>
        </Box>
      </main>
    </Box>
  );
};
export default CreateUser;
