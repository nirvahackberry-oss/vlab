import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FormDialog from "../components/FormDialog";
import FormField from "../components/FormField";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  createRole,
  deleteRole,
  fetchRoles,
  updateRole,
} from "../services/adminApi";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchRoles()
      .then(setRoles)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ name: "", defaultCredits: 1000, description: "" });
    setDialog({ mode: "create" });
  };

  const openEdit = (role) => {
    setForm({
      name: role.name,
      defaultCredits: role.defaultCredits,
      description: role.description || "",
    });
    setDialog({ mode: "edit", role });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (dialog.mode === "create") {
        await createRole(form);
      } else {
        const body = { defaultCredits: Number(form.defaultCredits), description: form.description };
        if (!dialog.role.isSystem) body.name = form.name;
        await updateRole(dialog.role.id, body);
      }
      setDialog(null);
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
        title="Role management"
        subtitle="Configure default credits per role for new and bulk-created users"
        actionLabel="+ New role"
        onAction={openCreate}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <DataTable>
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Default credits</TableCell>
            <TableCell align="center">Users</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} hover>
              <TableCell sx={{ fontWeight: 800 }}>{role.name}</TableCell>
              <TableCell sx={{ color: "#64748b" }}>{role.description || "—"}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                {role.defaultCredits}
              </TableCell>
              <TableCell align="center">{role.userCount}</TableCell>
              <TableCell>
                <Chip
                  label={role.isSystem ? "System" : "Custom"}
                  size="small"
                  variant="outlined"
                  color={role.isSystem ? "default" : "primary"}
                />
              </TableCell>
              <TableCell align="right">
                <Button size="small" color="primary" onClick={() => openEdit(role)} sx={{ mr: 1 }}>
                  Edit
                </Button>
                {!role.isSystem && (
                  <Button size="small" color="error" onClick={() => setDeleteTarget(role)}>
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <FormDialog
        open={Boolean(dialog)}
        title={dialog?.mode === "create" ? "Create role" : "Edit role"}
        onClose={() => setDialog(null)}
        onSubmit={handleSave}
        loading={saving}
      >
        <FormField
          label="Role name"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={dialog?.mode === "edit" && dialog?.role?.isSystem}
          helperText={
            dialog?.role?.isSystem ? "System role names cannot be changed" : ""
          }
        />
        <FormField
          label="Default credits"
          type="number"
          value={form.defaultCredits ?? 1000}
          onChange={(e) => setForm({ ...form, defaultCredits: Number(e.target.value) })}
          helperText="Applied when creating users with this role (existing users unchanged)"
        />
        <FormField
          label="Description"
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete role"
        message={`Delete role "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await deleteRole(deleteTarget.id);
            setDeleteTarget(null);
            load();
          } catch (err) {
            setError(err.message);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
