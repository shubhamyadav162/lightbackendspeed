import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed ${res.status}`);
  }
  return res.json();
};

// ------ Admin Gateways ------
export const useGateways = () =>
  useQuery(["gateways"], () => fetchJSON("/api/admin/gateways"));

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
      onSuccess: () => qc.invalidateQueries(["gateways"]),
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