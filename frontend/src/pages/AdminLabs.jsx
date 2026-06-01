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
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip
} from '@mui/material';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch, 
  MdFilterList,
  MdCloudQueue
} from 'react-icons/md';
import { motion } from 'motion/react';
import { useLabStore } from '../store/labStore';
import Header from '../components/Header';

export default function AdminLabs({ onMenuClick }) {
  const { labs, addLab, updateLab, deleteLab } = useLabStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', logo: '', category: 'Infrastructure', semester: 'Semester 1' });

  const filteredLabs = labs.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (lab) => {
    if (lab) {
      setEditingLab(lab);
      setFormData({ 
        title: lab.title, 
        logo: lab.logo, 
        category: lab.category || 'Infrastructure',
        semester: lab.semester || 'Semester 1'
      });
    } else {
      setEditingLab(null);
      setFormData({ title: '', logo: '', category: 'Infrastructure', semester: 'Semester 1' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingLab) {
      updateLab({ ...editingLab, ...formData });
    } else {
      addLab({ 
        id: Math.random().toString(36).substr(2, 9), 
        ...formData 
      });
    }
    setIsModalOpen(false);
  };

  return (
    <Box className="flex-1 flex flex-col min-h-0 app-shell">
      <Header onMenuClick={onMenuClick} title="Laboratory Management" />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto font-sans relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Box className="max-w-[1700px] mx-auto relative z-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Typography variant="h3" className="font-black text-slate-900 tracking-tighter mb-2 text-2xl sm:text-4xl">
                Manage <span className="text-red-600">Labs</span>
              </Typography>
              <Typography className="text-slate-500 font-black text-[11px] uppercase tracking-[0.25em]">
                NEURAL INFRASTRUCTURE INTERFACE
              </Typography>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                variant="contained"
                onClick={() => handleOpenModal()}
                className="!bg-red-600 hover:!bg-red-700 text-white py-3.5 px-6 sm:px-8 rounded-2xl normal-case font-black text-sm shadow-lg border border-red-500/20 transition-all active:scale-95 w-full sm:w-auto"
                startIcon={<MdAdd size={22} />}
              >
                INITIALIZE COMMAND
              </Button>
            </motion.div>
          </div>

          <Paper className="rounded-[32px] border border-slate-200 overflow-hidden bg-white shadow-xl shadow-slate-200/50">
            <div className="p-4 sm:p-6 md:p-8 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50">
              <TextField
                placeholder="Search encrypted lab data..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full lg:max-w-md"
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
                InputProps={{
                  startAdornment: (
                    <div className="text-red-600 mr-2 flex items-center">
                      <MdSearch size={22} />
                    </div>
                  ),
                }}
              />
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button className="text-slate-500 font-bold normal-case hover:text-red-600 transition-colors bg-white px-4 rounded-xl border border-slate-200 hover:border-red-500/20 shadow-sm w-full sm:w-auto">
                  <span className="mr-2 flex items-center text-red-600"><MdFilterList size={18} /></span> Filter
                </Button>
                <Button className="text-slate-500 font-bold normal-case hover:text-red-600 transition-colors bg-white px-4 rounded-xl border border-slate-200 hover:border-red-500/20 shadow-sm w-full sm:w-auto">
                  <span className="mr-2 flex items-center text-red-600"><MdCloudQueue size={18} /></span> Sync Cloud
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#475569', py: 3, pl: 5, border: 'none' }}>Virtual Instance</TableCell>
                    <TableCell sx={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#475569', border: 'none' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#475569', border: 'none' }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#475569', border: 'none' }}>Operational Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#475569', py: 3, pr: 5, border: 'none' }}>Control Array</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLabs.map((lab, index) => (
                    <TableRow
                      key={lab.id} 
                      component={motion.tr}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors group border-b border-slate-100"
                    >
                      <TableCell sx={{ py: 3, pl: 5, border: 'none' }}>
                        <div className="flex items-center gap-3 sm:gap-5 min-w-[220px]">
                          <Avatar 
                            src={lab.logo} 
                            variant="rounded" 
                            className="bg-slate-50 p-2 w-12 h-12 sm:w-14 sm:h-14 border border-slate-200 shadow-sm group-hover:scale-110 transition-transform shrink-0"
                          />
                          <div>
                            <Typography className="font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-wider text-sm sm:text-base">{lab.title}</Typography>
                            <Typography variant="caption" className="text-slate-500 font-bold block mt-0.5">ID: {lab.id.toUpperCase()}</Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Chip 
                          label={lab.category || 'Standard'} 
                          className="bg-red-50 border border-red-100 text-red-600 font-black text-[9px] tracking-widest uppercase px-1 h-6" 
                        />
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                         <Typography className="text-[11px] font-black text-slate-900 tracking-widest uppercase">{lab.semester || 'Semester 1'}</Typography>
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <Typography className="text-[11px] font-black text-slate-500 tracking-widest uppercase">Active</Typography>
                        </div>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 3, pr: 5, border: 'none' }}>
                        <IconButton 
                          onClick={() => handleOpenModal(lab)} 
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <MdEdit size={20} />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteLab(lab.id)} 
                          className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all ml-2"
                        >
                          <MdDelete size={20} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </Box>
      </main>

      {/* Add/Edit Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        PaperProps={{ 
          className: 'rounded-[32px] p-2 bg-white border border-slate-200 text-slate-900 shadow-2xl',
          sx: { maxWidth: '450px', width: '100%', m: 2 } 
        }}
      >
        <DialogTitle className="font-black text-2xl tracking-tighter pt-6 px-6">
          {editingLab ? 'Modify' : 'Initialize'} <span className="text-red-600">Laboratory</span>
        </DialogTitle>
        <DialogContent className="flex flex-col gap-6 pt-6 px-6">
          <TextField
            fullWidth
            label="Laboratory Name"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ 
              '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px', 
                bgcolor: '#f8fafc',
                color: '#1e293b',
                '& fieldset': { borderColor: '#e2e8f0' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Brand Asset URL"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            sx={{ 
              '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px', 
                bgcolor: '#f8fafc',
                color: '#1e293b',
                '& fieldset': { borderColor: '#e2e8f0' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Academic Semester"
            value={formData.semester}
            placeholder="e.g. Semester 1"
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            sx={{ 
              '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px', 
                bgcolor: '#f8fafc',
                color: '#1e293b',
                '& fieldset': { borderColor: '#e2e8f0' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Security Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            sx={{ 
              '& .MuiInputLabel-root': { color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px', 
                bgcolor: '#f8fafc',
                color: '#1e293b',
                '& fieldset': { borderColor: '#e2e8f0' }
              }
            }}
          />
        </DialogContent>
        <DialogActions className="p-8 pt-2">
          <Button onClick={() => setIsModalOpen(false)} className="text-slate-500 font-bold normal-case px-6">ABORT</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            className="!bg-red-600 hover:!bg-red-700 text-white font-black px-8 py-3 rounded-2xl shadow-lg border border-red-500/20"
          >
            {editingLab ? 'COMMIT CHANGES' : 'DEPLOY LAB'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
