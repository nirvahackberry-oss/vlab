import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FilterField from "../components/FilterField";
import FormDialog from "../components/FormDialog";
import FormField from "../components/FormField";
import {
  createSemester,
  deleteSemester,
  fetchCourses,
  fetchSemesters,
  updateSemester,
} from "../services/adminApi";

export default function Semesters() {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId") || "";

  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(courseIdParam);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([fetchSemesters(courseId || undefined), fetchCourses()])
      .then(([semList, courseList]) => {
        setSemesters(semList);
        setCourses(courseList);
      })
      .catch((err) => setError(err.message));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (courseIdParam) setCourseId(courseIdParam);
  }, [courseIdParam]);

  const openCreate = () => {
    setForm({
      courseId: courseId || courses[0]?.id || "",
      name: "",
      order: semesters.length + 1,
      status: "active",
    });
    setDialog({ mode: "create" });
  };

  const openEdit = (semester) => {
    setForm({
      courseId: semester.courseId,
      name: semester.name,
      order: semester.order,
      status: semester.status,
    });
    setDialog({ mode: "edit", semester });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog.mode === "create") {
        await createSemester(form);
      } else {
        await updateSemester(dialog.semester.id, form);
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
        title="Semesters"
        subtitle="Organize labs by academic term"
        actionLabel="+ New semester"
        onAction={openCreate}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <FilterField
        select
        label="Filter by course"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
      >
        <MenuItem value="">All courses</MenuItem>
        {courses.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.code} — {c.title}
          </MenuItem>
        ))}
      </FilterField>

      <DataTable>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Labs</TableCell>
            <TableCell align="right">Total credits</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {semesters.map((sem) => (
            <TableRow key={sem.id} hover>
              <TableCell>{sem.order}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{sem.name}</TableCell>
              <TableCell>{sem.labCount}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                {sem.totalCredits}
              </TableCell>
              <TableCell>{sem.status}</TableCell>
              <TableCell align="right">
                <Button size="small" color="primary" onClick={() => openEdit(sem)} sx={{ mr: 1 }}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => setDeleteTarget(sem)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <FormDialog
        open={Boolean(dialog)}
        title={dialog?.mode === "create" ? "Create semester" : "Edit semester"}
        onClose={() => setDialog(null)}
        onSubmit={handleSave}
        loading={saving}
      >
        <FormField select label="Course" value={form.courseId || ""} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.code} — {c.title}
            </MenuItem>
          ))}
        </FormField>
        <FormField label="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FormField label="Order" type="number" value={form.order ?? 1} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        <FormField select label="Status" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete semester"
        message={`Delete "${deleteTarget?.name}"? Remove all labs in this semester first.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await deleteSemester(deleteTarget.id);
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
