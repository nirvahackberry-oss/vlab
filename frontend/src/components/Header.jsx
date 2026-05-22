import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  InputAdornment,
  Menu,
  Button
} from '@mui/material';
import {
  MdMenu,
  MdArrowBack,
  MdSearch,
  MdLogout,
  MdSecurity,
  MdSupportAgent,
  MdNotificationsNone
} from 'react-icons/md';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useLabStore } from '../store/labStore';

const Header = ({ onMenuClick, title, onBack }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const logout = useAuthStore(state => state.logout);
  const { labs, subLabs } = useLabStore();

  // Combine all labs and sub-labs into one searchable list
  const ALL_SEARCH_DATA = React.useMemo(() => {
    const data = [];

    // Add Main Labs
    labs.forEach(lab => {
      data.push({ id: lab.id, type: 'Category', name: lab.title, path: `/admin/labs` });
    });

    // Add Sub Labs
    Object.values(subLabs || {}).forEach((subList) => {
      if (Array.isArray(subList)) {
        subList.forEach((sub) => {
          data.push({
            id: sub.id,
            type: 'Lab',
            name: sub.title,
            path: `/admin/labs/view/${sub.id}`,
          });
        });
      }
    });

    // Add Mock Users/Policies for now
    data.push({ id: 'u1', type: 'User', name: 'Meet Nayak', path: '/admin/users' });
    data.push({ id: 'p1', type: 'Policy', name: 'Global Admin Policy', path: '/admin/policies' });

    return data;
  }, [labs, subLabs]);

  React.useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = ALL_SEARCH_DATA.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 8)); // Limit to 8 results
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, ALL_SEARCH_DATA]);



  return (
    <Box
      component="header"
      className="sticky top-0 z-[100] px-4 md:px-8 py-3 bg-white border-b border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 max-w-[1700px] mx-auto">

        {/* Left Side: Brand & Title */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 overflow-hidden">
          <IconButton
            onClick={onMenuClick}
            className="md:hidden bg-slate-100/80 text-slate-600 hover:bg-slate-200 rounded-xl shrink-0"
            size="small"
          >
            <MdMenu size={20} />
          </IconButton>

          {onBack && (
            <IconButton
              onClick={onBack}
              className="bg-slate-100/80 text-slate-600 hover:bg-slate-200 rounded-xl shrink-0"
              size="small"
            >
              <MdArrowBack size={20} />
            </IconButton>
          )}
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <img src="/assets/logo-icon.png" alt="VL" className="h-7 w-7 object-contain lg:hidden shrink-0" />
            <Typography variant="h4" className="font-black text-slate-900 tracking-tighter flex items-baseline overflow-hidden">
              <span className="text-slate-900 truncate hidden sm:inline text-lg md:text-xl lg:text-2xl">
                Master of Computer Application
              </span>
              <span className="text-red-600 sm:text-red-600/80 text-xl sm:text-[0.45em] font-black sm:font-bold sm:ml-2 uppercase tracking-normal shrink-0">
                <span className="sm:hidden">MCA</span>
                <span className="hidden sm:inline">(MCA)</span>
              </span>
            </Typography>
          </div>
        </div>
        {/* Center/Right: Search & Actions */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* Modern Search */}
          <div className="relative hidden md:block">
            <TextField
              placeholder="Search something..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] xl:w-[320px]"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8fafc',
                  borderRadius: '16px',
                  height: '44px',
                  fontSize: '13px',
                  fontWeight: 600,
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'transparent' },
                  '&.Mui-focused': {
                    bgcolor: '#fff',
                    '& fieldset': { borderColor: '#dc2626', borderWidth: '1px' },
                    boxShadow: '0 4px 20px rgba(220,38,38,0.08)'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={20} className="text-slate-400" />
                  </InputAdornment>
                ),
              }}
            />
            {searchResults.length > 0 && (
              <Box className="absolute top-[120%] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000] py-2 animate-in fade-in slide-in-from-top-2">
                {searchResults.map(result => (
                  <Box
                    key={`${result.type}-${result.id}`}
                    className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group border-l-4 border-transparent hover:border-red-500"
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  >
                    <div>
                      <Typography className="text-[9px] font-black text-red-600 uppercase tracking-widest">{result.type}</Typography>
                      <Typography className="text-[13px] font-bold text-slate-800">{result.name}</Typography>
                    </div>
                    <MdArrowBack size={14} className="rotate-180 text-slate-300 group-hover:text-red-500 transition-colors" />
                  </Box>
                ))}
              </Box>
            )}
          </div>
          <IconButton className="text-slate-400 hover:text-red-600 transition-colors hidden sm:flex">
            <MdNotificationsNone size={24} />
          </IconButton>
          {/* User Welcome Style (Image 2 Replacement) */}
          <motion.div
            className="flex flex-col items-end pr-1 pointer-events-none"
          >
            <Typography variant="h6" className="font-bold text-slate-900 tracking-tight leading-none text-sm md:text-base">
              Welcome, <span className="text-red-600">Meet</span>
            </Typography>
          </motion.div>
        </div>
      </div>
    </Box>
  );
};

export default Header;
