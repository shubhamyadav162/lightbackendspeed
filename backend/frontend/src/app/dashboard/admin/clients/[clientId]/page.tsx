import React from 'react';
import { ClientDetailPage } from '@/components/dashboard/ClientDetailPage';

interface ClientDetailPageProps {
  params: {
    clientId: string;
  };
}

export default function ClientDetail({ params }: ClientDetailPageProps) {
  return <ClientDetailPage clientId={params.clientId} />;
} 