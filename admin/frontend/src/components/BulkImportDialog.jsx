import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Typography,
} from "@mui/material";
import { MdDownload, MdUploadFile } from "react-icons/md";
import FormField from "./FormField";
import {
  bulkUploadUsers,
  downloadBulkUserTemplate,
  fetchRoles,
} from "../services/adminApi";

export default function BulkImportDialog({ open, onClose, onComplete }) {
  const fileRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [defaultRole, setDefaultRole] = useState("Student");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleOpen = () => {
    setResult(null);
    setError("");
    setFile(null);
    fetchRoles()
      .then((roleList) => {
        setRoles(roleList);
        setDefaultRole(
          roleList.find((r) => r.name === "Student")?.name ||
            roleList[0]?.name ||
            "Student",
        );
      })
      .catch((err) => setError(err.message));
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await bulkUploadUsers(file, { defaultRole });
      setResult(res);
      onComplete?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Bulk import students</DialogTitle>
      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <Typography className="text-sm text-slate-600 mb-3">
          Upload an Excel file (.xlsx) with up to <strong>500 students</strong> per batch.
          Required columns: <strong>Name</strong>, <strong>Email</strong>. Optional: Password,
          Role, Course, Semesters (set per row in the sheet).
        </Typography>

        <Button
          startIcon={<MdDownload />}
          variant="outlined"
          color="primary"
          onClick={() => downloadBulkUserTemplate().catch((e) => setError(e.message))}
          sx={{ mb: 2 }}
        >
          Download template
        </Button>

        <FormField
          select
          label="Default role (if row has no role column)"
          value={defaultRole}
          onChange={(e) => setDefaultRole(e.target.value)}
        >
          {roles.map((r) => (
            <MenuItem key={r.id} value={r.name}>
              {r.name} ({r.defaultCredits} credits)
            </MenuItem>
          ))}
        </FormField>

        <Box
          className="mt-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <MdUploadFile size={32} className="mx-auto text-slate-400 mb-2" />
          <Typography className="text-sm font-semibold text-slate-700">
            {file ? file.name : "Click to choose Excel file"}
          </Typography>
        </Box>

        {loading && <LinearProgress color="primary" className="mt-4" />}

        {error && (
          <Alert severity="error" className="mt-3">
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity={result.created > 0 ? "success" : "warning"} className="mt-3">
            Created <strong>{result.created}</strong> of {result.total} users.
            {result.skipped > 0 && ` Skipped ${result.skipped}.`}
            {result.errors?.length > 0 && (
              <Box component="ul" className="mt-2 text-xs pl-4 max-h-32 overflow-auto">
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    Row {err.row} ({err.email}): {err.message}
                  </li>
                ))}
                {result.errors.length > 10 && (
                  <li>…and {result.errors.length - 10} more</li>
                )}
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          {result ? "Close" : "Cancel"}
        </Button>
        {!result && (
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={loading}>
            {loading ? "Importing…" : "Import students"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
