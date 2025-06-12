import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMerchantWAUsage } from '@/hooks/api';

export default function WhatsAppUsagePage() {
  const { data, isLoading, error } = useMerchantWAUsage();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading WhatsApp usage</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">WhatsApp Notification Usage</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((row: any) => (
          <Card key={row.type}>
            <CardHeader>
              <CardTitle>{row.type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{row.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 