
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Switch } from "@/components/ui/switch";

export default function EditCalendarEventModal({ event, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    label: "social",
    auto_record: false
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : "",
        end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : "",
        location: event.location || "",
        label: event.label || "social",
        auto_record: event.auto_record || false,
      });
    }
  }, [event]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: event.id });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 gradient-text" />
                <h2 className="text-xl font-bold text-slate-800">Edit Event</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} className="rounded-xl"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} className="rounded-xl"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input id="start_time" type="datetime-local" value={formData.start_time} onChange={e => handleInputChange('start_time', e.target.value)} className="rounded-xl"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input id="end_time" type="datetime-local" value={formData.end_time} onChange={e => handleInputChange('end_time', e.target.value)} className="rounded-xl"/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} className="rounded-xl"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Select value={formData.label} onValueChange={value => handleInputChange('label', value)}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select a label" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center space-x-3 pt-2">
                <Switch 
                    id="auto-record" 
                    checked={formData.auto_record}
                    onCheckedChange={checked => handleInputChange('auto_record', checked)}
                />
                <Label htmlFor="auto-record" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <Mic className="w-4 h-4 text-slate-500" />
                    <span>Auto-Record this event</span>
                </Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="gradient-bg text-white rounded-xl">Save Changes</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
