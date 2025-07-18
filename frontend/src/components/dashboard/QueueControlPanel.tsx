import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useQueueStats, 
  useRetryQueueJobs, 
  usePauseQueue, 
  useCleanQueues 
} from '@/hooks/useApi';
import { toast } from 'sonner';
import { 
  Pause, 
  Play, 
  RefreshCw, 
  Trash2, 
  MoreVertical,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface QueueAction {
  queue: string;
  action: 'pause' | 'resume' | 'retry' | 'clean';
}

export const QueueControlPanel: React.FC = () => {
  const { data: rawQueueStats, refetch } = useQueueStats();
  const queueStats = Array.isArray(rawQueueStats) ? rawQueueStats : [];
  const [selectedAction, setSelectedAction] = useState<QueueAction | null>(null);
  
  // Use optimistic mutation hooks
  const retryJobs = useRetryQueueJobs();
  const pauseQueue = usePauseQueue();
  const cleanQueue = useCleanQueues();

  const queueDisplayNames: { [key: string]: string } = {
    'transaction-processing': 'Transaction Processing',
    'webhook-processing': 'Webhook Processing',
    'settlement-processing': 'Settlement Processing',
    'notification-queue': 'Notifications',
    'analytics-processing': 'Analytics',
  };

  const handlePauseResume = async (queueName: string, pause: boolean) => {
    try {
      await pauseQueue.mutateAsync({ queue: queueName, pause });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRetryFailed = async (queueName: string) => {
    try {
      await retryJobs.mutateAsync({ queue: queueName });
      setSelectedAction(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCleanCompleted = async (queueName: string) => {
    try {
      await cleanQueue.mutateAsync({ queue: queueName });
      setSelectedAction(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getQueueHealthColor = (queue: QueueStats) => {
    if (queue.paused) return 'text-gray-500';
    if (queue.failed > 10) return 'text-red-500';
    if (queue.failed > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getQueueHealthIcon = (queue: QueueStats) => {
    if (queue.paused) return <Pause className="h-5 w-5" />;
    if (queue.failed > 10) return <XCircle className="h-5 w-5" />;
    if (queue.failed > 0) return <AlertCircle className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const isQueueActionLoading = (queueName: string, action: string) => {
    switch (action) {
      case 'pause':
        return pauseQueue.isPending;
      case 'retry':
        return retryJobs.isPending;
      case 'clean':
        return cleanQueue.isPending;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Queue Management</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {queueStats.map((queue) => (
          <Card key={queue.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={getQueueHealthColor(queue)}>
                    {getQueueHealthIcon(queue)}
                  </span>
                  <CardTitle className="text-base">
                    {queueDisplayNames[queue.name] || queue.name}
                  </CardTitle>
                  {queue.paused && (
                    <Badge variant="secondary">Paused</Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handlePauseResume(queue.name, !queue.paused)}
                      disabled={isQueueActionLoading(queue.name, 'pause')}
                    >
                      {isQueueActionLoading(queue.name, 'pause') ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : queue.paused ? (
                        <Play className="h-4 w-4 mr-2" />
                      ) : (
                        <Pause className="h-4 w-4 mr-2" />
                      )}
                      {queue.paused ? 'Resume Queue' : 'Pause Queue'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedAction({ queue: queue.name, action: 'retry' })}
                      disabled={queue.failed === 0 || isQueueActionLoading(queue.name, 'retry')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed ({queue.failed})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedAction({ queue: queue.name, action: 'clean' })}
                      disabled={queue.completed === 0 || isQueueActionLoading(queue.name, 'clean')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Completed ({queue.completed})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{queue.waiting}</p>
                  <p className="text-xs text-muted-foreground">Waiting</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{queue.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{queue.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{queue.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{queue.delayed}</p>
                  <p className="text-xs text-muted-foreground">Delayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog 
        open={selectedAction?.action === 'retry'} 
        onOpenChange={() => setSelectedAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Failed Jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              क्या आप {selectedAction?.queue} queue के सभी failed jobs को retry करना चाहते हैं? 
              यह action immediately execute होगा।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && handleRetryFailed(selectedAction.queue)}
              disabled={retryJobs.isPending}
            >
              {retryJobs.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Failed Jobs'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={selectedAction?.action === 'clean'} 
        onOpenChange={() => setSelectedAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean Completed Jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              क्या आप {selectedAction?.queue} queue से सभी completed jobs को permanently delete करना चाहते हैं? 
              यह action को undo नहीं किया जा सकता।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && handleCleanCompleted(selectedAction.queue)}
              disabled={cleanQueue.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cleanQueue.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning...
                </>
              ) : (
                'Clean Jobs'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
