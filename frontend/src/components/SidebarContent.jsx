import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdExpandMore, MdLayers, MdSchool, MdLogout } from 'react-icons/md';
import { motion } from 'framer-motion';
import { SIDEBAR_ITEMS } from '../constants/sidebar';
import { useLabStore } from '../store/labStore';
import { useAuthStore } from '../store/authStore';

const SidebarContent = ({ isCollapsed = false }) => {
  const [expandedItems, setExpandedItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { labs } = useLabStore();
  const logout = useAuthStore(state => state.logout);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Get unique semesters from labs
  const semesters = React.useMemo(() => {
    // Start with default 4 semesters
    const defaultSems = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'];
    const semsFromLabs = labs.map(l => l.semester).filter(Boolean);
    const combined = [...new Set([...defaultSems, ...semsFromLabs])];
    return combined.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [labs]);

  const toggleExpand = (label) => {
    setExpandedItems(prev => (prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]));
  };

  const wrapperClasses =
    'h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ' +
    (isCollapsed ? 'w-[70px] md:w-[82px]' : 'w-[260px] md:w-[290px]');

  const searchParams = new URLSearchParams(location.search);
  const activeSemester = searchParams.get('semester');

  return (
    <Box className={wrapperClasses}
      sx={{ background: "rgba(255, 255, 255, 0.95)" }}
    >
      <Box className="px-2 py-1 flex items-center gap-3 justify-between">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 w-full">
          <Box className={isCollapsed ? "w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100" : "w-full h-auto flex items-center justify-center p-2"}>
            <img
              src={isCollapsed ? "/assets/logo-icon.png" : "/assets/logo.png"}
              alt="logo"
              className={isCollapsed ? "w-7 h-7 object-contain" : "w-[200px] h-auto object-contain"}
            />
          </Box>

        </motion.div>
      </Box>

      <List className="flex-1 mt-4 overflow-y-auto px-3 pb-20 custom-scrollbar space-y-1">
        {/* Static Items from Constants */}
        {SIDEBAR_ITEMS.map((item, idx) => {
          const isActive = item.path ? (item.path === '/' ? (location.pathname === '/' && !activeSemester) : location.pathname.startsWith(item.path)) : false;
          const isExpanded = expandedItems.includes(item.label);

          const itemClass =
            'rounded-[14px] px-4 py-2.5 transition-all duration-300 relative overflow-hidden group ' +
            (isActive ? 'bg-red-50 border border-red-100 text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent') +
            (isCollapsed ? ' justify-center px-1' : '');

          return (
            <Box key={idx} className="group/item relative mb-1.5">
              <ListItem disablePadding>
                <ListItemButton
                  title={isCollapsed ? item.label : ''}
                  onClick={() => {
                    if (item.hasSub) {
                      toggleExpand(item.label);
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={itemClass}
                  sx={{
                    borderLeft: `3px solid ${isActive ? '#dc2626' : 'transparent'}`,
                  }}
                >
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-50 pointer-events-none" />}

                  <ListItemIcon sx={{ color: isActive ? '#dc2626' : 'inherit', minWidth: isCollapsed ? 0 : 38, transition: 'color 0.3s ease' }} className="group-hover:text-red-500">
                    {item.icon && (() => { const Icon = item.icon; return <Icon size={22} />; })()}
                  </ListItemIcon>

                  {!isCollapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ className: 'text-[13px] font-bold tracking-wide transition-colors ' + (isActive ? 'text-red-700' : 'text-slate-500 group-hover:text-slate-900') }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Box>
          );
        })}

        {/* Dynamic Courses Section */}
        {!isCollapsed && (
          <Box className="mt-6 mb-2 px-4">
             <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Courses</Typography>
          </Box>
        )}

        {/* Example: MCA Grouping */}
        {(() => {
          // In a real app, you'd group labs by lab.course
          // For now, we'll put all semesters under "MCA" as requested
          const courseLabel = "MCA (Master in computer application)";
          const isCourseExpanded = expandedItems.includes(courseLabel);
          
          return (
            <Box className="group/item relative mb-1.5">
               <ListItem disablePadding>
                <ListItemButton
                  onClick={() => toggleExpand(courseLabel)}
                  className={'rounded-[14px] px-4 py-2.5 transition-all duration-300 ' + (isCourseExpanded ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50') + (isCollapsed ? ' justify-center px-1' : '')}
                >
                  <ListItemIcon sx={{ color: isCourseExpanded ? '#dc2626' : 'inherit', minWidth: isCollapsed ? 0 : 38 }}>
                    <MdSchool size={20} />
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary="MCA"
                      primaryTypographyProps={{ className: 'text-[13px] font-bold tracking-wide transition-colors ' + (isCourseExpanded ? 'text-red-700' : 'text-slate-500 group-hover:text-slate-900') }}
                    />
                  )}
                  {!isCollapsed && (
                    <Box
                      className={(isCourseExpanded ? 'text-red-600 ' : 'text-slate-500 ') + 'transition-all duration-300'}
                      sx={{ transform: isCourseExpanded ? 'rotate(180deg)' : 'none', display: 'flex', alignItems: 'center' }}
                    >
                      <MdExpandMore size={18} />
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>

              <Collapse in={!isCollapsed && isCourseExpanded} timeout={300} unmountOnExit>
                <Box className="pl-10 pr-2 py-1 space-y-1 relative before:absolute before:left-[24px] before:top-0 before:bottom-2 before:w-[1.5px] before:bg-slate-100 before:rounded-full">
                  {semesters.map((sem, sIdx) => {
                    const isActive = activeSemester === sem;
                    return (
                      <ListItemButton
                        key={`sem-${sIdx}`}
                        onClick={() => navigate(`/?semester=${encodeURIComponent(sem)}`)}
                        className={'py-1.5 px-3 rounded-[10px] relative transition-all duration-200 ' + (isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-500 hover:text-red-600')}
                      >
                        {isActive && <div className="absolute left-[-17px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-600 shadow-sm" />}
                        <ListItemText 
                          primary={sem} 
                          primaryTypographyProps={{ 
                            className: 'text-[11px] font-semibold tracking-wide ' + (isActive ? 'text-red-600' : 'text-slate-500')
                          }} 
                        />
                      </ListItemButton>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })()}
      </List>

      <Box className="p-4 border-t border-slate-100 bg-white/40 backdrop-blur-sm">
        <motion.div
          whileHover={{ x: 5 }}
          onClick={handleClick}
          className="flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 hover:bg-white/60 cursor-pointer group"
        >
          <div className="relative">
            <Avatar className="w-11 h-11 bg-gradient-to-tr from-red-600 to-red-400 text-white font-black border-2 border-white shadow-md transition-transform duration-500 group-hover:rotate-[360deg]">
              MN
            </Avatar>
            <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
          </div>

          {!isCollapsed && (
            <Box className="flex-1 min-w-0">
              <Typography className="text-[14px] font-black text-slate-900 leading-tight truncate">Meet Nayak</Typography>
              <Box className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-red-500 opacity-50" />
                <Typography className="text-[10px] text-red-600 font-black uppercase tracking-[0.15em]">Administrator</Typography>
              </Box>
            </Box>
          )}
        </motion.div>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          elevation: 0,
          className: 'mb-4 w-[240px] rounded-[28px] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50',
          sx: { bgcolor: '#fff' },
        }}
      >
        <div className="p-8 text-center bg-slate-50/50">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 bg-gradient-to-tr from-red-600 to-red-500 mx-auto border-4 border-white shadow-xl text-3xl font-black text-white">
              MN
            </Avatar>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-md" />
          </div>
          <Typography variant="h6" className="font-black text-slate-900 mb-1 tracking-tight">
            Meet Nayak
          </Typography>
          <Typography className="text-red-600 font-black text-[10px] uppercase tracking-[0.2em]">
            Super Administrator
          </Typography>
        </div>
        
        <div className="p-6 space-y-3">
          <Button
            fullWidth
            variant="contained"
            onClick={logout}
            startIcon={<MdLogout size={20} />}
            className="!bg-red-600 hover:!bg-red-700 !text-white !rounded-2xl !py-3.5 !normal-case !font-black !text-sm !shadow-xl !shadow-red-600/20 !transition-all"
          >
            Logout Session
          </Button>
        </div>
      </Menu>
    </Box>
  );
};

export default SidebarContent;
