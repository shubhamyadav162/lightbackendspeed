"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGateways, useToggleGateway } from '../../../../hooks/useApi';
import SingleGatewayMapping from '../../../components/dashboard/SingleGatewayMapping';
// Note: You will need to create the actual modal component for adding/editing gateways.
// import { GatewayConfigurationModal } from '@/components/dashboard/GatewayConfigurationModal';


export default function GatewayManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<any | null>(null);

  const { data: gateways, isLoading, error } = useGateways();
  const toggleMutation = useToggleGateway();

  const handleToggleGateway = (id: string, checked: boolean) => {
    toggleMutation.mutate({ id, active: checked });
  };

  if (isLoading) return <div>Loading gateways...</div>;
  if (error) return <div>Error loading gateways: {error.message}</div>;

  return (
    <>
      {/* Strict 1:1 Gateway Mapping Notice/Widget */}
      <SingleGatewayMapping />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gateway Management</h1>
          <Button onClick={() => setShowCreateModal(true)}>Add New Gateway</Button>
        </div>

        {/* 
          You can uncomment this when the modal is created.
          {(showCreateModal || selectedGateway) && (
              <GatewayConfigurationModal
                  gateway={selectedGateway}
                  isOpen={showCreateModal || !!selectedGateway}
                  onClose={() => {
                      setShowCreateModal(false);
                      setSelectedGateway(null);
                  }}
              />
          )}
        */}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Monthly Volume</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways?.map((gateway: any) => (
                <TableRow key={gateway.id}>
                  <TableCell className="font-medium">{gateway.name}</TableCell>
                  <TableCell>{gateway.provider}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`gateway-toggle-${gateway.id}`}
                        checked={gateway.is_active}
                        onCheckedChange={(checked) => handleToggleGateway(gateway.id, checked)}
                        disabled={toggleMutation.isLoading}
                      />
                      <label htmlFor={`gateway-toggle-${gateway.id}`} className={gateway.is_active ? 'text-green-600' : 'text-gray-500'}>
                        {gateway.is_active ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {gateway.current_volume} / {gateway.monthly_limit}
                  </TableCell>
                  <TableCell className="text-right">{gateway.success_rate}%</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => setSelectedGateway(gateway)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
} 