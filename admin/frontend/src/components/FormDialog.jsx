import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

export default function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  maxWidth = "sm",
  children,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Saving…" : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
