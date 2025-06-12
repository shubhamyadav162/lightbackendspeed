import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';

const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed ${res.status}`);
  }
  return res.json();
};

// ------ Admin Gateways ------
export const fetchGateways = () => fetchJSON("/api/admin/gateways");
export const useGateways = () =>
  useQuery(["gateways"], fetchGateways);

type ToggleGatewayArgs = { id: string; active: boolean };
export const useToggleGateway = () => {
  const qc = useQueryClient();
  return useMutation(
    async ({ id, active }: ToggleGatewayArgs) =>
      fetchJSON(`/api/admin/gateways/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries(["gateways"]);
        toast.success('Gateway status updated');
      },
      onError: (err: any) => toast.error(err.message),
    },
  );
};

// NEW: create gateway
export const useCreateGateway = () => {
  const qc = useQueryClient();
  return useMutation(
    async (payload: {
      name: string;
      provider: string;
      api_key: string;
      api_secret: string;
      monthly_limit?: number;
      priority?: number;
    }) =>
      fetchJSON(`/api/admin/gateways`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries(["gateways"]);
        toast.success('Gateway created');
      },
      onError: (err: any) => toast.error(err.message),
    },
  );
};

// NEW: update gateway generic
export const useUpdateGateway = () => {
  const qc = useQueryClient();
  return useMutation(
    async ({ id, ...payload }: { id: string } & Record<string, any>) =>
      fetchJSON(`/api/admin/gateways/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    {
      onSuccess: () => {
        qc.invalidateQueries(["gateways"]);
        toast.success('Gateway updated');
      },
      onError: (err: any) => toast.error(err.message),
    },
  );
};

// ------ Queue Metrics ------
export const useQueueMetrics = () =>
  useQuery(["queue-metrics"], () => fetchJSON("/api/admin/queues"), {
    refetchInterval: 5000,
  });

// ------ Commission Data ------
export const useCommissionData = () =>
  useQuery(["commission"], () => fetchJSON("/api/admin/commission/ledger"));

// ------ WhatsApp Log ------
export const useWhatsAppLog = (page = 1) =>
  useQuery(["whatsapp-log", page], () =>
    fetchJSON(`/api/admin/whatsapp?page=${page}`),
  );

export const useMerchantWAUsage = () =>
  useQuery(['wa-usage'], () => fetchJSON('/api/merchant/whatsapp/usage'));

export const useMerchantIntegration = () =>
  useQuery(['integration'], () => fetchJSON('/api/merchant/integration')); 