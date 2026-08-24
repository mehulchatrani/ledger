import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

export default function RecordForm({ onSubmit, editing, onUpdate }) {
  const [type, setType] = useState("purchase");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("number");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setQuantity(editing.quantity == null ? "" : String(editing.quantity));
      setQuantityUnit(editing.quantity_unit || "number");
      setDescription(editing.description || "");
    }
  }, [editing]);

  const reset = () => {
    setType("purchase");
    setAmount("");
    setQuantity("");
    setQuantityUnit("number");
    setDescription("");
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    setFormError("");
    const rec = {
      type,
      amount: parsedAmount,
      quantity: type === "other_expenses" ? null : parseFloat(quantity),
      quantityUnit: type === "other_expenses" ? null : quantityUnit,
      description,
    };
    if (editing && editing.id) onUpdate(editing.id, rec);
    else onSubmit(rec);
    reset();
  };

  const total =
    type === "other_expenses"
      ? parseFloat(amount)
      : parseFloat(amount) * parseFloat(quantity);

  const handleTotalChange = (event) => {
    const nextTotal = parseFloat(event.target.value);
    if (!Number.isFinite(nextTotal)) return setAmount("");
    const parsedQuantity = parseFloat(quantity);
    if (type === "other_expenses") setAmount(String(nextTotal));
    else if (parsedQuantity > 0) setAmount(String(nextTotal / parsedQuantity));
    else
      setFormError("Enter a quantity greater than zero before changing total.");
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      className="record-form"
      elevation={0}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h2" component="h2" fontSize="1.25rem">
            {editing ? "Update entry" : "New entry"}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Add a transaction to your ledger.
          </Typography>
        </Box>
        {formError && <Alert severity="error">{formError}</Alert>}
        <Box className="form-grid">
          <FormControl fullWidth>
            <InputLabel id="record-type-label">Type</InputLabel>
            <Select
              labelId="record-type-label"
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="sell">Sell</MenuItem>
              <MenuItem value="other_expenses">Other expenses</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            type="number"
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            fullWidth
          />
          {type !== "other_expenses" && (
            <Box className="quantity-field">
              <TextField
                label="Quantity"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: "any" } }}
                value={Number.isFinite(parseFloat(quantity)) ? quantity : ""}
                onChange={(e) => setQuantity(e.target.value)}
                required
                fullWidth
              />
              <ToggleButtonGroup
                value={quantityUnit}
                exclusive
                onChange={(_, value) => value && setQuantityUnit(value)}
                size="small"
                aria-label="Quantity unit"
              >
                <ToggleButton value="number" aria-label="Number">
                  No.
                </ToggleButton>
                <ToggleButton value="kg" aria-label="Kilograms">
                  Kg
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
          {type !== "other_expenses" && (
            <TextField
              label="Total"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: "any" } }}
              value={Number.isFinite(total) ? total : ""}
              onChange={handleTotalChange}
              required
              fullWidth
            />
          )}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
        </Box>
        <Box className="form-footer">
          <Typography className="total-display">
            Total <strong>{Number.isFinite(total) ? total : "-"}</strong>
          </Typography>
          <Button variant="contained" color="primary" type="submit">
            {editing ? "Update entry" : "Add entry"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
