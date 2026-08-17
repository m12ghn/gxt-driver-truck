import { useState } from "react";
import { checkInAssignment } from "../api/assignmentApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

export default function CheckInDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const [odoCheckIn, setOdoCheckIn] = useState("");

  async function handleSave() {
    if (!odoCheckIn) {
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
          await checkInAssignment(assignment.id, {
            odoCheckIn: Number(odoCheckIn),
            checkInLatitude: position.coords.latitude,
            checkInLongitude: position.coords.longitude,
          });

          alert("Check In thành công!");

          setOdoCheckIn("");

          onSuccess();

          onClose();

        } catch (err) {
          console.error(err);

          alert(
            err.response?.data?.message ||
              "Check In thất bại!"
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
        Check In Hộ
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="ODO Check In"
              type="number"
              value={odoCheckIn}
              onChange={(e) =>
                setOdoCheckIn(e.target.value)
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
          CHECK IN HỘ
        </Button>

      </DialogActions>
    </Dialog>
  );
}