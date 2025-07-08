import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';

// TODO: Replace with real data from useCommissionData hook
const demoLedgerData = {
  summary: { total_due: 1523050, clients_in_debt: 5, total_paid_out: 8500000 },
  entries: [
    { id: 'entry_1', client_name: 'Gaming Co', type: 'COMMISSION', amount: 350, created_at: '2023-10-26T10:00:00Z', transaction_id: 'txn_1' },
    { id: 'entry_2', client_name: 'E-commerce Inc', type: 'COMMISSION', amount: 700, created_at: '2023-10-26T10:05:00Z', transaction_id: 'txn_2' },
    { id: 'entry_3', client_name: 'Gaming Co', type: 'COMMISSION_PAYOUT', amount: -100000, created_at: '2023-10-25T18:00:00Z', transaction_id: null },
    { id: 'entry_4', client_name: 'SaaS App', type: 'COMMISSION', amount: 120, created_at: '2023-10-26T10:10:00Z', transaction_id: 'txn_3' },
  ],
};

export function CommissionLedger() {
  // const { data: ledgerData, isLoading, error } = useCommissionData(); // Future implementation

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Commission Overview</CardTitle>
          <CardDescription>Summary of all commission earned and paid out.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Commission Due</p>
              <p className="text-2xl font-bold">{formatCurrency(demoLedgerData.summary.total_due)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Paid Out</p>
              <p className="text-2xl font-bold">{formatCurrency(demoLedgerData.summary.total_paid_out)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Clients with Dues</p>
              <p className="text-2xl font-bold">{demoLedgerData.summary.clients_in_debt}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commission Ledger</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoLedgerData.entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.client_name}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 text-xs rounded-full ${
                       entry.type === 'COMMISSION' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                     }`}>
                      {entry.type}
                    </span>
                  </TableCell>
                  <TableCell className={entry.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell>{entry.transaction_id || 'N/A'}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 