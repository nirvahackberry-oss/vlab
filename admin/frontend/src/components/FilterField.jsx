import FormField from "./FormField";

export default function FilterField(props) {
  return (
    <FormField
      size="small"
      sx={{
        minWidth: 280,
        mb: 3,
        "& .MuiInputBase-root": { backgroundColor: "#fff" },
      }}
      InputLabelProps={{ shrink: true }}
      {...props}
    />
  );
}
