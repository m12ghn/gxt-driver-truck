import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  getUsers,
  changeUserStatus,
} from "../api/userApi";

import UserDialog from "../components/UserDialog";
import UserTable from "../components/UserTable";
import UserToolbar from "../components/UserToolbar";
import { formatKhoLabel } from "../constants/warehouses";

export default function User() {

  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch {
      showMessage("Không tải được dữ liệu.", "error");
    }
  }

  function showMessage(message, severity = "success") {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }

  function handleAdd() {
    setSelectedUser(null);
    setOpenDialog(true);
  }

  function handleEdit(user) {
    setSelectedUser(user);
    setOpenDialog(true);
  }

  async function handleChangeStatus(id) {

    try {

      await changeUserStatus(id);

      showMessage("Cập nhật trạng thái thành công.");

      loadUsers();

    } catch (err) {

      showMessage(
        err.response?.data?.message || "Có lỗi xảy ra.",
        "error"
      );

    }

  }

  const filteredUsers = useMemo(() => {

    if (!keyword) return users;

    const key = keyword.toLowerCase();

    return users.filter((u) =>
      u.msnv?.toLowerCase().includes(key) ||
      u.hoTen?.toLowerCase().includes(key) ||
      u.soDienThoai?.toLowerCase().includes(key) ||
      formatKhoLabel(u.khoList || u.kho).toLowerCase().includes(key)
    );

  }, [users, keyword]);

  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >

        <Box sx={{ flexShrink: 0 }}>
          <UserToolbar
            keyword={keyword}
            setKeyword={setKeyword}
            onAdd={handleAdd}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <UserTable
            users={filteredUsers}
            onEdit={handleEdit}
            onChangeStatus={handleChangeStatus}
          />
        </Box>

      </Paper>

      <UserDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={loadUsers}
        user={selectedUser}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}