import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { MdCheckCircle, MdChevronRight, MdRocketLaunch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { createInstance, fetchInstanceCatalog } from '../../services/computeService';

const CreateInstance = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState({ regions: [], images: [], plans: [] });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedOS, setSelectedOS] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [name, setName] = useState('My-First-Instance');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const data = await fetchInstanceCatalog();
        if (!isMounted) return;

        setCatalog(data);
        setSelectedRegion(data.regions[0]?.id || '');
        setSelectedOS(data.images[0]?.id || '');
        setSelectedPlan(data.plans.find((plan) => plan.popular)?.id || data.plans[0]?.id || '');
      } catch (catalogError) {
        if (isMounted) {
          setError(catalogError.message || 'Unable to load instance catalog');
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPlanDetails = useMemo(
    () => catalog.plans.find((plan) => plan.id === selectedPlan),
    [catalog.plans, selectedPlan],
  );

  const handleCreateInstance = async () => {
    try {
      setIsSaving(true);
      setError('');

      await createInstance({
        name: name.trim(),
        regionId: selectedRegion,
        imageId: selectedOS,
        planId: selectedPlan,
      });

      navigate('/admin/compute/instances');
    } catch (saveError) {
      setError(saveError.message || 'Unable to create instance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box className="flex-1 flex flex-col min-h-0 bg-slate-50 app-shell">
      <Header onMenuClick={onMenuClick} title="Create Instance" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans">
        <Box className="max-w-[1200px] mx-auto">
          {error && (
            <Alert severity="warning" className="mb-6 rounded-2xl">
              {error}
            </Alert>
          )}

          <Breadcrumbs
            separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>}
            className="mb-8"
          >
            <Typography onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500">
              Dashboard
            </Typography>
            <Typography onClick={() => navigate('/admin/compute/instances')} className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500">
              Compute
            </Typography>
            <Typography className="text-sm font-bold text-red-600">Create Instance</Typography>
          </Breadcrumbs>

          <div className="mb-12">
            <Typography variant="h3" className="font-black text-slate-900 tracking-tighter mb-2 text-3xl md:text-5xl">
              Launch New <span className="text-red-600">Infrastructure</span>
            </Typography>
            <Typography className="text-slate-500 font-medium text-sm">
              This screen is now API-ready. Swap the mock catalog with your Docker backend and the same flow will continue to work.
            </Typography>
          </div>

          <div className="space-y-10">
            <Paper elevation={0} className="p-8 rounded-[32px] border border-slate-200 bg-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">1</div>
                <Typography variant="h5" className="font-black text-slate-900 tracking-tight">Select Instance Location</Typography>
              </div>
              <Grid container spacing={3}>
                {catalog.regions.map((region) => (
                  <Grid item xs={12} sm={6} md={3} key={region.id}>
                    <Box
                      onClick={() => setSelectedRegion(region.id)}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedRegion === region.id ? 'border-red-600 bg-red-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <Typography className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">{region.code}</Typography>
                      <Typography className="font-bold text-slate-900 text-sm">{region.name}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper elevation={0} className="p-8 rounded-[32px] border border-slate-200 bg-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">2</div>
                <Typography variant="h5" className="font-black text-slate-900 tracking-tight">Pick an OS Blueprint</Typography>
              </div>
              <Grid container spacing={3}>
                {catalog.images.map((os) => (
                  <Grid item xs={12} sm={6} md={3} key={os.id}>
                    <Box
                      onClick={() => setSelectedOS(os.id)}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${selectedOS === os.id ? 'border-red-600 bg-red-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{os.badge}</Typography>
                      <Typography className="font-bold text-slate-900 text-sm">{os.name}</Typography>
                      {selectedOS === os.id && <MdCheckCircle className="text-red-600 mt-3" size={20} />}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper elevation={0} className="p-8 rounded-[32px] border border-slate-200 bg-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">3</div>
                <Typography variant="h5" className="font-black text-slate-900 tracking-tight">Choose Your Instance Plan</Typography>
              </div>
              <Grid container spacing={3}>
                {catalog.plans.map((plan) => (
                  <Grid item xs={12} sm={6} md={3} key={plan.id}>
                    <Box
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-6 rounded-[24px] border-2 cursor-pointer transition-all relative overflow-hidden h-full flex flex-col ${selectedPlan === plan.id ? 'border-red-600 bg-red-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Popular</div>
                      )}
                      <Typography variant="h4" className="font-black text-slate-900 mb-6">
                        {plan.price}
                        <span className="text-sm text-slate-400 font-bold">/mo</span>
                      </Typography>
                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest"><span>Memory</span> <span className="text-slate-900">{plan.ram}</span></div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest"><span>CPU</span> <span className="text-slate-900">{plan.cpu}</span></div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest"><span>Storage</span> <span className="text-slate-900">{plan.ssd}</span></div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest"><span>Transfer</span> <span className="text-slate-900">{plan.transfer}</span></div>
                      </div>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper elevation={0} className="p-8 rounded-[32px] border border-slate-200 bg-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">4</div>
                <Typography variant="h5" className="font-black text-slate-900 tracking-tight">Final Details</Typography>
              </div>
              <Box className="max-w-md">
                <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Instance Name</Typography>
                <TextField
                  fullWidth
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. prod-web-server"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'slate.50', fontWeight: 'bold' } }}
                />
              </Box>
            </Paper>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[40px] bg-slate-900 text-white shadow-2xl shadow-slate-900/40">
              <div>
                <Typography variant="h6" className="font-black text-white mb-1">Configuration Ready</Typography>
                <Typography className="text-slate-400 text-xs">
                  Estimated Monthly Cost: <span className="text-red-500 font-bold">{selectedPlanDetails?.price || '--'}</span>
                </Typography>
              </div>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreateInstance}
                startIcon={<MdRocketLaunch />}
                disabled={isSaving || !selectedRegion || !selectedOS || !selectedPlan || !name.trim()}
                className="!bg-red-600 hover:!bg-red-700 text-white font-black px-12 py-5 rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-red-500/20"
              >
                {isSaving ? 'CREATING...' : 'Create Instance'}
              </Button>
            </div>
          </div>
        </Box>
      </main>
    </Box>
  );
};

export default CreateInstance;
