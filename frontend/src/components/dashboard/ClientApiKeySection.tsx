
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Client } from '@/types/client';

interface ClientApiKeySectionProps {
  filteredClients: Client[];
  regenerateApiKey: (clientId: string) => void;
}

export const ClientApiKeySection: React.FC<ClientApiKeySectionProps> = ({
  filteredClients,
  regenerateApiKey
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-gray-600 font-mono">{client.apiKey}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => regenerateApiKey(client.id)}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
