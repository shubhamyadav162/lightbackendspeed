import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// TODO: Replace with real data from useWhatsAppLog hook
const demoLogData = [
  { id: 'wa_1', client_id: 'client_A', template: 'LOW_BALANCE', type: 'Alert', status: 'sent', sent_at: '2023-10-26T12:00:00Z', error: null },
  { id: 'wa_2', client_id: 'client_B', template: 'TXN_UPDATE', type: 'Notification', status: 'sent', sent_at: '2023-10-26T12:01:00Z', error: null },
  { id: 'wa_3', client_id: 'client_A', template: 'TXN_UPDATE', type: 'Notification', status: 'failed', sent_at: null, error: 'Invalid phone number' },
  { id: 'wa_4', client_id: 'client_C', template: 'LOW_BALANCE', type: 'Alert', status: 'queued', sent_at: null, error: null },
];

const StatusPill = ({ status }: { status: string }) => {
  const styles = {
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    queued: 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export function WhatsAppLog() {
  // const { data: logs, isLoading, error } = useWhatsAppLog(); // Future implementation

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Notification Logs</CardTitle>
        <CardDescription>Audit log of all outbound WhatsApp messages.</CardDescription>
        <div className="mt-4 flex space-x-2">
            <Input placeholder="Filter by Client ID..." className="max-w-xs" />
            <Button variant="outline">Filter</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoLogData.map(log => (
              <TableRow key={log.id}>
                <TableCell>{log.client_id}</TableCell>
                <TableCell>{log.template}</TableCell>
                <TableCell><StatusPill status={log.status} /></TableCell>
                <TableCell className="text-red-600">{log.error || 'None'}</TableCell>
                <TableCell>{log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                  {log.status === 'failed' && (
                    <Button variant="secondary" size="sm">Resend</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 