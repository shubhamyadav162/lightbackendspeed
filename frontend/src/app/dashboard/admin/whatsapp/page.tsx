"use client";
import { useState } from "react";
import { useWhatsAppLog } from "@/hooks/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function WhatsAppLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWhatsAppLog(page);

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">WhatsApp Notifications</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((n: any) => (
            <TableRow key={n.id}>
              <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
              <TableCell>{n.client_id}</TableCell>
              <TableCell>{n.template}</TableCell>
              <TableCell>{n.type}</TableCell>
              <TableCell>{n.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-4">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
} 