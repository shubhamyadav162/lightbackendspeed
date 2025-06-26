import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  row_id: string;
  user_id: string;
  created_at: string;
  old_data: any;
  new_data: any;
  ip_address?: string;
  user_agent?: string;
}

export const AuditLogsViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedTable, setSelectedTable] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, refetch } = useAuditLogs({ 
    limit, 
    cursor: currentPage > 1 ? ((currentPage - 1) * limit).toString() : undefined,
    action: selectedAction !== 'all' ? selectedAction : undefined,
  });

  const logs = data?.data || [];
  const hasMore = data?.hasMore || false;

  const filteredLogs = logs.filter((log: AuditLog) => {
    if (searchTerm && !JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedTable !== 'all' && log.table_name !== selectedTable) {
      return false;
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map((log: AuditLog) => log.action))];
  const uniqueTables = [...new Set(logs.map((log: AuditLog) => log.table_name))];

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
      case 'MODIFY':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
      case 'REMOVE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openDetailView = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action">Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="table">Table Name</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger id="table">
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </div>
              ) : (
                filteredLogs.map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => openDetailView(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="font-medium">{log.table_name}</span>
                          <span className="text-sm text-muted-foreground">
                            Row ID: {log.row_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>User: {log.user_id || 'System'}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                          </span>
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} • {filteredLogs.length} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail View Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label>Table</Label>
                  <p className="font-medium">{selectedLog.table_name}</p>
                </div>
                <div>
                  <Label>Row ID</Label>
                  <p className="font-mono text-sm">{selectedLog.row_id}</p>
                </div>
                <div>
                  <Label>User ID</Label>
                  <p className="font-mono text-sm">{selectedLog.user_id || 'System'}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.created_at), 'dd MMM yyyy, HH:mm:ss')}
                  </p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <Label>IP Address</Label>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Old Data</Label>
                  <ScrollArea className="h-48 mt-2 border rounded-lg p-3">
                    <pre className="text-xs font-mono">
                      {formatJsonData(selectedLog.old_data)}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <Label>New Data</Label>
                  <ScrollArea className="h-48 mt-2 border rounded-lg p-3">
                    <pre className="text-xs font-mono">
                      {formatJsonData(selectedLog.new_data)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsViewer; 