import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Avatar, 
  InputBase,
  Grow
} from '@mui/material';
import { MdClose, MdSend, MdSupportAgent, MdMoreVert } from 'react-icons/md';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I assist you with your virtual labs today?", sender: 'bot', timestamp: '12:00 PM' }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "I'm processing your request. One of our engineers will be with you shortly if I can't resolve it!",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <Box className="fixed bottom-24 right-3 sm:bottom-32 sm:right-8 z-[2000] w-[calc(100vw-24px)] sm:w-80 md:w-96 font-sans">
      <Grow in={isOpen}>
        <Paper 
          elevation={24} 
          className="rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col h-[480px] md:h-[550px] border border-white bg-white/95 backdrop-blur-xl shadow-[0_50px_100px_-20px_rgba(190,33,38,0.2)]"
        >
          {/* Chat Header */}
          <Box className="bg-[#be2126] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar sx={{ bgcolor: 'white', color: '#be2126', width: 50, height: 50, fontWeight: 'bold' }}>
                    <MdSupportAgent size={30} />
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-[#be2126] rounded-full" />
                </div>
                <div>
                  <Typography variant="subtitle1" className="font-black leading-none mb-1">Support Agent</Typography>
                  <Typography variant="caption" className="opacity-80 font-bold uppercase tracking-widest text-[10px]">Active Now</Typography>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <IconButton size="small" className="text-white/80"><MdMoreVert /></IconButton>
                <IconButton size="small" onClick={onClose} className="text-white hover:bg-white/10">
                  <MdClose size={24} />
                </IconButton>
              </div>
            </div>
          </Box>

          {/* Chat Messages */}
          <Box className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#be2126] text-white rounded-tr-none font-medium' 
                      : 'bg-white text-gray-800 rounded-tl-none font-medium border border-gray-100'
                  }`}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography variant="caption" className={`text-[9px] mt-1 block opacity-60 text-right`}>
                    {msg.timestamp}
                  </Typography>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Chat Input */}
          <Box className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2 pr-1">
              <InputBase
                fullWidth
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="px-3"
                sx={{ fontSize: '0.85rem', fontWeight: 500 }}
              />
              <IconButton 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`transition-all duration-300 ${inputText.trim() ? 'bg-[#be2126] text-white' : 'text-gray-300'}`}
                sx={{ borderRadius: '14px', width: 40, height: 40 }}
              >
                <MdSend size={20} />
              </IconButton>
            </div>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
};

export default Chatbot;
