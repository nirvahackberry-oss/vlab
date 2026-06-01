import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import FormDialog from "../components/FormDialog";
import FormField from "../components/FormField";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  updateCourse,
} from "../services/adminApi";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchCourses()
      .then(setCourses)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ code: "", title: "", subtitle: "", description: "", status: "active" });
    setDialog({ mode: "create" });
  };

  const openEdit = (course) => {
    setForm({
      code: course.code,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      status: course.status,
    });
    setDialog({ mode: "edit", course });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog.mode === "create") {
        await createCourse(form);
      } else {
        await updateCourse(dialog.course.id, form);
      }
      setDialog(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
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
        title="Courses"
        subtitle="Academic programs (e.g. MCA)"
        actionLabel="+ New course"
        onAction={openCreate}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} lg={4} key={course.id}>
            <Paper
              elevation={0}
              className="p-5 rounded-2xl border border-slate-200 h-full flex flex-col"
            >
              <Chip label={course.code} size="small" color="primary" variant="outlined" className="w-fit font-black mb-2" />
              <Typography className="text-lg font-black text-slate-900">{course.title}</Typography>
              <Typography className="text-sm text-slate-500 mt-1 flex-1">
                {course.subtitle || course.description || "—"}
              </Typography>
              <div className="flex gap-4 mt-4 text-xs font-bold text-slate-500">
                <span>{course.semesterCount} semesters</span>
                <span>{course.labCount} labs</span>
                <span className="text-red-600">{course.totalCredits} credits</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <Button size="small" variant="outlined" color="primary" onClick={() => navigate(`/semesters?courseId=${course.id}`)}>
                  Semesters
                </Button>
                <Button size="small" color="primary" onClick={() => openEdit(course)}>
                  Edit
                </Button>
                <Button size="small" color="error" variant="outlined" onClick={() => setDeleteTarget(course)}>
                  Delete
                </Button>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <FormDialog
        open={Boolean(dialog)}
        title={dialog?.mode === "create" ? "Create course" : "Edit course"}
        onClose={() => setDialog(null)}
        onSubmit={handleSave}
        loading={saving}
      >
        <FormField label="Code" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <FormField label="Title" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <FormField label="Subtitle" value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <FormField label="Description" multiline rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <FormField select label="Status" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete course"
        message={`Delete "${deleteTarget?.title}"? All semesters must be removed first.`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
