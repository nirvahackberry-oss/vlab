import React from 'react';
import { Box, Typography, Container, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { MdDashboard, MdLibraryBooks } from 'react-icons/md';
import Header from '../components/Header';
import LabGrid from '../components/LabGrid';
import { useLabStore } from '../store/labStore';

const Catalogue = ({ onMenuClick }) => {
  const { labs } = useLabStore();

  return (
    <Box className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      <Header title="Lab Catalogue" onMenuClick={onMenuClick} />

      <Box className="flex-1 overflow-y-auto overflow-x-hidden">
        <Container maxWidth="xl" className="py-8 space-y-8">
          {/* Breadcrumbs & Header */}
          <Box className="space-y-2">
            <Breadcrumbs className="text-slate-400">
              <MuiLink href="/" className="flex items-center gap-1 hover:text-red-600 transition-colors no-underline text-[11px] font-bold uppercase tracking-widest">
                <MdDashboard size={14} /> Dashboard
              </MuiLink>
              <Typography className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                Catalogue
              </Typography>
            </Breadcrumbs>

            <Box className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <Box>
                <Typography variant="h3" className="text-slate-900 font-black tracking-tighter">
                  Our Lab <span className="text-red-600">Catalogue</span>
                </Typography>
                <Typography className="text-slate-500 mt-2 text-lg max-w-2xl font-medium">
                  Explore our extensive collection of high-performance cloud laboratory environments designed for modern development and research.
                </Typography>
              </Box>
              <Box className="px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <MdLibraryBooks size={24} />
                </div>
                <div>
                  <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Offerings</Typography>
                  <Typography variant="h5" className="font-black text-slate-900">{labs.length} Labs</Typography>
                </div>
              </Box>
            </Box>
          </Box>

          {/* Categorized Catalogue Sections */}
          <Box className="mt-12 space-y-16 pb-12">
            {Object.entries(
              labs.reduce((acc, lab) => {
                const title = lab.title.toLowerCase();
                let category = 'Other Specialties';

                if (title.includes('python') || title.includes('java') || title.includes('c++') || title.includes('programming') || title.includes('development')) {
                  category = 'Programming Labs';
                } else if (title.includes('linux') || title.includes('administration') || title.includes('os') || title.includes('operating')) {
                  category = 'Linux & Operating Systems';
                } else if (title.includes('sql') || title.includes('dbms') || title.includes('database')) {
                  category = 'Database Systems';
                } else if (title.includes('web') || title.includes('react') || title.includes('html') || title.includes('frontend')) {
                  category = 'Web Technologies';
                }

                if (!acc[category]) acc[category] = [];
                acc[category].push(lab);
                return acc;
              }, {})
            )
              .sort(([catA], [catB]) => {
                const order = ['Programming Labs', 'Linux & Operating Systems', 'Database Systems', 'Web Technologies', 'Other Specialties'];
                return order.indexOf(catA) - order.indexOf(catB);
              })
              .map(([category, categoryLabs]) => (
                <Box key={category} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 bg-slate-900 rounded-lg">
                      <Typography className="text-white font-black text-xs uppercase tracking-[0.2em]">
                        {category}
                      </Typography>
                    </div>
                    <div className="flex-1 h-px bg-slate-200" />
                    <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {categoryLabs.length} {categoryLabs.length === 1 ? 'Environment' : 'Environments'}
                    </Typography>
                  </div>
                  <LabGrid labs={categoryLabs} readOnly={true} />
                </Box>
              ))}
          </Box>


        </Container>
      </Box>
    </Box>
  );
};

export default Catalogue;
