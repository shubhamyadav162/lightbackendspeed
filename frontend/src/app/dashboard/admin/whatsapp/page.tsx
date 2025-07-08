"use client";

import React, { useState } from 'react';
import { useWhatsAppLog } from '../../../../hooks/useApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function WhatsAppLog() {
  const [page, setPage] = useState(1);
  const { data: logs, isLoading, error } = useWhatsAppLog(page);

  if (isLoading) return <div>Loading WhatsApp logs...</div>;
  if (error) return <div>Error loading logs: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WhatsApp Notification Logs</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!logs || logs.length < 50} // Assuming page size is 50
          >
            Next
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono">{log.client_id}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.template}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-red-500">{log.error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 