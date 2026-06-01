import React, { useState } from 'react';
import { Tooltip, Fab, Badge } from '@mui/material';
import { MdChat, MdClose } from 'react-icons/md';
import Chatbot from './Chatbot';
const SupportFab = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <>
      <Tooltip title={isChatOpen ? "Close Support" : "Support Chat"} placement="left">
        <Fab
          onClick={() => setIsChatOpen(!isChatOpen)}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 32 },
            right: { xs: 16, sm: 32 },
            bgcolor: isChatOpen ? '#be2126' : '#111827',
            color: 'white',
            width: { xs: 52, sm: 64 },
            height: { xs: 52, sm: 64 },
            '&:hover': { bgcolor: isChatOpen ? '#a01c20' : '#1f2937', transform: 'scale(1.1) rotate(5deg)' },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 3000,
            boxShadow: '0 10px 40px -10px rgba(190,33,38,0.4)'
          }}
        >
          {isChatOpen ? (
            <MdClose size={28} />
          ) : (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              variant="dot"
              sx={{ '& .MuiBadge-badge': { bgcolor: '#22c55e', width: 12, height: 12, borderRadius: '50%', border: '2px solid #111827' } }}
            >
              <MdChat size={28} />
            </Badge>
          )}
        </Fab>
      </Tooltip>
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};
export default SupportFab;
