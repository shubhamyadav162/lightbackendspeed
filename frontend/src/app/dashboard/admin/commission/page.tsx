"use client";
import { useCommissionData } from "@/hooks/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CommissionLedger() {
  const { data, isLoading } = useCommissionData();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Commission Ledger</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount (₹)</TableHead>
            <TableHead>Balance Due (₹)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row: any) => (
            <TableRow key={row.entry_id}>
              <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
              <TableCell>{row.client_id}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{(row.amount / 100).toFixed(2)}</TableCell>
              <TableCell>{(row.balance_due / 100).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 