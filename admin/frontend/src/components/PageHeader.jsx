import { Box, Button, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, actionLabel, onAction, children }) {
  return (
    <Box className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
      <div>
        <Typography className="text-2xl font-black text-slate-900">{title}</Typography>
        {subtitle && (
          <Typography className="text-sm text-slate-500 mt-1">{subtitle}</Typography>
        )}
      </div>
      {(children || actionLabel) && (
        <Box className="flex flex-wrap gap-2 justify-end">
          {children}
          {actionLabel && onAction && (
            <Button variant="contained" color="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
