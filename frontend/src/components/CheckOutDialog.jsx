import { useState } from "react";
import { checkOutAssignment } from "../api/assignmentApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

export default function CheckOutDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const [odoCheckOut, setOdoCheckOut] = useState("");

  async function handleSave() {
    if (!odoCheckOut) {
      alert("Vui lòng nhập ODO.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await checkOutAssignment(assignment.id, {
            odoCheckOut: Number(odoCheckOut),
            checkOutLatitude: position.coords.latitude,
            checkOutLongitude: position.coords.longitude,
          });

          alert("Check Out thành công!");

          setOdoCheckOut("");

          onSuccess();

          onClose();

        } catch (err) {
          console.error(err);

          alert(
            err.response?.data?.message ||
              "Check Out thất bại!"
          );
        }
      },
      () => {
        alert("Không lấy được vị trí GPS.");
      }
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Check Out
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary">
              ODO Check In: {assignment?.odoCheckIn ?? "-"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="ODO Check Out"
              type="number"
              value={odoCheckOut}
              onChange={(e) =>
                setOdoCheckOut(e.target.value)
              }
            />
          </Grid>

        </Grid>

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Hủy
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          CHECK OUT
        </Button>

      </DialogActions>
    </Dialog>
  );
}
