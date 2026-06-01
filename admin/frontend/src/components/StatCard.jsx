import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, accent = "red" }) {
  const palettes = {
    blue: { text: "text-blue-600", bg: "bg-blue-50" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50" },
    red: { text: "text-red-600", bg: "bg-red-50" },
    orange: { text: "text-orange-600", bg: "bg-orange-50" },
  };
  const palette = palettes[accent] || palettes.red;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between"
    >
      <div>
        <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </Typography>
        <Typography className="text-3xl font-black text-slate-900 mt-1">
          {value}
        </Typography>
        <Typography className="text-[10px] font-bold text-red-500 mt-1 uppercase">
          Live
        </Typography>
      </div>
      <Box className={`w-12 h-12 rounded-xl ${palette.bg} flex items-center justify-center`}>
        {Icon && <Icon size={24} className={palette.text} />}
      </Box>
    </motion.div>
  );
}
