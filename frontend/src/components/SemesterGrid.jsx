import React from 'react';
import { Box, Card, Typography, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { MdSchool, MdChevronRight, MdAutoStories, MdBookmark } from 'react-icons/md';

const SemesterGrid = ({ semesters, onSemesterClick }) => {
  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {semesters.map((sem, idx) => (
        <motion.div
          key={sem.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -3 }}
          onClick={() => onSemesterClick(sem.name)}
          className="cursor-pointer group"
        >
          <Card 
            elevation={0}
            className="relative overflow-hidden bg-white border border-slate-200 rounded-[16px] sm:rounded-[24px] p-3 sm:p-5 transition-all duration-500 hover:border-red-500/40 hover:shadow-[0_16px_32px_-8px_rgba(220,38,38,0.1)]"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-red-50 rounded-bl-[40px] sm:rounded-bl-[60px] transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 text-red-500/20 group-hover:text-red-500/40 transition-colors">
              <MdSchool size={24} className="sm:w-[32px] sm:h-[32px]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                  <MdAutoStories size={14} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
                  Academic Term
                </div>
              </div>

              <Typography variant="h4" className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic group-hover:text-red-600 transition-colors">
                {sem.name}
              </Typography>
              
              <div className="flex items-center gap-3 mt-2 sm:mt-4">
                <div className="flex flex-col">
                  <Typography className="text-base sm:text-lg font-black text-slate-900 leading-tight">{sem.count}</Typography>
                  <Typography className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Labs</Typography>
                </div>
                <div className="w-px h-5 bg-slate-100" />
                <div className="flex flex-col">
                  <Typography className="text-base sm:text-lg font-black text-red-600 leading-tight">{sem.totalCredits}</Typography>
                  <Typography className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Credits</Typography>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-red-600">
                  <Typography className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Explore</Typography>
                  <MdChevronRight size={14} className="sm:w-[16px] sm:h-[16px] group-hover:translate-x-1 transition-transform" />
                </div>
                <IconButton className="bg-slate-50 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 p-1 sm:p-1.5">
                  <MdBookmark size={12} className="sm:w-[14px] sm:h-[14px]" />
                </IconButton>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </Box>
  );
};

export default SemesterGrid;
