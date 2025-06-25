
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, LogOut, Shield, HelpCircle, X } from 'lucide-react';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ isOpen, onClose }) => {
  const handleLogout = () => {
    alert('Logging out...');
    onClose();
  };

  const handleSettings = () => {
    alert('Opening user settings...');
    onClose();
  };

  const handleProfile = () => {
    alert('Opening user profile...');
    onClose();
  };

  const handleSecurity = () => {
    alert('Opening security settings...');
    onClose();
  };

  const handleHelp = () => {
    alert('Opening help center...');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-sm text-gray-500">admin@lightspeed.com</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-2">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleProfile}
          >
            <User className="w-4 h-4 mr-3" />
            View Profile
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleSettings}
          >
            <Settings className="w-4 h-4 mr-3" />
            Account Settings
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleSecurity}
          >
            <Shield className="w-4 h-4 mr-3" />
            Security
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleHelp}
          >
            <HelpCircle className="w-4 h-4 mr-3" />
            Help & Support
          </Button>
        </div>
        
        <hr className="my-2" />
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>

      <div className="p-4 bg-gray-50 rounded-b-lg">
        <div className="text-xs text-gray-500">
          <p>Version 2.1.0</p>
          <p>Last login: June 10, 2024 at 3:45 PM</p>
        </div>
      </div>
    </div>
  );
};
