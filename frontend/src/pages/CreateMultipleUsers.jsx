import React, { useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Link, 
  Breadcrumbs 
} from '@mui/material';
import { MdFileUpload, MdChevronRight, MdArrowBack } from 'react-icons/md';
import Header from '../components/Header';
import { motion } from 'motion/react';

const CreateMultipleUsers = ({ onMenuClick }) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
    }
  };

  return (
    <Box className="flex-1 flex flex-col min-h-0 app-shell">
      <Header 
        onMenuClick={onMenuClick} 
        title="Identity Batch Sync" 
        onBack={() => window.history.back()}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 font-sans relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <Box className="max-w-[1200px] mx-auto relative z-10">
          <Breadcrumbs 
            separator={<span className="text-slate-300"><MdChevronRight size={16} /></span>}
            className="mb-8"
          >
            <Typography className="text-sm font-medium text-slate-500 cursor-pointer hover:text-red-500 transition-colors">Access Control</Typography>
            <Typography className="text-sm font-bold text-red-600">Batch Initialization</Typography>
          </Breadcrumbs>

          <Paper 
            elevation={0}
            className="rounded-[32px] border border-slate-200 p-8 md:p-12 bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Typography variant="h4" className="font-black text-slate-900 mb-6 tracking-tighter">
                Batch <span className="text-red-600">Identity Sync</span>
              </Typography>
              
              <Typography className="text-slate-500 text-sm font-medium mb-10 max-w-2xl leading-relaxed">
                Execute a massive identity initialization through structured data injection. Supported protocols include .XLSX and .XLS format datasets.
              </Typography>

              <div className="flex flex-wrap items-center gap-6 mb-12">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".xlsx,.xls"
                />
                <Button
                  variant="contained"
                  onClick={handleUploadClick}
                  startIcon={<MdFileUpload size={24} />}
                  className="!bg-red-600 hover:!bg-red-700 text-white rounded-2xl px-10 py-4 normal-case font-black text-sm shadow-lg border border-red-500/20 transition-all active:scale-95"
                >
                  UPLOAD DATASET
                </Button>
                
                <Link 
                  href="#" 
                  className="text-red-600 font-bold text-sm no-underline hover:text-red-700 transition-colors flex items-center gap-2 group"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100 group-hover:border-red-200 transition-all">
                    <MdChevronRight size={18} />
                  </div>
                  System Template (Excel)
                </Link>
              </div>

              <Box className="p-6 rounded-2xl bg-slate-50 border border-slate-200 border-dashed text-center">
                <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Drag and drop encrypted dataset here
                </Typography>
              </Box>
            </motion.div>
          </Paper>
        </Box>
      </main>
    </Box>
  );
};

export default CreateMultipleUsers;
