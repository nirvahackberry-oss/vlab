import { useState } from "react";
import { Box, Drawer, IconButton } from "@mui/material";
import { MdClose } from "react-icons/md";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

const TITLES = {
  "/": "Platform Dashboard",
  "/users": "User Management",
  "/roles": "Role Management",
  "/courses": "Course Management",
  "/semesters": "Semester Management",
  "/labs": "Lab Management",
  "/credits": "Credit Management",
  "/transactions": "Transaction Management",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title =
    Object.entries(TITLES).find(([path]) =>
      path === "/" ? location.pathname === "/" : location.pathname.startsWith(path),
    )?.[1] || "Admin Panel";

  return (
    <Box className="h-screen flex bg-slate-50 overflow-hidden">
      <Box className="hidden md:block flex-shrink-0">
        <AdminSidebar />
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: 280 } }}
      >
        <Box className="relative h-full">
          <AdminSidebar />
          <IconButton
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 bg-white shadow"
          >
            <MdClose />
          </IconButton>
        </Box>
      </Drawer>

      <Box className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" className="flex-1 overflow-auto p-3 md:p-4">
          <Box className="max-w-[1700px] mx-auto">
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
