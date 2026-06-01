import React from 'react';
import { Box, Card, Typography, Button, Chip } from '@mui/material';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MdStar, MdAccessTime, MdStars, MdPlayArrow } from 'react-icons/md';

const SubLabGrid = ({ labs }) => {
  const navigate = useNavigate();

  return (
    <Box className="flex flex-col gap-4 font-sans">
      {labs.map((lab, idx) => (
        <motion.div
          key={lab.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          whileHover={{ scale: 1.005 }}
          onClick={() => navigate(`/admin/labs/view/${lab.id}`)}
          className="cursor-pointer group"
        >
          <Card 
            elevation={0} 
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row relative"
          >
            {/* Status Indicator Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Left Image Section */}
            <div className="w-full md:w-56 h-32 md:h-auto bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex items-center justify-center p-6 shrink-0 group-hover:bg-white transition-colors">
              <img 
                src={lab.logo} 
                alt={lab.title} 
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Main Content Section */}
            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Chip 
                  label={lab.level || "Expert"} 
                  size="small" 
                  className="bg-red-50 text-red-600 font-black text-[10px] tracking-widest uppercase rounded-lg border border-red-100"
                />
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <MdStar size={16} />
                  <span className="text-xs">{lab.rating}</span>
                </div>
              </div>
              
              <Typography variant="h6" className="text-slate-900 font-black tracking-tight text-lg md:text-xl group-hover:text-red-600 transition-colors uppercase">
                {lab.title}
              </Typography>
              
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <MdAccessTime size={16} />
                  </div>
                  <div>
                    <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Duration</Typography>
                    <Typography className="text-xs font-bold text-slate-700 mt-0.5">{lab.duration}</Typography>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <MdStars size={16} />
                  </div>
                  <div>
                    <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Credits</Typography>
                    <Typography className="text-xs font-bold text-slate-700 mt-0.5">{lab.credits}</Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Section */}
            <div className="p-5 md:p-6 flex items-center justify-center md:border-l border-slate-100 shrink-0 bg-slate-50/30 group-hover:bg-red-50/20 transition-colors">
              <Button 
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/compute/rdp?labId=${lab.id}&app=vscode`);
                }}
                className="!border-red-600 !text-red-600 hover:!bg-red-600 hover:!text-white rounded-xl px-6 py-2.5 font-black text-xs tracking-widest transition-all uppercase"
                startIcon={<MdPlayArrow size={18} />}
              >
                Launch
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </Box>
  );
};

export default SubLabGrid;
