import { TextField } from "@mui/material";

/**
 * Consistent form field: proper label shrink, spacing, and readable borders.
 */
export default function FormField({ sx, ...props }) {
  return (
    <TextField
      variant="outlined"
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
        },
        ...sx,
      }}
      {...props}
    />
  );
}
