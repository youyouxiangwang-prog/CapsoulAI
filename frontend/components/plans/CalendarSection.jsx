
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, MoreVertical, Edit, CheckCircle2, ExternalLink, Sparkles, Trash2, Crown, Mic, Plus } from "lucide-react";
import { format, isToday } from "date-fns";
import EditCalendarEventModal from "./EditCalendarEventModal";
import CalendarIntegrationModal from "./CalendarIntegrationModal";
import { CalendarEvent } from "@/api/localApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";
import SourceRecordingModal from "./SourceRecordingModal";
import AITipsModal from "./AITipsModal";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CalendarSection({ events, isLoading, onRefresh, searchQuery }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sampleEventStates, setSampleEventStates] = useState({
    "sample_1": true,
    "sample_2": false,
    "sample_3": false,
    "sample_4": true
  });
  const navigate = useNavigate();

  const sampleEvents = [
    // { id: "sample_1", title: "Morning Stand-up", start_time: new Date(new Date().setHours(9, 0, 0, 0)), end_time: new Date(new Date().setHours(9, 15, 0, 0)), location: "Zoom", label: "work", source_recording_id: "rec_67890", auto_record: sampleEventStates["sample_1"], isSample: true },
    // { id: "sample_2", title: "Lunch with Michael", start_time: new Date(new Date().setHours(12, 30, 0, 0)), end_time: new Date(new Date().setHours(13, 30, 0, 0)), location: "The Downtown Deli", label: "social", auto_record: sampleEventStates["sample_2"], isSample: true },
    // { id: "sample_3", title: "Dentist Appointment", start_time: new Date(new Date().setHours(15, 0, 0, 0)), end_time: new Date(new Date().setHours(15, 45, 0, 0)), location: "Main St Dental", label: "health", auto_record: sampleEventStates["sample_3"], isSample: true },
    // { id: "sample_4", title: "Pick up kids from soccer", start_time: new Date(new Date().setHours(17, 30, 0, 0)), end_time: null, location: "Community Park", label: "family", source_recording_id: "rec_11223", auto_record: sampleEventStates["sample_4"], isSample: true }
  ];

  // Mock external calendar events
  const externalEvents = [
    // { 
    //   id: "google_1", 
    //   title: "Q4 Planning Session", 
    //   start_time: new Date(new Date().setHours(14, 0, 0, 0)), 
    //   end_time: new Date(new Date().setHours(15, 30, 0, 0)), 
    //   location: "Conference Room B", 
    //   label: "work", 
    //   auto_record: false, 
    //   source: "Google Calendar",
    //   isExternal: true 
    // },
    // { 
    //   id: "outlook_1", 
    //   title: "Doctor Appointment", 
    //   start_time: new Date(new Date().setHours(11, 0, 0, 0)), 
    //   end_time: new Date(new Date().setHours(11, 45, 0, 0)), 
    //   location: "Medical Center", 
    //   label: "health", 
    //   auto_record: false, 
    //   source: "Outlook",
    //   isExternal: true 
    // }
  ];

  // Combine real events with sample events and external events for display
  const getAllEventsForDate = (date) => {
    const realEventsForDate = events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
    
    // Only show sample and external events for today
    const sampleEventsForDate = isToday(date) ? sampleEvents : [];
    const externalEventsForDate = isToday(date) ? externalEvents : [];
    
    return [...realEventsForDate, ...sampleEventsForDate, ...externalEventsForDate];
  };

  const formatEventTime = (startTime, endTime) => `${format(startTime, "h:mm a")}${endTime ? ` - ${format(endTime, "h:mm a")}` : ''}`;
  const handleEditEvent = (event) => setEditingEvent(event);

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.isSample) {
        // Handle sample event editing - just close modal for now
        console.log("Sample event editing not implemented");
        setEditingEvent(null);
        return;
      }
      
      await CalendarEvent.update(eventData.id, eventData);
      setEditingEvent(null);
      onRefresh();
    } catch (error) { 
      console.error("Error saving event:", error); 
    }
  };

  const handleShowSource = (item) => {
    setSelectedItem(item);
    setShowSourceModal(true);
  };

  const handleShowTips = (item) => {
    setSelectedItem(item);
    setShowTipsModal(true);
  };

  const handleToggleAutoRecord = async (event, checked) => {
    try {
      if (event.isSample) {
        // Handle sample events locally
        setSampleEventStates(prev => ({
          ...prev,
          [event.id]: checked
        }));
        return;
      }
      
      if (event.isExternal) {
        // For external events, we might want to store auto-record preferences separately
        console.log(`Auto-record toggled for external event ${event.id}:`, checked);
        return;
      }
      
      // Handle real events with database update
      await CalendarEvent.update(event.id, { auto_record: checked });
      onRefresh();
    } catch (error) {
      console.error("Error updating auto-record status:", error);
    }
  };

  const renderEventCard = (event) => (
    <Card key={event.id} className="glass-effect border-0 rounded-2xl group">
      <CardContent className="p-4 relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditEvent(event)} disabled={event.isExternal}>
              <Edit className="mr-2 h-4 w-4" />
              <span>{event.isExternal ? 'View Details' : 'Edit'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Mark Complete</span>
            </DropdownMenuItem>
            
            {event.source_recording_id && (
              <DropdownMenuItem onClick={() => handleShowSource(event)} className="flex items-center justify-between">
                 <div className="flex items-center">
                   <ExternalLink className="mr-2 h-4 w-4" />
                   <span>Source Recording</span>
                 </div>
                 <Crown className="w-3 h-3 text-yellow-500" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleShowTips(event)} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>AI Tips</span>
                </div>
                <Crown className="w-3 h-3 text-yellow-500" />
            </DropdownMenuItem>

            {!event.isExternal && (
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="space-y-2 pr-8">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800">{event.title}</p>
            {event.isExternal && (
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatEventTime(event.start_time, event.end_time)}</span>
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end items-center">
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-slate-500" />
                            <Switch
                                checked={!!event.auto_record}
                                onCheckedChange={(checked) => handleToggleAutoRecord(event, checked)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Auto-Record this event</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold text-slate-700">{format(selectedDate, "MMMM d, yyyy")}</h3>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Connect Calendar Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => setShowIntegrationModal(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Connect Calendar
        </Button>
      </div>

      <Card className="glass-effect border-0 rounded-2xl">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading schedules...</div>
          ) : (
            getAllEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getAllEventsForDate(selectedDate).map(renderEventCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No events for this day.</div>
            )
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <EditCalendarEventModal isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} onSave={handleSaveEvent} event={editingEvent} />
      <CalendarIntegrationModal isOpen={showIntegrationModal} onClose={() => setShowIntegrationModal(false)} onIntegrate={() => {}} />
      <SourceRecordingModal isOpen={showSourceModal} onClose={() => setShowSourceModal(false)} item={selectedItem} itemType="schedule" />
      <AITipsModal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} item={selectedItem} itemType="schedule" />
    </div>
  );
}
