import {
  Chip,
  IconButton,
  Stack,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import { DataGrid } from "@mui/x-data-grid";

export default function UserTable({
  users,
  onEdit,
  onChangeStatus,
}) {

  const columns = [
    {
      field: "msnv",
      headerName: "MSNV",
      width: 120,
    },
    {
      field: "hoTen",
      headerName: "Họ tên",
      flex: 1,
    },
    {
      field: "soDienThoai",
      headerName: "Số điện thoại",
      width: 150,
    },
    {
      field: "kho",
      headerName: "Kho phụ trách",
      width: 140,
      valueGetter: (value, row) =>
        row.quyen === "WAREHOUSE" ? row.kho || "—" : "—",
    },
    {
      field: "quyen",
      headerName: "Quyền",
      width: 150,

      renderCell: (params) => {

        const color = {
          ADMIN: "error",
          WAREHOUSE: "warning",
          DRIVER: "success",
        };

        return (
          <Chip
            label={params.value}
            color={color[params.value]}
            size="small"
          />
        );

      },
    },
    {
      field: "trangThai",
      headerName: "Trạng thái",
      width: 150,

      renderCell: (params) => {

        const active =
          params.value === "Hoạt động";

        return (
          <Chip
            label={params.value}
            color={active ? "success" : "default"}
            size="small"
          />
        );

      },
    },
    {
      field: "action",
      headerName: "Thao tác",
      width: 150,
      sortable: false,

      renderCell: (params) => {

        // DRIVER chỉ quản lý ở màn Driver
        if (params.row.quyen === "DRIVER") {
          return (
            <Chip
              label="Quản lý tại Driver"
              color="info"
              size="small"
            />
          );
        }

        return (
          <Stack direction="row" spacing={1}>

            <IconButton
              color="primary"
              onClick={() => onEdit(params.row)}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              color={
                params.row.trangThai === "Hoạt động"
                  ? "error"
                  : "success"
              }
              onClick={() => {

                const text =
                  params.row.trangThai === "Hoạt động"
                    ? "Bạn có muốn khóa tài khoản này?"
                    : "Bạn có muốn mở khóa tài khoản này?";

                if (window.confirm(text)) {
                  onChangeStatus(params.row.id);
                }

              }}
            >
              {params.row.trangThai === "Hoạt động"
                ? <LockIcon />
                : <LockOpenIcon />}
            </IconButton>

          </Stack>
        );

      },
    },
  ];

  return (
    <DataGrid
      rows={users}
      columns={columns}
      autoHeight
      pageSizeOptions={[10, 20, 50]}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 10,
          },
        },
      }}
    />
  );

}