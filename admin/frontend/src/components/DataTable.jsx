import { Paper, Table, TableContainer } from "@mui/material";

export default function DataTable({ children, className = "" }) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      className={`rounded-2xl border border-slate-200 overflow-hidden ${className}`}
    >
      <Table size="small">{children}</Table>
    </TableContainer>
  );
}
