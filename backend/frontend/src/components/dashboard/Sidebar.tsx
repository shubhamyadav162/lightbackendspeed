import React from 'react';
import { 
  Home, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Users, 
  FileText, 
  Bell, 
  Shield,
  Code
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onScreenChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'gateways', label: 'Gateways', icon: CreditCard },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'alerts', label: 'Alert Center', icon: Bell },
    { id: 'developer', label: 'Developer Tools', icon: Code },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onScreenChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeScreen === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
