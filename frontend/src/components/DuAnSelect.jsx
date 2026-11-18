import { TextField, MenuItem } from "@mui/material";
import { DU_AN_GXT, DU_AN_VUNG_HCM } from "../constants/projects";
import { canOpenGxt, canOpenHcm } from "../utils/userScope";

export default function DuAnSelect({ value, onChange, user, sx }) {
  if (!canOpenGxt(user) || !canOpenHcm(user)) return null;

  return (
    <TextField
      select
      size="small"
      label="Dự án"
      value={value}
      onChange={onChange}
      sx={{ minWidth: 160, ...sx }}
    >
      <MenuItem value={DU_AN_GXT}>GXT</MenuItem>
      <MenuItem value={DU_AN_VUNG_HCM}>Vùng HCM</MenuItem>
    </TextField>
  );
}
