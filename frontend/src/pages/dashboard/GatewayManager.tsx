import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateMerchantForm } from './CreateMerchantForm';

// TODO: Replace with real data from useGateways hook
const demoGateways = [
  { id: 'gw_1', name: 'Razorpay Prod 1', provider: 'razorpay', is_active: true, current_volume: 500000, monthly_limit: 1000000, success_rate: 98.5 },
  { id: 'gw_2', name: 'PayU Sandbox', provider: 'payu', is_active: false, current_volume: 120000, monthly_limit: 500000, success_rate: 99.1 },
  { id: 'gw_3', name: 'EaseBuzz Prod 2', provider: 'easebuzz', is_active: true, current_volume: 850000, monthly_limit: 1000000, success_rate: 97.2 },
];

export function GatewayManager() {
  const [gateways, setGateways] = useState(demoGateways);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const { data: gateways, isLoading, error } = useGateways(); // Future implementation

  const handleToggle = (id: string, checked: boolean) => {
    // TODO: Call useToggleGateway mutation
    console.log(`Toggling gateway ${id} to ${checked}`);
    setGateways(currentGateways =>
      currentGateways.map(gw =>
        gw.id === id ? { ...gw, is_active: checked } : gw
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Gateway Management</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Gateway</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              {/* The form itself has a title, so we can leave this empty or minimal */}
            </DialogHeader>
            <CreateMerchantForm closeDialog={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Volume (INR)</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gateways.map(gateway => (
              <TableRow key={gateway.id}>
                <TableCell className="font-medium">{gateway.name}</TableCell>
                <TableCell>{gateway.provider}</TableCell>
                <TableCell>
                  <Switch
                    checked={gateway.is_active}
                    onCheckedChange={(checked) => handleToggle(gateway.id, checked)}
                    aria-label={`Toggle ${gateway.name}`}
                  />
                  <span className={`ml-2 text-sm ${gateway.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    {gateway.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {(gateway.current_volume / 100).toLocaleString('en-IN')} / {(gateway.monthly_limit / 100).toLocaleString('en-IN')}
                </TableCell>
                <TableCell>{gateway.success_rate.toFixed(2)}%</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => console.log(`Editing ${gateway.id}`)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 