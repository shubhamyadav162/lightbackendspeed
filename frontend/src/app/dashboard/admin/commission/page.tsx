"use client";

import React from 'react';
import { useCommissionData } from '../../../../hooks/useApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Helper to format currency
const formatCurrency = (amountInPaisa: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amountInPaisa / 100);
};

export default function CommissionLedger() {
  const { data: ledgerEntries, isLoading, error } = useCommissionData();

  if (isLoading) return <div>Loading commission data...</div>;
  if (error) return <div>Error loading commission data: {error.message}</div>;

  // Calculate summary metrics
  const totalBalanceDue = ledgerEntries?.reduce((acc: number, entry: any) => {
      if (entry.wallet?.balance_due) {
          // This logic might need refinement based on the actual data structure
          // to avoid double counting balances. A better approach would be a separate API for summary.
          return acc + entry.wallet.balance_due;
      }
      return acc;
  }, 0);

  const totalCommissionRecorded = ledgerEntries?.filter((e: any) => e.type === 'COMMISSION').length;
  const totalPayouts = ledgerEntries?.filter((e: any) => e.type === 'COMMISSION_PAYOUT').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commission Ledger</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalanceDue || 0)}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commissions Recorded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommissionRecorded}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payouts Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayouts}</div>
            <p className="text-xs text-muted-foreground">Settlements made</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerEntries?.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {new Date(entry.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono">{entry.transaction_id}</TableCell>
                <TableCell>
                  <Badge variant={entry.type === 'COMMISSION' ? 'default' : 'secondary'}>
                    {entry.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(entry.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 