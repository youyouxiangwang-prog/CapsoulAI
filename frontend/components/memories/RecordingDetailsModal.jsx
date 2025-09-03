import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Brain, CheckSquare, Calendar, Play, Pause, Clock, MapPin, Users, Hash } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Todo } from "@/api/localApi";
import { CalendarEvent } from "@/api/localApi";

export default function RecordingDetailsModal({ recording, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState("transcript");
  const [isPlaying, setIsPlaying] = useState(false);
  const [suggestedTodos] = useState([
    {
      id: "temp_1",
      title: "Follow up with Sarah on wireframes",
      description: "Check on progress of user onboarding flow wireframes",
      priority: "high",
      due_date: "2024-01-17"
    },
    {
      id: "temp_2", 
      title: "Review dashboard mockups",
      description: "Evaluate dashboard designs for Wednesday review",
      priority: "medium",
      due_date: "2024-01-18"
    }
  ]);
  
  const [suggestedEvents] = useState([
    {
      id: "temp_1",
      title: "Design Review Meeting",
      description: "Review wireframes and mockups with team",
      start_time: "2024-01-17T14:00:00Z",
      end_time: "2024-01-17T15:30:00Z",
      location: "Conference Room A"
    },
    {
      id: "temp_2",
      title: "Client Follow-up Call",
      description: "Follow up on project requirements discussion",
      start_time: "2024-01-19T10:00:00Z",
      end_time: "2024-01-19T11:00:00Z",
      location: "Zoom"
    }
  ]);

  if (!recording) return null;

  const tabs = [
    { id: "transcript", label: "Transcript", icon: FileText },
    { id: "summary", label: "Summary", icon: Brain },
    { id: "todos", label: "To-Do", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
  ];

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmTodo = async (todo) => {
    try {
      await Todo.create({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        due_date: todo.due_date,
        source_recording_id: recording.id
      });
      onRefresh();
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const handleAddToCalendar = async (event) => {
    try {
      await CalendarEvent.create({
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        source_recording_id: recording.id
      });
      onRefresh();
    } catch (error) {
      console.error("Error creating calendar event:", error);
    }
  };

  const hashtagColors = [
    "text-emerald-600 bg-emerald-50",
    "text-blue-600 bg-blue-50",
    "text-purple-600 bg-purple-50",
    "text-pink-600 bg-pink-50",
    "text-orange-600 bg-orange-50",
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {recording.name || "Untitled Recording"}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {recording.date ? format(new Date(recording.date), "MMM d, yyyy 'at' h:mm a") : "No date"}
                  </div>
                  {recording.duration && (
                    <div className="flex items-center">
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                  )}
                  {recording.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{recording.location}</span>
                    </div>
                  )}
                  {recording.participants && recording.participants.length > 0 && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{recording.participants.length} participants</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Audio Player */}
            <div className="mt-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-1" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">Now Playing</p>
                    <p className="text-sm text-white/80">
                      {recording.duration ? formatDuration(recording.duration) : "Unknown duration"}
                    </p>
                  </div>
                </div>
                
                {/* Hashtags */}
                {recording.hashtags && recording.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recording.hashtags.slice(0, 3).map((hashtag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {hashtag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                <div className="bg-white rounded-full h-2 w-1/3"></div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-4 flex space-x-1 bg-slate-100 rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-6">
            {activeTab === "transcript" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Transcript</h3>
                <div className="bg-slate-50 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4 text-slate-700 leading-relaxed">
                    {recording.transcript ? (
                      recording.transcript.split('\n').map((line, index) => (
                        <p key={index} className="text-sm">
                          <span className="text-slate-500 mr-3">
                            {Math.floor(index * 10 / 60)}:{((index * 10) % 60).toString().padStart(2, '0')}
                          </span>
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">No transcript available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Executive Summary</h3>
                
                <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-3">Overview</h4>
                  <p className="text-blue-800 leading-relaxed">
                    {recording.summary || "This conversation covered key project updates, timeline discussions, and action items for the team. Multiple stakeholders provided input on current progress and upcoming milestones."}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">Key Points</h4>
                  
                  <div className="space-y-4">
                    <Card className="border-0 bg-emerald-50">
                      <CardContent className="p-4">
                        <h5 className="font-medium text-emerald-900 mb-2">Project Progress Update</h5>
                        <p className="text-emerald-800 text-sm leading-relaxed">
                          Team members provided comprehensive updates on their current work streams, including completed deliverables and upcoming deadlines. Overall progress is on track with minor adjustments needed.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-purple-50">
                      <CardContent className="p-4">
                        <h5 className="font-medium text-purple-900 mb-2">Action Items Identified</h5>
                        <p className="text-purple-800 text-sm leading-relaxed">
                          Several action items were identified during the discussion, including follow-up meetings, document reviews, and stakeholder communications. Clear ownership and timelines were established.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-orange-50">
                      <CardContent className="p-4">
                        <h5 className="font-medium text-orange-900 mb-2">Next Steps & Timeline</h5>
                        <p className="text-orange-800 text-sm leading-relaxed">
                          The team agreed on immediate next steps and established a clear timeline for upcoming deliverables. Regular check-ins were scheduled to ensure continued alignment and progress.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "todos" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Suggested To-Dos</h3>
                <p className="text-slate-600 text-sm">Review and confirm these action items generated from your conversation</p>
                
                <div className="space-y-3">
                  {suggestedTodos.map((todo) => (
                    <Card key={todo.id} className="border-0 bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{todo.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{todo.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className={
                                todo.priority === "high" ? "border-red-200 text-red-700" :
                                todo.priority === "medium" ? "border-yellow-200 text-yellow-700" :
                                "border-blue-200 text-blue-700"
                              }>
                                {todo.priority} priority
                              </Badge>
                              {todo.due_date && (
                                <span className="text-xs text-slate-500">
                                  Due: {format(new Date(todo.due_date), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmTodo(todo)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Suggested Calendar Events</h3>
                <p className="text-slate-600 text-sm">Add these upcoming meetings and events to your calendar</p>
                
                <div className="space-y-3">
                  {suggestedEvents.map((event) => (
                    <Card key={event.id} className="border-0 bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{event.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {format(new Date(event.start_time), "MMM d, h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleAddToCalendar(event)}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Add to Calendar
                            </Button>
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}