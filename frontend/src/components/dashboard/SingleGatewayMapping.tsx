import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../../hooks/use-toast';

export default function SingleGatewayMapping() {
  const [gateway, setGateway] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/v1/admin/gateways', {
      headers: { 'x-api-key': 'admin_test_key' }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.length > 0) {
          setGateway(data.data[0]);
        } else {
          setGateway(null);
        }
        setLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to fetch gateway', variant: 'destructive' });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading gateway...</div>;
  }

  if (!gateway) {
    return <div className="p-8 text-center">No active gateway configured.</div>;
  }

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>Active Payment Gateway (Strict 1:1 Mapping)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div><b>Name:</b> {gateway.name}</div>
          <div><b>Provider:</b> {gateway.provider}</div>
          <div><b>Status:</b> {gateway.is_active ? 'Active' : 'Inactive'}</div>
          <div><b>Priority:</b> {gateway.priority}</div>
          <div><b>Last Used:</b> {gateway.last_used_at}</div>
        </div>
        <div className="mt-4">
          <Button disabled>Strict 1:1 Mapping Enabled</Button>
        </div>
      </CardContent>
    </Card>
  );
} 