import React, { useMemo } from "react";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";

const recordTotal = (record) =>
  Number(record.total == null ? record.amount : record.total) || 0;

export default function ProfitLoss({ records = [] }) {
  const summary = useMemo(() => {
    const totals = records.reduce((result, record) => {
      result[record.type] = (result[record.type] || 0) + recordTotal(record);
      return result;
    }, {});
    const sellTotal = totals.sell || 0;
    const purchaseTotal = totals.purchase || 0;
    const otherExpensesTotal = totals.other_expenses || 0;
    const grossProfit = sellTotal - purchaseTotal;
    return {
      sellTotal,
      purchaseTotal,
      grossProfit,
      otherExpensesTotal,
      netProfit: grossProfit - otherExpensesTotal,
    };
  }, [records]);

  const cards = [
    {
      label: "Sell items total",
      value: summary.sellTotal,
      className: "profit-value",
    },
    {
      label: "Purchase items total",
      value: summary.purchaseTotal,
      className: "cost-value",
    },
    {
      label: "Gross Profit",
      value: summary.grossProfit,
      className: summary.grossProfit >= 0 ? "profit-value" : "loss-value",
    },
    {
      label: "Other Expenses",
      value: summary.otherExpensesTotal,
      className: "cost-value",
    },
    {
      label: "Net Profit",
      value: summary.netProfit,
      className: summary.netProfit >= 0 ? "profit-value" : "loss-value",
    },
  ];

  return (
    <section className="profit-loss-section">
      <div className="section-heading">
        <div>
          <Typography variant="h2" component="h2" fontSize="1.25rem">
            Profit &amp; Loss
          </Typography>
          <Typography color="text.secondary" variant="body2">
            A summary based on your recorded totals.
          </Typography>
        </div>
      </div>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid
            key={card.label}
            size={{ xs: 12, sm: 6, md: card.label === "Net Profit" ? 12 : 3 }}
          >
            <Card
              className={`summary-card ${card.label === "Net Profit" ? "net-profit-card" : ""}`}
              elevation={0}
            >
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {card.label}
                </Typography>
                <Typography
                  className={card.className}
                  variant="h2"
                  component="p"
                  fontSize="1.8rem"
                  sx={{ mt: 1 }}
                >
                  {card.value.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Stack className="calculation-note" spacing={0.5}>
        <Typography variant="body2">
          Gross Profit = Sell items total - Purchase items total
        </Typography>
        <Typography variant="body2">
          Net Profit = Gross Profit - Other Expenses
        </Typography>
      </Stack>
    </section>
  );
}
