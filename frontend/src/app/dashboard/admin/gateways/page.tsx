"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useGateways, useToggleGateway, useCreateGateway, useUpdateGateway } from "@/hooks/api";

export default function GatewayManager() {
  const { data: gateways, isLoading } = useGateways();
  const toggleGatewayMut = useToggleGateway();
  const createGatewayMut = useCreateGateway();
  const updateGatewayMut = useUpdateGateway();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const toggleGateway = (id: string, active: boolean) => {
    toggleGatewayMut.mutate({ id, active });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payment Gateways</h1>
        <Button
          onClick={async () => {
            const name = prompt("Gateway name (e.g., razorpay_1)");
            if (!name) return;
            const provider = prompt("Provider (razorpay|payu)");
            if (!provider) return;
            const api_key = prompt("API Key");
            if (!api_key) return;
            const api_secret = prompt("API Secret");
            if (!api_secret) return;
            createGatewayMut.mutate({ name, provider, api_key, api_secret });
          }}
        >
          Add Gateway
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gateways?.map((gateway: any) => (
            <TableRow key={gateway.id}>
              <TableCell>{gateway.name}</TableCell>
              <TableCell>{gateway.provider}</TableCell>
              <TableCell>
                <Switch
                  checked={gateway.is_active}
                  onCheckedChange={(checked) => toggleGateway(gateway.id, checked)}
                />
              </TableCell>
              <TableCell>
                {gateway.current_volume} / {gateway.monthly_limit}
              </TableCell>
              <TableCell>{gateway.success_rate}%</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const newLimit = prompt("New monthly limit", String(gateway.monthly_limit));
                    if (!newLimit) return;
                    const newPriority = prompt("New priority", String(gateway.priority));
                    updateGatewayMut.mutate({ id: gateway.id, monthly_limit: Number(newLimit), priority: Number(newPriority) });
                  }}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 