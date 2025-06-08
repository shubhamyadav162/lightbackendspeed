"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState([
    {
      id: "alert_1",
      type: "GATEWAY_DOWN",
      message: "Razorpay gateway is currently down",
      severity: "HIGH",
      timestamp: "2025-06-08 10:15:22",
      acknowledged: false,
    },
    {
      id: "alert_2",
      type: "HIGH_FAILURE_RATE",
      message: "PayU gateway has high failure rate (15%)",
      severity: "MEDIUM",
      timestamp: "2025-06-08 09:45:10",
      acknowledged: false,
    },
    {
      id: "alert_3",
      type: "TRANSACTION_STUCK",
      message: "5 transactions are stuck in PENDING state",
      severity: "LOW",
      timestamp: "2025-06-08 08:30:55",
      acknowledged: true,
    },
  ]);

  const [gateways, setGateways] = useState([
    {
      id: "pg_1",
      name: "Razorpay",
      code: "RZP",
      status: "DOWN",
      successRate: "0%",
      responseTime: "5000ms",
    },
    {
      id: "pg_2",
      name: "PayU",
      code: "PYU",
      status: "DEGRADED",
      successRate: "85%",
      responseTime: "350ms",
    },
    {
      id: "pg_3",
      name: "LightSpeed",
      code: "LSP",
      status: "HEALTHY",
      successRate: "99.8%",
      responseTime: "120ms",
    },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Total Merchants</h2>
          <p className="text-3xl font-bold">42</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Total Transactions</h2>
          <p className="text-3xl font-bold">12,458</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Overall Success Rate</h2>
          <p className="text-3xl font-bold">94.7%</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-2">Active Alerts</h2>
          <p className="text-3xl font-bold">{alerts.filter(a => !a.acknowledged).length}</p>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">System Alerts</h2>
          <Link href="/dashboard/admin/alerts" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Message</th>
                <th className="py-2 text-left">Severity</th>
                <th className="py-2 text-left">Timestamp</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b hover:bg-muted/50">
                  <td className="py-3">{alert.type}</td>
                  <td className="py-3">{alert.message}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        alert.severity === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : alert.severity === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-3">{alert.timestamp}</td>
                  <td className="py-3">
                    {alert.acknowledged ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Acknowledged
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        New
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      className="text-primary hover:underline mr-2"
                      onClick={() => {
                        // Handle acknowledgment
                        setAlerts(
                          alerts.map((a) =>
                            a.id === alert.id ? { ...a, acknowledged: true } : a
                          )
                        );
                      }}
                      disabled={alert.acknowledged}
                    >
                      {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Gateways</h2>
          <Link href="/dashboard/admin/gateways" className="text-sm text-primary hover:underline">
            Manage Gateways
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Code</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Success Rate</th>
                <th className="py-2 text-left">Response Time</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.id} className="border-b hover:bg-muted/50">
                  <td className="py-3">{gateway.name}</td>
                  <td className="py-3">{gateway.code}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        gateway.status === "HEALTHY"
                          ? "bg-green-100 text-green-800"
                          : gateway.status === "DEGRADED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {gateway.status}
                    </span>
                  </td>
                  <td className="py-3">{gateway.successRate}</td>
                  <td className="py-3">{gateway.responseTime}</td>
                  <td className="py-3">
                    <Link
                      href={`/dashboard/admin/gateways/${gateway.id}`}
                      className="text-primary hover:underline mr-2"
                    >
                      View
                    </Link>
                    |
                    <Link
                      href={`/dashboard/admin/gateways/${gateway.id}/edit`}
                      className="text-primary hover:underline ml-2"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/admin/merchants/new"
            className="flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Add New Merchant
          </Link>
          <Link
            href="/dashboard/admin/gateways/new"
            className="flex items-center justify-center p-4 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
          >
            Add New Gateway
          </Link>
          <Link
            href="/dashboard/admin/system-settings"
            className="flex items-center justify-center p-4 bg-muted text-muted-foreground rounded-md hover:opacity-90"
          >
            System Settings
          </Link>
        </div>
      </div>
    </div>
  );
} 