import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FilterField from "../components/FilterField";
import { fetchCreditTransactions, fetchUsers } from "../services/adminApi";

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchUsers(),
      fetchCreditTransactions({ userId: userId || undefined, limit: 200 }),
    ])
      .then(([userList, txList]) => {
        setUsers(userList);
        setTransactions(txList);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Audit all credit adjustments across users"
        actionLabel="Manage wallets"
        onAction={() => navigate("/credits")}
      />

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Box className="p-4 rounded-2xl bg-white border border-slate-200">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Total records
          </Typography>
          <Typography className="text-3xl font-black text-slate-900">
            {loading ? "—" : transactions.length}
          </Typography>
        </Box>
        <Box className="p-4 rounded-2xl bg-white border border-slate-200">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Credits added
          </Typography>
          <Typography className="text-3xl font-black text-emerald-600">
            {loading ? "—" : `+${totalIn}`}
          </Typography>
        </Box>
        <Box className="p-4 rounded-2xl bg-white border border-slate-200">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Credits deducted
          </Typography>
          <Typography className="text-3xl font-black text-red-600">
            {loading ? "—" : `−${totalOut}`}
          </Typography>
        </Box>
      </div>

      <FilterField
        select
        label="Filter by user"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      >
        <MenuItem value="">All users</MenuItem>
        {users.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.name} ({u.email})
          </MenuItem>
        ))}
      </FilterField>

      <DataTable>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Balance after</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography className="text-slate-500 text-sm">Loading transactions…</Typography>
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography className="text-slate-500 text-sm">
                  No transactions yet. Adjust credits from the{" "}
                  <button
                    type="button"
                    className="text-red-600 font-bold underline"
                    onClick={() => navigate("/credits")}
                  >
                    Credits
                  </button>{" "}
                  page.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id} hover>
                <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{tx.userEmail}</TableCell>
                <TableCell>
                  <Chip
                    label={tx.type === "credit" ? "Credit" : "Debit"}
                    size="small"
                    color={tx.amount >= 0 ? "success" : "error"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    color: tx.amount >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {tx.balanceAfter}
                </TableCell>
                <TableCell>{tx.reason}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
