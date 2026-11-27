import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import { buildImageUrl } from "../utils/imageUrl";
import { flagOdoMismatch } from "../api/assignmentApi";

export default function OdoPhotoCompare({
  assignment,
  side,
  odo,
  aiReading,
  photos,
  mismatch,
  canFlag,
  onUpdated,
}) {
  const photo = photos?.manOdo;
  const url = buildImageUrl(photo);

  async function handleToggle() {
    try {
      const res = await flagOdoMismatch(assignment.id, {
        side,
        mismatch: !mismatch,
      });
      onUpdated?.(res.data?.data || { ...assignment, ...(side === "checkin"
        ? { odoCheckInMismatch: !mismatch }
        : { odoCheckOutMismatch: !mismatch }) });
    } catch (err) {
      alert(err.response?.data?.message || "Không gắn cờ được.");
    }
  }

  return (
    <Box
      sx={{
        mt: 2,
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: mismatch ? "error.light" : "divider",
        bgcolor: mismatch ? "rgba(211,47,47,0.06)" : "action.hover",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={700}>
          Đối chiếu ODO với ảnh đồng hồ
        </Typography>
        {mismatch && (
          <Chip size="small" color="error" label="ODO lệch ảnh" />
        )}
        {!mismatch && aiReading != null && (
          <Chip size="small" color="success" label="Khớp ảnh" />
        )}
      </Stack>

      <Grid container spacing={1.5} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Số tài nhập
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {odo ?? "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Đọc từ ảnh: <b>{aiReading ?? "-"}</b>
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          {url ? (
            <Box
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block" }}
            >
              <Box
                component="img"
                src={url}
                alt="Màn hình ODO"
                sx={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "contain",
                  borderRadius: 1.5,
                  bgcolor: "#111",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Chưa có ảnh màn hình ODO.
            </Typography>
          )}
        </Grid>
      </Grid>

      {canFlag && (
        <Button
          size="small"
          color={mismatch ? "inherit" : "error"}
          sx={{ mt: 1.25 }}
          onClick={handleToggle}
        >
          {mismatch ? "Bỏ cờ lệch ảnh" : "Gắn cờ ODO lệch ảnh"}
        </Button>
      )}
    </Box>
  );
}
