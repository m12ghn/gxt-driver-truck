import { useEffect, useState } from "react";
import { confirmWarehouse } from "../api/assignmentApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

export default function WarehouseRejectDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const [warehouseReason, setWarehouseReason] = useState("");

  useEffect(() => {

    if (!open) return;

    setWarehouseReason("");

  }, [open]);

  async function handleSave() {

    if (!warehouseReason) {
      alert("Vui lòng nhập lý do không xác nhận.");
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    try {

      await confirmWarehouse(assignment.id, {
        action: "reject",
        warehouseConfirmBy: user?.hoTen || "",
        warehouseReason,
      });

      alert("Đã ghi nhận không xác nhận.");

      if (onSuccess) {
        onSuccess();
      }

      onClose();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
          "Thao tác thất bại!"
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
        Không xác nhận phân công
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Lý do không xác nhận"
              multiline
              rows={3}
              value={warehouseReason}
              onChange={(e) =>
                setWarehouseReason(e.target.value)
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
          color="error"
          onClick={handleSave}
        >
          XÁC NHẬN KHÔNG ĐỒNG Ý
        </Button>

      </DialogActions>
    </Dialog>
  );
}
