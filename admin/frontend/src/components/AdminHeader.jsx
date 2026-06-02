import { Box, IconButton, TextField, Typography, InputAdornment } from "@mui/material";
import { MdMenu, MdNotificationsNone, MdSearch } from "react-icons/md";
import { useAuthStore } from "../store/authStore";

export default function AdminHeader({ title, onMenuClick }) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] || "Admin";

  return (
    <Box
      component="header"
      className="sticky top-0 z-50 px-3 md:px-6 py-1.5 bg-white border-b border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 max-w-[1700px] mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton
            onClick={onMenuClick}
            className="md:hidden bg-slate-100 text-slate-600 rounded-xl"
            size="small"
          >
            <MdMenu size={20} />
          </IconButton>
          <Typography className="font-black text-slate-900 truncate text-lg md:text-xl">
            <span className="hidden sm:inline">{title}</span>
            <span className="text-red-600 sm:ml-2">Admin</span>
          </Typography>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <TextField
            placeholder="Search something..."
            size="small"
            className="hidden md:block w-[200px] xl:w-[260px]"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f8fafc",
                borderRadius: "10px",
                height: 36,
                fontSize: 12,
                fontWeight: 600,
                "& fieldset": { borderColor: "transparent" },
                "&.Mui-focused fieldset": { borderColor: "#dc2626" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch className="text-slate-400" size={18} />
                </InputAdornment>
              ),
            }}
          />
          <IconButton className="text-slate-400 hidden sm:flex" size="small">
            <MdNotificationsNone size={20} />
          </IconButton>
          <Typography className="font-bold text-xs md:text-sm text-slate-900 whitespace-nowrap">
            Welcome, <span className="text-red-600">{firstName}</span>
          </Typography>
        </div>
      </div>
    </Box>
  );
}
