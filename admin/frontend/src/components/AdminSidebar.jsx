import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdLayers,
  MdScience,
  MdAccountBalanceWallet,
  MdReceiptLong,
  MdAdminPanelSettings,
  MdLogout,
} from "react-icons/md";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: MdDashboard },
  { label: "Users", path: "/users", icon: MdPeople },
  { label: "Roles", path: "/roles", icon: MdAdminPanelSettings },
  { label: "Courses", path: "/courses", icon: MdSchool },
  { label: "Semesters", path: "/semesters", icon: MdLayers },
  { label: "Labs", path: "/labs", icon: MdScience },
  { label: "Credits", path: "/credits", icon: MdAccountBalanceWallet },
  { label: "Transactions", path: "/transactions", icon: MdReceiptLong },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <Box className="h-full flex flex-col bg-white border-r border-slate-200 w-[260px] md:w-[280px]">
      <Box className="py-2 px-3 flex justify-center">
        <img src="/assets/logo.png" alt="Ignito Learn" className="w-[160px] h-auto" />
      </Box>

      <List dense className="flex-1 px-2 py-1 custom-scrollbar overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                className={`rounded-lg py-1 ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
                sx={{
                  borderLeft: `3px solid ${isActive ? "#dc2626" : "transparent"}`,
                }}
              >
                <ListItemIcon className="min-w-[32px]">
                  <Icon size={18} className={isActive ? "text-red-600" : "text-slate-400"} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    className: `text-[13px] font-bold ${isActive ? "text-red-600" : ""}`,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box className="p-2 border-t border-slate-100">
        <Box className="flex items-center gap-2 mb-2">
          <Avatar className="bg-red-600 text-white font-bold w-8 h-8 text-sm">{initials}</Avatar>
          <Box className="min-w-0">
            <Typography className="text-sm font-bold truncate">{user?.name}</Typography>
            <Typography className="text-[10px] font-black text-red-600 uppercase tracking-wider">
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <ListItemButton onClick={logout} className="rounded-xl text-slate-500">
          <ListItemIcon className="min-w-[36px]">
            <MdLogout size={20} />
          </ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ className: "text-sm font-semibold" }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}
