import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onClose,
  onConfirm,
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="font-black">{title}</DialogTitle>
      <DialogContent>
        <Typography className="text-slate-600 text-sm">{message}</Typography>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
