
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Users, DollarSign, AlertTriangle, Plus, Minus, MessageSquare } from 'lucide-react';

interface WalletUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  autoRecharge: boolean;
  rechargeThreshold: number;
  rechargeAmount: number;
  feeRate: number;
  totalSpent: number;
  lastActivity: string;
  status: 'active' | 'suspended' | 'pending';
}

export const WalletManagement = () => {
  const [walletUsers, setWalletUsers] = useState<WalletUser[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@company.com',
      balance: 1250.50,
      autoRecharge: true,
      rechargeThreshold: 100,
      rechargeAmount: 500,
      feeRate: 4.0,
      totalSpent: 15420.80,
      lastActivity: '2024-06-10 14:30',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@business.com',
      balance: 45.20,
      autoRecharge: false,
      rechargeThreshold: 50,
      rechargeAmount: 200,
      feeRate: 3.5,
      totalSpent: 8950.30,
      lastActivity: '2024-06-10 12:15',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@startup.io',
      balance: 2340.75,
      autoRecharge: true,
      rechargeThreshold: 200,
      rechargeAmount: 1000,
      feeRate: 4.0,
      totalSpent: 25680.45,
      lastActivity: '2024-06-10 16:45',
      status: 'active'
    }
  ]);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  const adjustBalance = (userId: string, amount: number, type: 'add' | 'subtract') => {
    setWalletUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, balance: type === 'add' ? user.balance + amount : user.balance - amount }
        : user
    ));
    setAdjustmentAmount('');
    setAdjustmentReason('');
    alert(`Balance ${type === 'add' ? 'added' : 'subtracted'} successfully!`);
  };

  const toggleAutoRecharge = (userId: string) => {
    setWalletUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, autoRecharge: !user.autoRecharge } : user
    ));
  };

  const sendWhatsAppNotification = (userId: string) => {
    const user = walletUsers.find(u => u.id === userId);
    alert(`WhatsApp notification sent to ${user?.name} about low balance`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalBalance = walletUsers.reduce((sum, user) => sum + user.balance, 0);
  const lowBalanceUsers = walletUsers.filter(user => user.balance < user.rechargeThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600">Manage customer wallets, balances, and auto-recharge settings</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Bulk Notifications
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">{walletUsers.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Balance Alerts</p>
                <p className="text-2xl font-bold text-red-600">{lowBalanceUsers}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Fee Rate</p>
                <p className="text-2xl font-bold text-purple-600">3.8%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Auto Recharge</TableHead>
                <TableHead>Fee Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className={`font-semibold ${user.balance < user.rechargeThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        ${user.balance.toFixed(2)}
                      </p>
                      {user.balance < user.rechargeThreshold && (
                        <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Switch 
                        checked={user.autoRecharge}
                        onCheckedChange={() => toggleAutoRecharge(user.id)}
                      />
                      {user.autoRecharge && (
                        <p className="text-xs text-gray-600">
                          ${user.rechargeAmount} when below ${user.rechargeThreshold}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.feeRate}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{user.lastActivity}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedUser(user.id)}
                      >
                        Adjust
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendWhatsAppNotification(user.id)}
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Balance Adjustment Modal */}
      {selectedUser && (
        <Card className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Adjust Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <Textarea
                  placeholder="Reason for adjustment"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => adjustBalance(selectedUser, parseFloat(adjustmentAmount), 'add')}
                  className="flex-1"
                  disabled={!adjustmentAmount || !adjustmentReason}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
                <Button 
                  onClick={() => adjustBalance(selectedUser, parseFloat(adjustmentAmount), 'subtract')}
                  variant="destructive"
                  className="flex-1"
                  disabled={!adjustmentAmount || !adjustmentReason}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Subtract
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedUser(null)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
