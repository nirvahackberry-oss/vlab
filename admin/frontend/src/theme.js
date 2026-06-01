import { createTheme } from "@mui/material/styles";

const red = {
  main: "#dc2626",
  dark: "#b91c1c",
  light: "#ef4444",
  contrastText: "#ffffff",
};

export const adminTheme = createTheme({
  palette: {
    primary: red,
    secondary: {
      main: "#64748b",
    },
    error: {
      main: "#dc2626",
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif',
    h6: { fontWeight: 800 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 10,
        },
        sizeSmall: {
          padding: "3px 10px",
          fontSize: "0.75rem",
          minHeight: 28,
        },
        containedPrimary: {
          boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeSmall: {
          padding: 6,
        },
      },
    },
    MuiTable: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          fontSize: "1.15rem",
          paddingBottom: 8,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        margin: "normal",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#f8fafc",
          "&.Mui-focused": {
            backgroundColor: "#fff",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          backgroundColor: "transparent",
        },
        outlined: {
          "&.MuiInputLabel-shrink": {
            transform: "translate(14px, -9px) scale(0.85)",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: red.main,
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: red.main,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "6px 12px",
          lineHeight: 1.35,
        },
        head: {
          fontWeight: 800,
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#64748b",
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "6px 12px",
        },
        body: {
          fontSize: "0.8125rem",
          color: "#0f172a",
          borderBottom: "1px solid #f1f5f9",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          paddingTop: 6,
          paddingBottom: 6,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 32,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          height: 22,
          fontSize: "0.7rem",
        },
      },
    },
  },
});
