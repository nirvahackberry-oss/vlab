import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Alert
} from '@mui/material';
import { MdChevronRight, MdSearch, MdChevronLeft } from 'react-icons/md';
import { motion } from 'motion/react';
import { fetchUsers, updateUserStatus } from '../services/userService';

const AllUsers = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('enable');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers();
        setUsers(data.users);
      } catch (err) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleModalClose = () => setIsModalOpen(false);

  return (
    <Box className="flex-1 flex flex-col min-h-0 app-shell h-full overflow-hidden">
      <Header
        onMenuClick={onMenuClick}
        title="Identity & Access"
        onBack={() => window.history.back()}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <Box className="max-w-[1700px] mx-auto relative z-10">
          <Breadcrumbs
            separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>}
            className="mb-8"
          >
            <Typography className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">Access Control</Typography>
            <Typography className="text-sm font-bold text-red-600">User Registry</Typography>
          </Breadcrumbs>

          {error && <Alert severity="error" className="mb-6 rounded-2xl">{error}</Alert>}
          {loading && <Box className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></Box>}

          <Paper
            elevation={0}
            className="rounded-[32px] border border-slate-200 overflow-hidden bg-white shadow-xl shadow-slate-200/50"
          >
            {/* List Header */}
            <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 bg-slate-50">
              <div>
                <Typography variant="h6" className="font-black text-slate-900 tracking-tight text-lg md:text-xl uppercase">
                  Authenticated <span className="text-red-600">Entities</span>
                </Typography>
                <Typography variant="caption" className="text-slate-500 font-bold uppercase tracking-widest mt-1 block">10 Systems Records Identified</Typography>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/users/new')}
                  className="!bg-red-600 hover:!bg-red-700 text-white rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg border border-red-500/20 transition-all active:scale-95"
                >
                  + AUTHORIZE NEW
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setIsModalOpen(true)}
                  className="!bg-slate-100 hover:!bg-slate-200 text-slate-700 rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
                >
                  GLOBAL STATE TOGGLE
                </Button>
              </div>
            </div>

            <div className="p-4 px-6 md:px-8 flex justify-end items-center gap-4 bg-slate-100/50">
              <motion.div
                initial={false}
                animate={{ width: isSearchOpen ? 240 : 0, opacity: isSearchOpen ? 1 : 0 }}
                className="overflow-hidden"
              >
                <TextField
                  size="small"
                  placeholder="Filter by credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      color: '#1e293b',
                      fontSize: '0.75rem',
                      '& fieldset': { borderColor: '#e2e8f0' }
                    }
                  }}
                />
              </motion.div>
              <IconButton
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-slate-500 hover:text-red-600 transition-colors bg-slate-200"
              >
                <MdSearch size={20} />
              </IconButton>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Index</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Identity</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Terminal Mail</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Access Level</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Status</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Enabled</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Init Date</TableCell>
                    <TableCell align="right" sx={{ color: '#475569', fontWeight: 900, fontSize: '10px', py: 2.5, px: 3, border: 'none', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Last Patch</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, idx) => (
                    <TableRow 
                      key={user.id} 
                      component={motion.tr}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <TableCell sx={{ py: 2.5, px: 3, color: 'rgba(0,0,0,0.5)', fontSize: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{user.id.toString().padStart(2, '0')}</TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, color: '#0f172a', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{user.name}</TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, color: 'rgba(0,0,0,0.6)', fontSize: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{user.email}</TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <Chip label={user.role} className="bg-red-50 border border-red-100 text-red-600 font-bold text-[9px] h-6 px-1 uppercase tracking-tighter" />
                      </TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <Typography className="text-[10px] font-black text-slate-500 tracking-widest">{user.status}</Typography>
                        </div>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <Typography className={`text-[10px] font-black ${user.enabled === 'True' ? "text-emerald-600" : "text-red-600"}`}>{user.enabled.toUpperCase()}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, px: 3, color: 'rgba(0,0,0,0.4)', fontSize: '11px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{user.created}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5, px: 3, color: 'rgba(0,0,0,0.4)', fontSize: '11px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{user.updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-slate-50 p-4 px-8 flex items-center justify-end text-slate-900 border-t border-slate-200">
              <div className="flex items-center gap-8">
                <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Slice <span className="text-slate-900">01-10</span> of 17 records
                </Typography>
                <div className="flex items-center gap-1">
                  <IconButton size="small" sx={{ color: 'rgba(0,0,0,0.2)' }}><MdChevronLeft /></IconButton>
                  <IconButton size="small" sx={{ color: '#0f172a', bgcolor: 'rgba(0,0,0,0.05)' }}><MdChevronRight /></IconButton>
                </div>
              </div>
            </div>
          </Paper>
        </Box>
      </main>

      <Dialog
        open={isModalOpen}
        onClose={handleModalClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: "rounded-[32px] overflow-hidden bg-white border border-slate-200 shadow-2xl",
          sx: { p: 2 }
        }}
      >
        <DialogTitle className="font-black text-slate-900 text-2xl p-6 pb-2 tracking-tighter">
          Identity <span className="text-red-600">Override</span>
        </DialogTitle>
        <DialogContent className="p-6">
          <RadioGroup
            row
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="mb-8"
          >
            <FormControlLabel
              value="enable"
              control={<Radio sx={{ color: 'rgba(0,0,0,0.3)', '&.Mui-checked': { color: '#dc2626' } }} />}
              label={<span className="text-xs font-black text-slate-700 uppercase tracking-widest">Enable Instance</span>}
            />
            <FormControlLabel
              value="disable"
              control={<Radio sx={{ color: 'rgba(0,0,0,0.3)', '&.Mui-checked': { color: '#dc2626' } }} />}
              label={<span className="text-xs font-black text-slate-700 uppercase tracking-widest">Disable Instance</span>}
            />
          </RadioGroup>
          
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink sx={{ fontWeight: 'black', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px' }}>Target Subject</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              notched
              label="Target Subject" 
              className="rounded-2xl h-[56px] text-slate-900 bg-slate-50"
              sx={{
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '& .MuiSelect-select': { fontSize: '13px', fontWeight: 'bold' }
              }}
            >
              <MenuItem value="All Users">All Systems Active</MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions className="p-6 flex gap-4">
          <Button
            onClick={handleModalClose}
            className="text-slate-500 font-bold px-8 py-3 normal-case hover:text-slate-800"
          >
            CANCEL ABORT
          </Button>
          <Button
            variant="contained"
            onClick={handleModalClose}
            className="!bg-red-600 hover:!bg-red-700 text-white font-black px-10 py-3 rounded-2xl shadow-lg border border-red-500/20"
          >
            EXECUTE OVERRIDE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AllUsers;
