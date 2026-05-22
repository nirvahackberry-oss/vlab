import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  IconButton, 
  Menu, 
  MenuItem,
  Chip,
  LinearProgress,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  MdAdd, 
  MdMoreVert, 
  MdPlayArrow, 
  MdStop, 
  MdRefresh, 
  MdDelete,
  MdTerminal,
  MdPublic,
  MdSettings,
  MdStorage,
  MdMemory,
  MdComputer
} from 'react-icons/md';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { fetchInstances } from '../../services/computeService';

const InstanceCard = ({ instance }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const isRunning = instance.status === 'running';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Paper elevation={0} className="p-6 rounded-[28px] border border-slate-200 bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isRunning ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <Box className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isRunning ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              <MdComputer size={32} />
            </Box>
            <div>
              <Typography variant="h6" className="font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-red-600 transition-colors">
                {instance.name}
              </Typography>
              <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest">{instance.id}</Typography>
            </div>
          </div>
          
          <IconButton onClick={handleClick} className="bg-slate-50 hover:bg-slate-100">
            <MdMoreVert size={20} />
          </IconButton>
        </div>

        <Box className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <MdPublic size={16} />
              <Typography className="text-xs font-bold">{instance.location}</Typography>
            </div>
            <Chip 
              label={instance.status.toUpperCase()} 
              size="small" 
              className={`font-black text-[9px] tracking-[0.1em] rounded-lg ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`} 
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metrics</Typography>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Typography className="text-[10px] font-bold text-slate-500">CPU</Typography>
                  <Typography className="text-[10px] font-bold text-slate-700">{instance.cpu}%</Typography>
                </div>
                <LinearProgress variant="determinate" value={instance.cpu} className="h-1 rounded bg-slate-200" sx={{ '& .MuiLinearProgress-bar': { bgcolor: isRunning ? '#ef4444' : '#94a3b8' }}} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Typography className="text-[10px] font-bold text-slate-500">RAM</Typography>
                  <Typography className="text-[10px] font-bold text-slate-700">{instance.ram}%</Typography>
                </div>
                <LinearProgress variant="determinate" value={instance.ram} className="h-1 rounded bg-slate-200" sx={{ '& .MuiLinearProgress-bar': { bgcolor: isRunning ? '#3b82f6' : '#94a3b8' }}} />
              </div>
            </div>
          </div>
        </Box>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
             <Typography className="text-sm font-mono font-bold text-slate-800">{instance.ip}</Typography>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <Tooltip title="Connect via SSH">
              <IconButton 
                onClick={() => navigate('/admin/compute/terminals')}
                className="bg-slate-900 text-white hover:bg-black transition-all rounded-xl p-2.5"
              >
                <MdTerminal size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton className="bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all rounded-xl p-2.5">
                <MdSettings size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => { handleClose(); navigate('/admin/compute/terminals'); }} className="text-xs font-bold gap-3"><MdTerminal /> Open Terminal</MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/admin/compute/ide'); }} className="text-xs font-bold gap-3"><MdSettings /> Open in Cloud IDE</MenuItem>
          <MenuItem onClick={handleClose} className="text-xs font-bold gap-3"><MdPlayArrow /> Start Instance</MenuItem>
          <MenuItem onClick={handleClose} className="text-xs font-bold gap-3"><MdStop /> Stop Instance</MenuItem>
          <MenuItem onClick={handleClose} className="text-xs font-bold gap-3"><MdRefresh /> Reboot</MenuItem>
          <MenuItem onClick={handleClose} className="text-xs font-bold gap-3 text-red-600"><MdDelete /> Delete</MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};

const Instances = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadInstances = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInstances();
        if (isMounted) {
          setInstances(data);
          setError('');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load instances');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInstances();

    return () => {
      isMounted = false;
    };
  }, []);

  const infrastructureStats = useMemo(() => {
    const runningInstances = instances.filter((instance) => instance.status === 'running');
    const totalCpu = instances.reduce((sum, instance) => sum + (instance.cpu || 0), 0);
    const totalRam = instances.reduce((sum, instance) => sum + (instance.ram || 0), 0);

    return {
      totalInstances: instances.length,
      runningInstances: runningInstances.length,
      averageCpu: instances.length ? Math.round(totalCpu / instances.length) : 0,
      averageRam: instances.length ? Math.round(totalRam / instances.length) : 0,
    };
  }, [instances]);

  return (
    <Box className="flex-1 flex flex-col min-h-0 bg-slate-50 app-shell">
      <Header onMenuClick={onMenuClick} title="Compute Instances" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans">
        <Box className="max-w-[1700px] mx-auto">
          {error && (
            <Alert severity="warning" className="mb-6 rounded-2xl">
              {error}
            </Alert>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <Typography variant="h3" className="font-black text-slate-900 tracking-tighter mb-2 text-3xl md:text-5xl">
                Ignito <span className="text-red-600">Compute</span>
              </Typography>
              <Typography className="text-slate-500 font-medium text-sm">
                Scale your applications with dedicated virtual private servers. Low cost, high performance.
              </Typography>
            </div>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/compute/new')}
              startIcon={<MdAdd size={24} />}
              className="!bg-red-600 hover:!bg-red-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-red-500/30 uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Create Instance
            </Button>
          </div>

          <Box className="flex gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar">
            {['All Instances', 'Production', 'Development', 'Snapshots', 'Static IPs'].map((tab, i) => (
               <Button 
                key={tab}
                className={`whitespace-nowrap px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900'}`}
               >
                 {tab}
               </Button>
            ))}
          </Box>

          <Grid container spacing={4}>
            {instances.map((instance) => (
              <Grid item xs={12} md={6} lg={4} key={instance.id}>
                <InstanceCard instance={instance} />
              </Grid>
            ))}
          </Grid>

          {!isLoading && instances.length === 0 && (
            <Paper elevation={0} className="p-10 mt-4 rounded-[28px] border border-dashed border-slate-300 bg-white text-center">
              <Typography className="font-black text-slate-900 mb-2">No instances available</Typography>
              <Typography className="text-sm text-slate-500">Connect the compute API or create your first instance for the demo.</Typography>
            </Paper>
          )}

          {/* Infrastructure Stats Bar */}
          <Paper elevation={0} className="mt-16 p-8 rounded-[40px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 flex flex-wrap items-center justify-around gap-8">
             <div className="text-center">
               <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL INSTANCES</Typography>
               <Typography variant="h4" className="font-black text-slate-900">{isLoading ? '...' : infrastructureStats.totalInstances}</Typography>
             </div>
             <div className="w-[1px] h-10 bg-slate-100 hidden md:block" />
             <div className="text-center">
               <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RUNNING</Typography>
               <Typography variant="h4" className="font-black text-slate-900">{isLoading ? '...' : infrastructureStats.runningInstances}</Typography>
             </div>
             <div className="w-[1px] h-10 bg-slate-100 hidden md:block" />
             <div className="text-center">
               <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AVG CPU LOAD</Typography>
               <Typography variant="h4" className="font-black text-slate-900">{isLoading ? '...' : `${infrastructureStats.averageCpu}%`}</Typography>
             </div>
             <div className="w-[1px] h-10 bg-slate-100 hidden md:block" />
             <div className="text-center">
               <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AVG RAM LOAD</Typography>
               <Typography variant="h4" className="font-black text-emerald-600">{isLoading ? '...' : `${infrastructureStats.averageRam}%`}</Typography>
             </div>
          </Paper>
        </Box>
      </main>
    </Box>
  );
};

export default Instances;
