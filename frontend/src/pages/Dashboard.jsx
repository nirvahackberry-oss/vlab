import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Alert, IconButton, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { MdTrendingUp, MdArrowBack, MdLayers, MdSchool } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import LabGrid from '../components/LabGrid';
import SemesterGrid from '../components/SemesterGrid';
import SupportFab from '../components/SupportFab';

import { useLabStore } from '../store/labStore';

export default function Dashboard({ onMenuClick }) {
  const { labs, isLoading, error, loadLabs } = useLabStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sem = params.get('semester');
    setSelectedSemester(sem);
  }, [location.search]);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const semesters = useMemo(() => {
    const safeLabs = labs || [];
    const groups = safeLabs.reduce((acc, lab) => {
      const sem = lab.semester || 'Other';
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(lab);
      return acc;
    }, {});

    return Object.keys(groups).sort().map(name => ({
      name,
      count: groups[name].length,
      totalCredits: groups[name].reduce((sum, lab) => sum + (lab.credits || 0), 0),
      labs: groups[name]
    }));
  }, [labs]);

  const filteredLabs = useMemo(() => {
    const safeLabs = labs || [];
    if (!selectedSemester) return [];
    return safeLabs.filter(lab => (lab.semester || 'Other') === selectedSemester);
  }, [labs, selectedSemester]);

  const stats = useMemo(() => {
    const safeLabs = labs || [];
    const totalCredits = safeLabs.reduce((sum, lab) => sum + (lab.credits || 0), 0);
    const totalSemesters = new Set(safeLabs.map(lab => lab.semester || 'Other')).size;
    const totalLabs = safeLabs.length;
    const activeLabs = safeLabs.filter(l => l.status !== 'inactive').length;

    return [
      { 
        label: 'Total Credit', 
        value: totalCredits, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        icon: MdLayers
      },
      { 
        label: 'Total Semester', 
        value: totalSemesters, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50',
        icon: MdSchool
      },
      { 
        label: 'Total Labs', 
        value: totalLabs, 
        color: 'text-red-600', 
        bg: 'bg-red-50',
        icon: MdTrendingUp
      },
      { 
        label: 'Active Labs', 
        value: activeLabs, 
        color: 'text-orange-600', 
        bg: 'bg-orange-50',
        icon: MdTrendingUp
      }
    ];
  }, [labs]);

  const handleSemesterClick = (name) => {
    navigate(`/?semester=${encodeURIComponent(name)}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box className="flex-1 flex flex-col min-w-0 bg-slate-50 app-shell h-full overflow-hidden">
      <Header onMenuClick={onMenuClick} title="Infrastructure Dashboard" />

      <Box component="main" className="flex-1 p-2 sm:p-4 overflow-auto">
        <Box className="max-w-[1700px] mx-auto space-y-2 sm:space-y-4">
          {error && (
            <Alert severity="warning" className="rounded-lg py-0.5 px-1.5">
              <Typography className="text-[9px]">{error}.</Typography>
            </Alert>
          )}

          {/* Enhanced Premium Stats Row */}
          {!selectedSemester && (
            <div className="px-1">
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              > 
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                    className="relative overflow-hidden bg-white/90 backdrop-blur-xl p-6 flex items-center justify-between gap-4 group transition-all duration-300 border border-slate-200 rounded-3xl shadow-sm min-h-[120px]"
                  >
                    <div className="relative z-10 flex-1 min-w-0">
                      <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">
                        {stat.label}
                      </Typography>
                      <div className="flex items-baseline gap-2">
                        <Typography className={"text-3xl sm:text-4xl font-black tracking-tight " + stat.color}>
                          {isLoading ? "..." : stat.value}
                        </Typography>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live</span>
                      </div>
                    </div>

                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shrink-0 ${stat.bg} border border-white/50 shadow-md`}>
                       <stat.icon size={28} className={stat.color} />
                    </div>
                    
                    {/* Subtle Background Decoration */}
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-30 ${stat.bg}`} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Labs Hub Section */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-1">
               <div className="flex items-center gap-4">
                  {/* Empty space or removed content */}
               </div>


            </div>

            <div className="mt-1">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSemester || 'all'}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LabGrid 
                      labs={selectedSemester ? filteredLabs : labs} 
                      onLabClick={() => {}} 
                    />
                  </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </Box>
      </Box>

      <SupportFab />
    </Box>
  );
}
