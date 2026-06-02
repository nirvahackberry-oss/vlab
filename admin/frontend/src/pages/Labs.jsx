import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { MdAccessTime } from "react-icons/md";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterField from "../components/FilterField";
import FormDialog from "../components/FormDialog";
import FormField from "../components/FormField";
import {
  createLab,
  deleteLab,
  fetchLabs,
  fetchSemesters,
  updateLab,
} from "../services/adminApi";

const emptyLabForm = () => ({
  semesterId: "",
  title: "",
  subtitle: "",
  description: "",
  logo: "",
  durationMinutes: 90,
  credits: 30,
  complexity: "Beginner",
  category: "Programming",
  status: "ready",
  taskDefinition: "",
});

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyLabForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetchLabs({ semesterId: semesterFilter || undefined }),
      fetchSemesters(),
    ])
      .then(([labList, semList]) => {
        setLabs(labList);
        setSemesters(semList);
      })
      .catch((err) => setError(err.message));
  }, [semesterFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({
      ...emptyLabForm(),
      semesterId: semesterFilter || semesters[0]?.id || "",
    });
    setDialog({ mode: "create" });
  };

  const openEdit = (lab) => {
    setForm({
      semesterId: lab.semesterId,
      title: lab.title,
      subtitle: lab.subtitle,
      description: lab.description,
      logo: lab.logo,
      durationMinutes: lab.durationMinutes,
      credits: lab.credits,
      complexity: lab.complexity,
      category: lab.category,
      status: lab.status,
      taskDefinition: lab.taskDefinition,
    });
    setDialog({ mode: "edit", lab });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog.mode === "create") {
        await createLab(form);
      } else {
        await updateLab(dialog.lab.id, form);
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
        title="Labs"
        subtitle="Manage lab catalog by semester"
        actionLabel="+ New lab"
        onAction={openCreate}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <FilterField
        select
        label="Filter by semester"
        value={semesterFilter}
        onChange={(e) => setSemesterFilter(e.target.value)}
      >
        <MenuItem value="">All semesters</MenuItem>
        {semesters.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </FilterField>

      <Grid container spacing={3}>
        {labs.map((lab) => (
          <Grid item xs={12} sm={6} lg={4} key={lab.id}>
            <Paper elevation={0} className="p-5 rounded-2xl border border-slate-200 flex flex-col h-full">
              <Box className="w-16 h-16 mx-auto bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
                {lab.logo ? (
                  <img src={lab.logo} alt="" className="w-10 h-10 object-contain" />
                ) : (
                  <Typography className="text-2xl font-black text-red-600">L</Typography>
                )}
              </Box>
              <Typography className="text-center font-black text-slate-900">{lab.title}</Typography>
              <Typography className="text-center text-xs text-slate-500 mt-1">
                {lab.semesterName} · {lab.courseCode}
              </Typography>
              <div className="flex justify-center gap-2 mt-3">
                <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1 text-slate-600">
                  <MdAccessTime size={12} /> {lab.durationMinutes}m
                </span>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full">
                  {lab.credits} credits
                </span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <Button size="small" fullWidth color="primary" onClick={() => openEdit(lab)}>
                  Edit
                </Button>
                <Button size="small" color="error" variant="outlined" onClick={() => setDeleteTarget(lab)}>
                  Delete
                </Button>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <FormDialog
        open={Boolean(dialog)}
        title={dialog?.mode === "create" ? "Create lab" : "Edit lab"}
        onClose={() => setDialog(null)}
        onSubmit={handleSave}
        loading={saving}
        maxWidth="md"
      >
        <FormField
          select
          label="Semester"
          value={form.semesterId}
          onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
        >
          {semesters.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </FormField>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 2,
          }}
        >
          <FormField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <FormField label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <FormField
            label="Duration (min)"
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
          <FormField
            label="Credits"
            type="number"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
          />
        </Box>

        <FormField label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
        <FormField label="Task definition" value={form.taskDefinition} onChange={(e) => setForm({ ...form, taskDefinition: e.target.value })} />
        <FormField
          label="Description"
          multiline
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete lab"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await deleteLab(deleteTarget.id);
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
