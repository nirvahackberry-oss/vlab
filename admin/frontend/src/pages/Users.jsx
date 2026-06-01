import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FormDialog from "../components/FormDialog";
import FormField from "../components/FormField";
import ConfirmDialog from "../components/ConfirmDialog";
import BulkImportDialog from "../components/BulkImportDialog";
import { useAuthStore } from "../store/authStore";
import {
  adjustUserCredits,
  createUser,
  deleteUser,
  fetchCourses,
  fetchRoles,
  fetchSemesters,
  fetchUsers,
  updateUser,
} from "../services/adminApi";

export default function Users() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [creditDialog, setCreditDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([fetchUsers(), fetchRoles(), fetchCourses()])
      .then(([userList, roleList, courseList]) => {
        setUsers(userList);
        setRoles(roleList);
        setCourses(courseList);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadSemestersForCourse = async (courseId) => {
    if (!courseId) {
      setSemesters([]);
      return;
    }
    const list = await fetchSemesters(courseId);
    setSemesters(list);
  };

  const applyRoleDefaults = (roleName) => {
    const role = roles.find((r) => r.name === roleName);
    return role?.defaultCredits ?? 1000;
  };

  const openCreate = () => {
    const defaultRole = roles.find((r) => r.name === "Student")?.name || "Tenant User";
    setForm({
      name: "",
      email: "",
      password: "",
      role: defaultRole,
      credits: applyRoleDefaults(defaultRole),
      enabled: true,
      courseId: "",
      semesterIds: [],
    });
    setSemesters([]);
    setDialog({ mode: "create" });
  };

  const openEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      enabled: user.enabled,
      password: "",
      courseId: user.courseId || "",
      semesterIds: user.semesterIds || [],
    });
    loadSemestersForCourse(user.courseId || "");
    setDialog({ mode: "edit", user });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        courseId: form.courseId || null,
        semesterIds: form.semesterIds || [],
      };
      if (dialog.mode === "create") {
        await createUser(body);
      } else {
        if (!body.password) delete body.password;
        await updateUser(dialog.user.id, body);
      }
      setDialog(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
        title="Users"
        subtitle="Manage accounts, roles, course enrollment, and credits"
        actionLabel="+ New user"
        onAction={openCreate}
      >
        <Button variant="outlined" color="primary" onClick={() => setBulkOpen(true)}>
          Bulk import
        </Button>
      </PageHeader>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <DataTable>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Course</TableCell>
            <TableCell>Semesters</TableCell>
            <TableCell align="right">Credits</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell sx={{ fontWeight: 700 }}>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip label={user.role} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{user.courseCode || "—"}</TableCell>
              <TableCell sx={{ maxWidth: 180 }}>
                <Typography className="text-xs text-slate-600 truncate">
                  {user.semesterNames?.length
                    ? user.semesterNames.join(", ")
                    : "—"}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                {user.credits}
              </TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Button size="small" color="primary" onClick={() => openEdit(user)} sx={{ mr: 0.25, minWidth: 0, px: 1 }}>
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setForm({ amount: 100, reason: "Admin top-up" });
                    setCreditDialog({ user });
                  }}
                  sx={{ mr: 0.25, minWidth: 0, px: 1 }}
                >
                  Credits
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={currentUser?.id === user.id}
                  onClick={() => setDeleteTarget(user)}
                  sx={{ minWidth: 0, px: 1 }}
                  title={
                    currentUser?.id === user.id
                      ? "You cannot delete your own account"
                      : "Delete user"
                  }
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <FormDialog
        open={Boolean(dialog)}
        title={dialog?.mode === "create" ? "Create user" : "Edit user"}
        onClose={() => setDialog(null)}
        onSubmit={handleSave}
        loading={saving}
        maxWidth="md"
      >
        <FormField
          label="Name"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <FormField
          label="Email"
          type="email"
          value={form.email || ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <FormField
          label="Password"
          type="password"
          value={form.password || ""}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          helperText={dialog?.mode === "edit" ? "Leave blank to keep current password" : ""}
        />
        <FormField
          select
          label="Role"
          value={form.role || ""}
          onChange={(e) => {
            const role = e.target.value;
            setForm({
              ...form,
              role,
              credits:
                dialog?.mode === "create" ? applyRoleDefaults(role) : form.credits,
            });
          }}
        >
          {roles.map((r) => (
            <MenuItem key={r.id} value={r.name}>
              {r.name} — {r.defaultCredits} default credits
            </MenuItem>
          ))}
        </FormField>

        {dialog?.mode === "create" && (
          <FormField
            label="Initial credits"
            type="number"
            value={form.credits ?? 1000}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
            helperText="Pre-filled from role default; you can override"
          />
        )}

        <Divider sx={{ my: 1 }} />
        <Typography className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
          Course & semester enrollment
        </Typography>

        <FormField
          select
          label="Course"
          value={form.courseId || ""}
          onChange={(e) => {
            const courseId = e.target.value;
            setForm({ ...form, courseId, semesterIds: [] });
            loadSemestersForCourse(courseId);
          }}
        >
          <MenuItem value="">No course assigned</MenuItem>
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.code} — {c.title}
            </MenuItem>
          ))}
        </FormField>

        {form.courseId && (
          <FormField
            select
            label="Semesters"
            value={form.semesterIds || []}
            onChange={(e) =>
              setForm({
                ...form,
                semesterIds:
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value,
              })
            }
            SelectProps={{ multiple: true }}
            helperText="Select one or more semesters for this user"
          >
            {semesters.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </FormField>
        )}

        {dialog?.mode === "edit" && (
          <FormControlLabel
            sx={{ mt: 1, ml: 0.5 }}
            control={
              <Switch
                color="primary"
                checked={Boolean(form.enabled)}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
            }
            label={
              <Typography className="text-sm font-semibold text-slate-700">
                Account enabled
              </Typography>
            }
          />
        )}
      </FormDialog>

      <FormDialog
        open={Boolean(creditDialog)}
        title={`Adjust credits — ${creditDialog?.user?.name || ""}`}
        onClose={() => setCreditDialog(null)}
        onSubmit={handleCreditSave}
        submitLabel="Apply"
        loading={saving}
        maxWidth="xs"
      >
        <Typography className="text-sm text-slate-500 mb-1">
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
      </FormDialog>

      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onComplete={() => load()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Permanently delete "${deleteTarget?.name}" (${deleteTarget?.email})? This cannot be undone.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSaving(true);
          setError("");
          try {
            await deleteUser(deleteTarget.id);
            setDeleteTarget(null);
            load();
          } catch (err) {
            setError(err.message);
            setDeleteTarget(null);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
