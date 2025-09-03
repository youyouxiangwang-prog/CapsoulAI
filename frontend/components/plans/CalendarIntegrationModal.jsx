import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, CheckCircle, Upload, Settings, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CalendarIntegrationModal({ isOpen, onClose, onIntegrate }) {
  const [activeTab, setActiveTab] = useState('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState([
    {
      id: 'google_1',
      name: 'john.doe@company.com',
      type: 'Google Calendar',
      status: 'connected',
      eventCount: 23,
      lastSync: '2 mins ago'
    },
    {
      id: 'outlook_1', 
      name: 'john.doe@outlook.com',
      type: 'Outlook',
      status: 'connected',
      eventCount: 15,
      lastSync: '5 mins ago'
    }
  ]);

  const integrationOptions = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      description: 'Connect your Google Calendar account',
      color: 'bg-blue-50 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📧',
      description: 'Connect your Outlook/Microsoft 365 calendar',
      color: 'bg-orange-50 border-orange-200',
      buttonColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      description: 'Sync with your iCloud calendar',
      color: 'bg-gray-50 border-gray-200',
      buttonColor: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      id: 'ical',
      name: 'Import iCal File',
      icon: '📄',
      description: 'Upload an .ics calendar file',
      color: 'bg-green-50 border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    }
  ];

  const handleConnect = async (type) => {
    setIsConnecting(true);
    
    // Simulate OAuth flow or file upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (type === 'ical') {
      // Simulate file upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ics';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('iCal file selected:', file.name);
        }
      };
      input.click();
    } else {
      // Simulate OAuth success
      const newCalendar = {
        id: `${type}_${Date.now()}`,
        name: `${type}@example.com`,
        type: integrationOptions.find(opt => opt.id === type)?.name,
        status: 'connected',
        eventCount: Math.floor(Math.random() * 30) + 5,
        lastSync: 'Just now'
      };
      setConnectedCalendars(prev => [...prev, newCalendar]);
    }
    
    setIsConnecting(false);
    onIntegrate?.();
  };

  const handleDisconnect = (calendarId) => {
    setConnectedCalendars(prev => prev.filter(cal => cal.id !== calendarId));
  };

  const handleSync = (calendarId) => {
    setConnectedCalendars(prev => prev.map(cal => 
      cal.id === calendarId 
        ? { ...cal, lastSync: 'Just now' }
        : cal
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Calendar Integration
          </DialogTitle>
          <DialogDescription>
            Connect your external calendars to see all events in one place
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'connect'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Connect New
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Manage ({connectedCalendars.length})
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 p-1"
              >
                {integrationOptions.map((option) => (
                  <Card key={option.id} className={`${option.color} border transition-all hover:shadow-md`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{option.icon}</div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{option.name}</h3>
                            <p className="text-sm text-slate-600">{option.description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleConnect(option.id)}
                          disabled={isConnecting}
                          className={`${option.buttonColor} text-white`}
                          size="sm"
                        >
                          {isConnecting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-1"
              >
                {connectedCalendars.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No calendars connected yet</p>
                    <Button
                      onClick={() => setActiveTab('connect')}
                      variant="outline"
                      className="mt-4"
                    >
                      Connect Your First Calendar
                    </Button>
                  </div>
                ) : (
                  connectedCalendars.map((calendar) => (
                    <Card key={calendar.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-800">{calendar.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {calendar.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span>{calendar.eventCount} events</span>
                                <span>•</span>
                                <span>Last sync: {calendar.lastSync}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleSync(calendar.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Sync
                            </Button>
                            <Button
                              onClick={() => handleDisconnect(calendar.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}