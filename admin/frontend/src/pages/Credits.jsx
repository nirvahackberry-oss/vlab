import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { adjustUserCredits, fetchLabs, fetchUsers } from "../services/adminApi";

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box className="pt-4">{children}</Box>;
}

export default function Credits() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState("");
  const [creditDialog, setCreditDialog] = useState(null);
  const [form, setForm] = useState({ amount: 100, reason: "Admin top-up" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([fetchUsers(), fetchLabs()])
      .then(([userList, labList]) => {
        setUsers(userList);
        setLabs(labList);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalUserCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const totalLabCredits = labs.reduce((sum, l) => sum + (l.credits || 0), 0);

  const handleCreditSave = async () => {
    setSaving(true);
    try {
      await adjustUserCredits(creditDialog.user.id, {
        amount: Number(form.amount),
        reason: form.reason,
      });
      setCreditDialog(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Credits"
        subtitle="User wallet balances and lab credit pricing"
        actionLabel="View transactions"
        onAction={() => navigate("/transactions")}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Box className="p-4 rounded-2xl bg-white border border-slate-200">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Total user credits
          </Typography>
          <Typography className="text-3xl font-black text-slate-900">{totalUserCredits}</Typography>
          <Typography className="text-xs text-slate-500 mt-1">{users.length} users</Typography>
        </Box>
        <Box className="p-4 rounded-2xl bg-white border border-slate-200">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Total lab credit cost
          </Typography>
          <Typography className="text-3xl font-black text-red-600">{totalLabCredits}</Typography>
          <Typography className="text-xs text-slate-500 mt-1">{labs.length} labs</Typography>
        </Box>
      </div>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="User wallets" sx={{ fontWeight: 700, textTransform: "none" }} />
        <Tab label="Lab credits" sx={{ fontWeight: 700, textTransform: "none" }} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <DataTable>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Wallet balance</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" color="default" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                  {user.credits ?? 0}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setForm({ amount: 100, reason: "Admin top-up" });
                      setCreditDialog({ user });
                    }}
                  >
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <DataTable>
          <TableHead>
            <TableRow>
              <TableCell>Lab</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="right">Credit cost</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labs.map((lab) => (
              <TableRow key={lab.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{lab.title}</TableCell>
                <TableCell>{lab.semesterName || "—"}</TableCell>
                <TableCell>{lab.courseCode || "—"}</TableCell>
                <TableCell>{lab.durationMinutes}m</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                  {lab.credits}
                </TableCell>
                <TableCell>
                  <Chip
                    label={lab.status}
                    size="small"
                    color={lab.status === "ready" ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </TabPanel>

      <Dialog
        open={Boolean(creditDialog)}
        onClose={() => setCreditDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Adjust credits — {creditDialog?.user?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <Typography className="text-sm text-slate-500 mb-2">
            Current balance:{" "}
            <strong className="text-red-600">{creditDialog?.user?.credits ?? 0}</strong>
          </Typography>
          <FormField
            label="Amount (+ add / − deduct)"
            type="number"
            value={form.amount ?? ""}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <FormField
            label="Reason"
            value={form.reason || ""}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreditDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreditSave} disabled={saving}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
