import { useState } from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("admin@ignito.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Paper elevation={0} className="w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-xl">
        <Box className="flex justify-center mb-6">
          <img src="/assets/logo.png" alt="Ignito Learn" className="h-12" />
        </Box>
        <Typography className="text-2xl font-black text-center text-slate-900 mb-1">
          Admin Console
        </Typography>
        <Typography className="text-sm text-slate-500 text-center mb-6">
          Sign in with Super Admin or Tenant Admin credentials
        </Typography>

        {error && <Alert severity="error" className="mb-4 rounded-xl">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2, py: 1.5, fontWeight: 800 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
