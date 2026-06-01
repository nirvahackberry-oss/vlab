import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Drawer, IconButton } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
// Layout Components
import SidebarContent from './components/SidebarContent';
// Pages
import Dashboard from './pages/Dashboard';
import AdminLabs from './pages/AdminLabs';
import CreateMultipleUsers from './pages/CreateMultipleUsers';
import CreateUser from './pages/CreateUser';
import AllUsers from './pages/AllUsers';
import CreatePolicy from './pages/CreatePolicy';
import ViewLab from './pages/ViewLab';
import Login from './pages/Login';
import AddCredit from './pages/AddCredit';
// Compute Pages (Lightsail Clone)
import Instances from './pages/compute/Instances';
import CreateInstance from './pages/compute/CreateInstance';
import Terminal from './pages/compute/Terminal';
import CloudEditor from './pages/compute/Editor';
import RemoteDesktop from './pages/compute/RemoteDesktop';
import Catalogue from './pages/Catalogue';
import { useAuthStore } from './store/authStore';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="flex-1 h-full min-h-0 overflow-hidden flex flex-col"
  >
    {children}
  </motion.div>
);

function AuthenticatedApp({ isSidebarOpen, isCollapsed, toggleSidebar, setIsSidebarOpen }) {
  const location = useLocation();
  const isRemoteDesktopRoute = location.pathname === '/admin/compute/rdp';

  if (isRemoteDesktopRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/admin/compute/rdp" element={<RemoteDesktop onMenuClick={toggleSidebar} />} />
          <Route path="*" element={<Navigate to="/admin/compute/rdp" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <Box className="h-screen flex bg-ignito-bg font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <motion.div 
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:block flex-shrink-0 border-r border-slate-200 overflow-hidden"
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </motion.div>

      {/* Sidebar - Mobile */}
      <Drawer
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 280, bgcolor: 'var(--color-ignito-sidebar)', border: 'none' },
        }}>
        <Box className="relative h-full">
          <SidebarContent />
          <IconButton
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-5 -right-14 bg-white hover:bg-gray-100 shadow-xl">
            <div className="text-ignito-maroon flex items-center">
              <MdClose size={22} />
            </div>
          </IconButton>
        </Box>
      </Drawer>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Dashboard onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/labs" element={<PageWrapper><AdminLabs onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/users/bulk" element={<PageWrapper><CreateMultipleUsers onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/users/new" element={<PageWrapper><CreateUser onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/users" element={<PageWrapper><AllUsers onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/policies/new" element={<PageWrapper><CreatePolicy onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/labs/view/:id" element={<PageWrapper><ViewLab onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/catalogue" element={<PageWrapper><Catalogue onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/add-credit" element={<PageWrapper><AddCredit onMenuClick={toggleSidebar} /></PageWrapper>} />
          
          {/* Compute Routes - Hidden for now */}
          {/* <Route path="/admin/compute" element={<Navigate to="/admin/compute/instances" replace />} />
          <Route path="/admin/compute/instances" element={<PageWrapper><Instances onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/compute/new" element={<PageWrapper><CreateInstance onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/compute/terminals" element={<PageWrapper><Terminal onMenuClick={toggleSidebar} /></PageWrapper>} />
          <Route path="/admin/compute/ide" element={<PageWrapper><CloudEditor onMenuClick={toggleSidebar} /></PageWrapper>} /> */}
          
          {/* Redirect hidden compute routes to dashboard */}
          <Route path="/admin/compute/*" element={<Navigate to="/" replace />} />

          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const toggleSidebar = () => {
    if (window.innerWidth < 900) {
      setIsSidebarOpen(true);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }
  return (
    <BrowserRouter>
      <AuthenticatedApp
        isSidebarOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </BrowserRouter>
  );
}
