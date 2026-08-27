import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

const recordTotal = (record) =>
  Number(record.total == null ? record.amount : record.total) || 0;

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "");

export default function RecordList({ records = [], onEdit, onDelete }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [orderBy, setOrderBy] = useState("id");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (field) => {
    const isSameField = orderBy === field;
    setOrder(isSameField && order === "asc" ? "desc" : "asc");
    setOrderBy(field);
  };

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = records.filter((record) => {
      const recordDate = record.date
        ? new Date(record.date).toISOString().slice(0, 10)
        : "";
      const searchableText = [
        record.id,
        record.type,
        record.amount,
        record.quantity,
        record.quantity_unit,
        record.total == null ? record.amount : record.total,
        record.description,
        record.date,
        recordDate,
        record.date ? new Date(record.date).toLocaleDateString() : "",
      ]
        .join(" ")
        .toLowerCase();
      return (
        (typeFilter === "all" || record.type === typeFilter) &&
        (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
        (!fromDate || recordDate >= fromDate) &&
        (!toDate || recordDate <= toDate)
      );
    });

    return filtered.sort((left, right) => {
      const leftValue =
        orderBy === "date"
          ? new Date(left.date || 0).getTime()
          : orderBy === "total"
            ? left.total == null
              ? left.amount
              : left.total
            : left[orderBy];
      const rightValue =
        orderBy === "date"
          ? new Date(right.date || 0).getTime()
          : orderBy === "total"
            ? right.total == null
              ? right.amount
              : right.total
            : right[orderBy];
      if (typeof leftValue === "number" && typeof rightValue === "number")
        return (leftValue - rightValue) * (order === "asc" ? 1 : -1);
      return (
        String(leftValue ?? "").localeCompare(
          String(rightValue ?? ""),
          undefined,
          { numeric: true },
        ) * (order === "asc" ? 1 : -1)
      );
    });
  }, [records, typeFilter, search, fromDate, toDate, orderBy, order]);

  const visibleRecords = filteredRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const resetPage = () => setPage(0);
  const clearFilters = () => {
    setTypeFilter("all");
    setSearch("");
    setFromDate("");
    setToDate("");
    resetPage();
  };

  const handleExport = () => {
    const totals = records.reduce((result, record) => {
      result[record.type] = (result[record.type] || 0) + recordTotal(record);
      return result;
    }, {});
    const sellTotal = totals.sell || 0;
    const purchaseTotal = totals.purchase || 0;
    const otherExpensesTotal = totals.other_expenses || 0;
    const grossProfit = sellTotal - purchaseTotal;

    const recordRows = records.map((record, index) => ({
      "Sr No.": index + 1,
      Type: record.type === "other_expenses" ? "Other expenses" : record.type,
      Amount: Number(record.amount) || 0,
      Quantity: record.quantity == null ? "" : Number(record.quantity),
      "Quantity Unit": record.quantity_unit || "",
      Total: recordTotal(record),
      Description: record.description || "",
      Date: formatDate(record.date),
    }));
    const profitLossRows = [
      { Metric: "Sell items total", Amount: sellTotal },
      { Metric: "Purchase items total", Amount: purchaseTotal },
      { Metric: "Gross Profit", Amount: grossProfit },
      { Metric: "Other Expenses", Amount: otherExpensesTotal },
      { Metric: "Net Profit", Amount: grossProfit - otherExpensesTotal },
    ];

    const workbook = XLSX.utils.book_new();
    const recordsSheet = XLSX.utils.json_to_sheet(recordRows);
    const profitLossSheet = XLSX.utils.json_to_sheet(profitLossRows);
    recordsSheet["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 32 },
      { wch: 16 },
    ];
    profitLossSheet["!cols"] = [{ wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, recordsSheet, "Records");
    XLSX.utils.book_append_sheet(workbook, profitLossSheet, "P&L");
    XLSX.writeFile(
      workbook,
      `purchase-sell-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const sortableHeader = (label, field) => (
    <TableCell sortDirection={orderBy === field ? order : false}>
      <TableSortLabel
        active={orderBy === field}
        direction={orderBy === field ? order : "asc"}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <section className="records-section">
      <div className="section-heading">
        <div>
          <Typography variant="h2" component="h2" fontSize="1.25rem">
            Records
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Showing {filteredRecords.length} of {records.length}{" "}
            {records.length === 1 ? "entry" : "entries"}
          </Typography>
        </div>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
          disabled={records.length === 0}
        >
          Export Excel
        </Button>
      </div>
      <Accordion
        className="table-filters"
        defaultExpanded={false}
        disableGutters
        elevation={0}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={700}>Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="filter-row">
            <TextField
              label="Search records"
              placeholder="Description, amount, date..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              size="small"
              fullWidth
            />
            <FormControl size="small" className="type-filter">
              <InputLabel id="record-type-filter-label">Type</InputLabel>
              <Select
                labelId="record-type-filter-label"
                value={typeFilter}
                label="Type"
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  resetPage();
                }}
              >
                <MenuItem value="all">All types</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
                <MenuItem value="other_expenses">Other expenses</MenuItem>
              </Select>
            </FormControl>
            <Box className="date-filter">
              <Typography
                component="label"
                variant="caption"
                className="date-filter-label"
              >
                From
              </Typography>
              <TextField
                aria-label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  resetPage();
                }}
                size="small"
                fullWidth
              />
            </Box>
            <Box className="date-filter">
              <Typography
                component="label"
                variant="caption"
                className="date-filter-label"
              >
                To
              </Typography>
              <TextField
                aria-label="To date"
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  resetPage();
                }}
                size="small"
                fullWidth
              />
            </Box>
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>
      <TableContainer component={Paper} elevation={0}>
        <Table className="records-table" aria-label="Purchase and sell records">
          <TableHead>
            <TableRow>
              {sortableHeader("Sr No.", "id")}
              {sortableHeader("Type", "type")}
              {sortableHeader("Amount", "amount")}
              {sortableHeader("Quantity", "quantity")}
              {sortableHeader("Total", "total")}
              {sortableHeader("Description", "description")}
              {sortableHeader("Date", "date")}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRecords.map((r, index) => (
              <TableRow
                key={r.id}
                hover
                className={r.type === "sell" ? "sell-row" : ""}
              >
                <TableCell data-label="Sr No.">
                  {page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell data-label="Type">
                  <Chip
                    className={r.type === "sell" ? "sell-chip" : ""}
                    label={
                      r.type === "other_expenses" ? "Other expenses" : r.type
                    }
                    size="small"
                    color={r.type === "sell" ? "secondary" : "primary"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell data-label="Amount">{r.amount}</TableCell>
                <TableCell data-label="Quantity">
                  {r.quantity == null
                    ? "-"
                    : `${r.quantity} ${r.quantity_unit || "number"}`}
                </TableCell>
                <TableCell data-label="Total">
                  <strong>{r.total == null ? r.amount : r.total}</strong>
                </TableCell>
                <TableCell data-label="Description">
                  {r.description || "-"}
                </TableCell>
                <TableCell data-label="Date">
                  {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell data-label="Actions" align="right">
                  <IconButton
                    aria-label="Edit record"
                    onClick={() => onEdit(r)}
                    size="small"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Delete record"
                    onClick={() => onDelete(r.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRecords.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            No records match these filters.
          </Typography>
        )}
        <TablePagination
          component="div"
          count={filteredRecords.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            resetPage();
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows"
        />
      </TableContainer>
    </section>
  );
}
