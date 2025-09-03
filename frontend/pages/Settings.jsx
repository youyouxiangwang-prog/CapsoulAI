import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, Database, Shield, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoTranscribe: true,
    smartSummary: true,
    autoHashtags: true,
    darkMode: false,
    highQualityAudio: true,
    backgroundRecording: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ...existing code...

  const settingsSections = [
    {
      title: "Recording",
      icon: Database,
      items: [
        {
          key: "autoTranscribe",
          label: "Auto Transcribe",
          description: "Automatically transcribe recordings",
        },
        {
          key: "smartSummary",
          label: "Smart Summary",
          description: "Generate AI summaries",
        },
        {
          key: "autoHashtags",
          label: "Auto Hashtags",
          description: "Generate hashtags automatically",
        },
        {
          key: "highQualityAudio",
          label: "High Quality Audio",
          description: "Record in high quality",
        },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          key: "notifications",
          label: "Push Notifications",
          description: "Get notified about transcriptions",
        },
        {
          key: "backgroundRecording",
          label: "Background Recording",
          description: "Allow recording in background",
        },
      ]
    },
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          key: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme",
        },
      ]
    },
  ];

  const actionItems = [
    {
      title: "Privacy Policy",
      icon: Shield,
      action: () => console.log("Privacy Policy")
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      action: () => console.log("Help & Support")
    },
    {
      title: "Sign Out",
      icon: LogOut,
      action: () => {
        localStorage.removeItem("access_token");
        window.location.replace("/login");
      },
      dangerous: true
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-600">Customize your experience</p>
      </motion.div>

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="glass-effect border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Welcome</h3>
                <p className="text-slate-600">Manage your recording preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Card className="glass-effect border-0 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <section.icon className="w-5 h-5 text-sky-600" />
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{item.label}</h4>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings[item.key]}
                      onCheckedChange={(value) => handleSettingChange(item.key, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

  {/* ...existing code... */}

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-effect border-0 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            {actionItems.map((item, index) => (
              <Button
                key={item.title}
                variant="ghost"
                onClick={item.action}
                className={`w-full justify-start p-4 h-auto rounded-xl ${
                  item.dangerous 
                    ? "hover:bg-red-50 hover:text-red-600" 
                    : "hover:bg-white/50"
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${
                  item.dangerous ? "text-red-500" : "text-slate-600"
                }`} />
                <span className="font-medium">{item.title}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
