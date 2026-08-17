import { useEffect, useState } from "react";
import { adminCheckOutAssignment } from "../api/assignmentApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

export default function AdminCheckoutDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const [odoCheckOut, setOdoCheckOut] = useState("");
  const [checkOutBy, setCheckOutBy] = useState("");
  const [adminCheckoutReason, setAdminCheckoutReason] = useState("");

  useEffect(() => {

    if (!open) return;

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    setOdoCheckOut("");
    setCheckOutBy(user?.hoTen || "");
    setAdminCheckoutReason("");

  }, [open]);

  async function handleSave() {

    if (!odoCheckOut) {
      alert("Vui lòng nhập ODO.");
      return;
    }

    if (!checkOutBy || !adminCheckoutReason) {
      alert("Vui lòng nhập người thực hiện và lý do Check Out hộ.");
      return;
    }

    try {

      await adminCheckOutAssignment(assignment.id, {
        odoCheckOut: Number(odoCheckOut),
        checkOutBy,
        adminCheckoutReason,
      });

      alert("Admin Check Out hộ thành công!");

      if (onSuccess) {
        onSuccess();
      }

      onClose();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
          "Check Out hộ thất bại!"
      );

    }

  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Admin Check Out hộ
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

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

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Người thực hiện"
              value={checkOutBy}
              onChange={(e) =>
                setCheckOutBy(e.target.value)
              }
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Lý do Check Out hộ"
              multiline
              rows={3}
              value={adminCheckoutReason}
              onChange={(e) =>
                setAdminCheckoutReason(e.target.value)
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
          color="warning"
          onClick={handleSave}
        >
          XÁC NHẬN CHECK OUT HỘ
        </Button>

      </DialogActions>
    </Dialog>
  );
}
