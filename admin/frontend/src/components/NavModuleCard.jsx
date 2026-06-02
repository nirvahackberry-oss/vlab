import { Box, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MdChevronRight } from "react-icons/md";

export default function NavModuleCard({
  label,
  description,
  value,
  subValue,
  icon: Icon,
  path,
  accent = "red",
}) {
  const navigate = useNavigate();

  const accents = {
    red: { bg: "bg-red-50", text: "text-red-600", ring: "hover:border-red-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "hover:border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "hover:border-emerald-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", ring: "hover:border-orange-200" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", ring: "hover:border-violet-200" },
    slate: { bg: "bg-slate-100", text: "text-slate-600", ring: "hover:border-slate-300" },
  };
  const palette = accents[accent] || accents.red;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Paper
        onClick={() => navigate(path)}
        className={`p-5 rounded-2xl border border-slate-100 cursor-pointer transition-all ${palette.ring} hover:shadow-lg`}
        elevation={0}
      >
        <div className="flex items-start justify-between gap-3">
          <Box className={`w-12 h-12 rounded-xl ${palette.bg} flex items-center justify-center shrink-0`}>
            {Icon && <Icon size={26} className={palette.text} />}
          </Box>
          <MdChevronRight size={22} className="text-slate-300 mt-1" />
        </div>
        <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">
          {label}
        </Typography>
        <Typography className="text-3xl font-black text-slate-900 mt-1">{value}</Typography>
        {subValue && (
          <Typography className="text-xs font-semibold text-red-500 mt-1">{subValue}</Typography>
        )}
        <Typography className="text-sm text-slate-500 mt-2 leading-snug">{description}</Typography>
      </Paper>
    </motion.div>
  );
}
