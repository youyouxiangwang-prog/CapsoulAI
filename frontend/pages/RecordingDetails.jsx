import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Brain, CheckSquare, Calendar, Play, Pause, Clock, Users, Hash, Pencil, XCircle, CalendarPlus, CheckCircle2, Crown, Search, Sparkles, StickyNote, Bell, Target, CalendarDays, User, MapPin, FileUp, BookCopy, Code, Eye, LocateFixed, PlayCircle, Settings } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Recording } from "@/api/localApi";
import { Todo } from "@/api/localApi";
import { CalendarEvent } from "@/api/localApi";
import { createPageUrl } from "@/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import TodoEditModal from "../components/recording-details/TodoEditModal";
import TranscriptSegment from "../components/recording-details/TranscriptSegment";
import PremiumUpgradeModal from "../components/recording-details/PremiumUpgradeModal";
import TemplateEditorModal from "../components/recording-details/TemplateEditorModal";

export default function RecordingDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [recordingId, setRecordingId] = useState(null);
  const [recording, setRecording] = useState(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSegments, setExpandedSegments] = useState(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Default to free version

  // State for Summary Tab
  const [summaryMode, setSummaryMode] = useState("ai");
  const [userTemplates, setUserTemplates] = useState([
    { id: 't1', name: 'Meeting Action Items', content: '## Action Items\n- {{todo_list}}\n\n## Key Decisions\n- {{decision_list}}\n\n## Participants\n- {{participants}}' },
    { id: 't2', name: 'General Notes', content: '# Summary\n{{summary_paragraph}}\n\n### Highlights\n- {{highlights}}' },
  ]);
  const [communityTemplates, setCommunityTemplates] = useState([
      { id: 'c1', name: 'Project Retrospective', author: 'Jane Doe', content: '### What went well?\n- \n\n### What could be improved?\n- \n\n### Action Points\n- ' },
      { id: 'c2', name: '1-on-1 Catch-up', author: 'John Smith', content: '#### Key Discussion Points\n- {{key_points}}\n\n#### Next Steps\n- {{next_steps}}' },
      { id: 'c3', name: 'Sales Call Debrief', author: 'AI Community', content: '**Client:** {{client_name}}\n**Outcome:** {{outcome}}\n**Follow-up:** {{follow_up}}' },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState(userTemplates[0] || null);
  const [templateCode, setTemplateCode] = useState(userTemplates[0]?.content || '');
  const [generatedSummary, setGeneratedSummary] = useState([
      "The team formally decided to proceed with the Q3 marketing campaign redesign, allocating a preliminary budget.",
      "Alex is assigned to draft the initial creative brief, with a deadline of next Friday.",
      "A follow-up meeting is scheduled for next Wednesday at 10 AM to review the draft."
  ]);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showTemplateEditorModal, setShowTemplateEditorModal] = useState(false);
  const [tracingData, setTracingData] = useState(null);
  const [basicSummary, setBasicSummary] = useState("");
  const [isGeneratingBasic, setIsGeneratingBasic] = useState(false);
  const [isGeneratingPro, setIsGeneratingPro] = useState(false);
  const [showTemplateControls, setShowTemplateControls] = useState(false); // Default to hiding controls
  const [isSummaryGenerated, setIsSummaryGenerated] = useState(false);


  // MOCK DATA for demonstration
  const [suggestedTodos, setSuggestedTodos] = useState([]);
  const [suggestedEvents, setSuggestedEvents] = useState([]);

  // Enhanced transcript data with segmentation and hierarchy
  const [transcriptSegments, setTranscriptSegments] = useState([]);

  useEffect(() => {
    const recording_id = new URLSearchParams(location.search).get('id');
    if (recording_id) {
      setRecordingId(recording_id)
      loadRecording(recording_id);
    }
  }, [location]);

  const loadRecording = async (id) => {
    try {
      const data = await Recording.list("-date");
      const found = data.find(r => String(r.id) === id);
      setRecording(found);
      const details = await Recording.get(id);
      setTranscriptSegments(details);
      const suggested_todos = await Todo.get(id);
      setSuggestedTodos(suggested_todos.filter(todo => todo.status === "to-be-confirmed"));
      const suggestedEvents = await CalendarEvent.get(id);
      setSuggestedEvents(suggestedEvents.filter(event => event.status === "to-be-confirmed"));
    } catch (error) {
      console.error("Error loading recording:", error);
    }
  };

  const toggleSegment = (segmentId) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId);
    } else {
      newExpanded.add(segmentId);
    }
    setExpandedSegments(newExpanded);
  };

  const handleSentenceClick = (sentence) => {
    console.log(`Playing audio at timestamp: ${sentence.time}`);
    // In a real application, you would interact with an audio player here
    // Example: audioPlayerRef.current.currentTime = parseTimeToSeconds(sentence.time);
    // audioPlayerRef.current.play();
  };

  const handleJumpToSource = (sourceId) => {
    // Find the element by ID and scroll to it
    const element = document.getElementById(sourceId);
    if (element) {
      // First expand the segment if it's collapsed
      const segmentId = transcriptSegments.find(segment =>
        segment.sentences.some(s => s.id === sourceId)
      )?.id;

      if (segmentId && !expandedSegments.has(segmentId)) {
        setExpandedSegments(prev => new Set([...prev, segmentId]));
        // Wait for expansion animation to complete
        setTimeout(() => {
          scrollAndHighlight(element);
        }, 350); // Adjust timeout to match your animation duration
      } else {
        scrollAndHighlight(element);
      }
    }
  };

  const scrollAndHighlight = (element) => {
    // Scroll to element with smooth behavior
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Add highlight animation
    element.classList.add('animate-pulse', 'bg-yellow-200', 'rounded-lg', 'transition-all', 'duration-500');

    // Remove highlight after animation
    setTimeout(() => {
      element.classList.remove('animate-pulse', 'bg-yellow-200');
      // Keep rounded corners and transition for smooth fade out
      setTimeout(() => {
        element.classList.remove('rounded-lg', 'transition-all', 'duration-500');
      }, 500); // Duration for the fade out
    }, 2000); // How long the pulse animation lasts
  };

  const handleUpgrade = () => {
    setIsPremium(true);
    setShowPremiumModal(false);
  };

  const filteredSegments = searchQuery
    ? transcriptSegments.filter(segment =>
        (segment.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (segment.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (segment.sentences || []).some(s => (s.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : transcriptSegments;

  const handleConfirmTodo = async (todoToConfirm) => {
    try {
      await Todo.create({ title: todoToConfirm.title, description: todoToConfirm.description, priority: todoToConfirm.priority, due_date: todoToConfirm.due_date, source_recording_id: recording.id });
      // Remove the confirmed todo from the suggested list
      setSuggestedTodos(prevTodos => prevTodos.filter(t => t.id !== todoToConfirm.id));
    } catch (error) { console.error("Error creating todo:", error); }
  };
  const handleEditTodo = (todo) => { setEditingTodo(todo); };
  const handleSaveTodo = async (todoData) => {
    try {
      await Todo.create({ ...todoData, source_recording_id: recording.id });
      setEditingTodo(null);
      // If a suggested todo was edited and saved, remove it from the suggested list
      setSuggestedTodos(prevTodos => prevTodos.filter(t => t.id !== todoData.id));
    } catch (error) { console.error("Error saving todo:", error); }
  };
  const handleDismissTodo = (todoToDismiss) => {
    setSuggestedTodos(prevTodos => prevTodos.filter(t => t.id !== todoToDismiss.id));
  };

  const handleAddToCalendar = async (event) => {
    try {
      await CalendarEvent.create({ title: event.title, description: event.description, start_time: event.start_time, end_time: event.end_time, location: event.location, source_recording_id: recording.id });
      // Remove the added event from the suggested list
      setSuggestedEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
    } catch (error) { console.error("Error creating calendar event:", error); }
  };
  const handleEditCalendarEvent = (event) => { console.log("Editing calendar event:", event); alert("Editing calendar events is not yet implemented."); };
  const handleDismissEvent = (eventToDismiss) => {
    setSuggestedEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDismiss.id));
  };

  const handleGenerateBasicSummary = async () => {
    try {
      const basic_summary = await Recording.get_basic_summary(recordingId);
      setBasicSummary(basic_summary);
      setIsGeneratingBasic(true);
    } catch (error) {
      console.error("Error loading recording:", error);
    }
  };
  
  const handleGenerateSummary = () => {
    setIsGeneratingPro(true);
    setTimeout(() => {
      setIsSummaryGenerated(true);
      setIsGeneratingPro(false);
    }, 1500);
  };
  
  const handleTemplateChange = (templateId) => {
    const template = userTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setTemplateCode(template.content);
    }
  };

  const handleSentenceTrace = (sentence) => {
    // Mock data for tracing
    setTracingData({
      summarySentence: sentence,
      fragments: [
        { speaker: 'SPEAKER_01', time: '00:12', text: "That's great to hear. What about the wireframes for the user onboarding flow? I need to review them." },
        { speaker: 'SPEAKER_02', time: '00:18', text: "I'll follow up with you on that. The dashboard mockups should be ready for the Wednesday review though." }
      ],
      keywords: ['wireframes', 'onboarding', 'dashboard', 'review']
    });
  };

  const handleImportTemplate = (template) => {
    const newTemplateId = `t${userTemplates.length + 1}`;
    const newTemplate = { ...template, id: newTemplateId };
    setUserTemplates(prev => [...prev, newTemplate]);
    setShowCommunityModal(false);
    // Auto-select the newly imported template
    setSelectedTemplate(newTemplate);
    setTemplateCode(newTemplate.content);
  };

  const handleSaveNewTemplate = (newTemplate) => {
    const newId = `t${userTemplates.length + 1}`;
    const templateToAdd = { ...newTemplate, id: newId };
    setUserTemplates(prev => [...prev, templateToAdd]);
    // Optionally, select the new template automatically
    setSelectedTemplate(templateToAdd);
    setTemplateCode(templateToAdd.content);
  };

  if (!recording) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-end)]"></div>
      </div>
    );
  }

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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Capture"))} className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{recording.name || "Untitled Recording"}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-2">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {recording.date ? format(new Date(recording.date), "MMM d, yyyy 'at' h:mm a") : "No date"}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 space-y-6">
                {/* Hashtags and People Mentioned */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Card className="glass-effect border-0 rounded-2xl">
                      <CardHeader className="py-3">
                          <CardTitle className="flex items-center text-sm">
                              <Hash className="w-4 h-4 mr-2 text-sky-600" />
                              Hashtags
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                          <div className="flex flex-wrap gap-1.5">
                              {recording.hashtags && recording.hashtags.length > 0 ? (
                                  recording.hashtags.map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))
                              ) : (
                                  <p className="text-xs text-slate-500">No hashtags</p>
                              )}
                          </div>
                      </CardContent>
                  </Card>
                  <Card className="glass-effect border-0 rounded-2xl">
                      <CardHeader className="py-3">
                          <CardTitle className="flex items-center text-sm">
                              <Users className="w-4 h-4 mr-2 text-purple-600" />
                              People Mentioned
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                          <div className="flex flex-wrap gap-1.5">
                              {['Alex', 'Brenda', 'Charles'].map((name, index) => (
                                  <Badge key={index} className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs">{name}</Badge>
                              ))}
                          </div>
                      </CardContent>
                  </Card>
                </motion.div>

                {/* Audio Player */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                  <Card className="glass-effect border-0 rounded-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-10 h-10 bg-[var(--primary-end)] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          )}
                        </button>
                        <div className="flex-grow flex items-center gap-3">
                           <span className="text-xs font-mono text-slate-500">01:23</span>
                           <div className="w-full bg-slate-200 rounded-full h-1.5">
                             <div className="bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)] rounded-full h-1.5 w-1/3"></div>
                           </div>
                           <span className="text-xs font-mono text-slate-500">{recording.duration ? formatDuration(recording.duration) : "00:00"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="glass-effect border-0 rounded-2xl">
                    <CardContent className="p-2">
                      <div className="flex justify-between items-center">
                        {tabs.map((tab) => (
                          <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative flex-1 p-3 rounded-xl"
                            layout
                          >
                            {activeTab === tab.id && (
                              <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 gradient-bg rounded-xl"
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              />
                            )}
                            <motion.div layout className="relative z-10 flex items-center justify-center">
                              <tab.icon className={`w-5 h-5 transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-slate-600'}`} />
                              <AnimatePresence>
                                {activeTab === tab.id && (
                                  <motion.span
                                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                    animate={{ width: 'auto', opacity: 1, marginLeft: '8px' }}
                                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="whitespace-nowrap overflow-hidden text-white font-medium"
                                  >
                                    {tab.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tab Content */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {activeTab === "transcript" && (
                    <Card className="glass-effect border-0 rounded-2xl">
                      <CardContent className="p-6">
                        {/* Free Version: Basic Timeline */}
                        {!isPremium ? (
                          <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                              <h3 className="text-xl font-semibold text-slate-800">Transcript</h3>
                              <Button
                                onClick={() => setShowPremiumModal(true)}
                                className="gradient-bg text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade for Full AI Features
                              </Button>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                              <div className="flex items-center">
                                <Sparkles className="w-5 h-5 text-blue-500 mr-3" />
                                <div>
                                  <p className="text-blue-800 font-medium">You're on the Free Plan</p>
                                  <p className="text-blue-700 text-sm mt-1">Upgrade to unlock AI-powered segmentation, speaker identification, and smart extraction.</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50/80 rounded-xl p-4 md:p-6 max-h-[50vh] overflow-y-auto">
                              <div className="space-y-4">
                                {transcriptSegments.flatMap(segment => segment.sentences).map((sentence) => (
                                  <motion.div
                                    key={sentence.id}
                                    id={sentence.id}
                                    className="flex gap-3 items-start p-3 rounded-lg hover:bg-white cursor-pointer transition-colors group"
                                    onClick={() => handleSentenceClick(sentence)}
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="flex flex-col items-start w-24 flex-shrink-0">
                                      <span className="font-semibold text-sm text-slate-700 break-words">{sentence.speaker}</span>
                                      <span className="text-xs text-slate-500 font-mono mt-0.5">{sentence.time}</span>
                                    </div>
                                    <p className={`text-sm flex-1 leading-relaxed ${sentence.isImportant ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                      {sentence.text}
                                    </p>
                                    <Play className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Premium Version: Segmented View */
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-800">Enhanced Transcript</h3>
                            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                               <div className="flex items-center">
                                <Crown className="w-5 h-5 text-amber-500 mr-3" />
                                <div>
                                   <p className="text-amber-800 font-medium">💎 Premium Features Active</p>
                                   <p className="text-amber-700 text-sm mt-1">Enhanced AI segmentation and contextual search enabled.</p>
                                </div>
                              </div>
                            </div>

                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <Input
                                placeholder="Search within transcript..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-slate-200 rounded-xl"
                              />
                              {searchQuery && (
                                <Button
                                  onClick={() => setSearchQuery("")}
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>

                            {filteredSegments.map((segment) => (
                              <TranscriptSegment
                                key={segment.id}
                                segment={segment}
                                isExpanded={expandedSegments.has(segment.id)}
                                onToggle={() => toggleSegment(segment.id)}
                                onSentenceClick={handleSentenceClick}
                                onJumpToSource={handleJumpToSource}
                                searchQuery={searchQuery}
                              />
                            ))}

                            {filteredSegments.length === 0 && searchQuery && (
                              <div className="text-center py-12 text-slate-500">
                                <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p>No segments match your search</p>
                              </div>
                            )}
                            {filteredSegments.length === 0 && !searchQuery && (
                              <div className="text-center py-12 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p>No transcript segments available.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === "summary" && (
                    <Card className="glass-effect border-0 rounded-2xl">
                      {!isPremium ? (
                        /* FREE VERSION UI */
                        <CardContent className="p-6 space-y-6 text-center">
                          <Brain className="w-12 h-12 mx-auto text-sky-500" />
                          <h3 className="text-xl font-semibold text-slate-800">Basic AI Summary</h3>
                          <p className="text-slate-600 max-w-lg mx-auto">Get a quick, auto-generated overview of your conversation. Upgrade to Premium for customizable, template-based summaries.</p>
                          
                          {basicSummary ? (
                            <div className="text-left p-4 bg-slate-100 rounded-lg border border-slate-200">
                              <p className="text-slate-700 whitespace-pre-wrap">{basicSummary}</p>
                            </div>
                          ) : (
                             <Button onClick={handleGenerateBasicSummary} disabled={isGeneratingBasic}>
                                {isGeneratingBasic ? "Generating..." : "Generate Basic Summary"}
                             </Button>
                          )}
                          
                          <Button onClick={() => setShowPremiumModal(true)} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700">
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade for Advanced Summaries
                          </Button>
                        </CardContent>
                      ) : (
                        /* PREMIUM VERSION UI */
                        <CardContent className="p-6 space-y-6">
                          {!isSummaryGenerated ? (
                            <div className="text-center py-12">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h3 className="text-xl font-semibold text-slate-800">AI Summary</h3>
                              </div>
                              <p className="text-slate-600 mb-4">Click the button to generate an AI-powered summary of this recording.</p>
                              <Button onClick={handleGenerateSummary} disabled={isGeneratingPro} className="gradient-bg text-white">
                                {isGeneratingPro ? "Generating..." : "Generate Summary"}
                              </Button>
                            </div>
                          ) : (
                            <>
                              {/* Header with Toggle for Template Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-6 h-6 text-purple-600" />
                                  <h3 className="text-xl font-semibold text-slate-800">AI Summary</h3>
                                </div>
                                <Button
                                  onClick={() => setShowTemplateControls(!showTemplateControls)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Settings className="w-4 h-4" />
                                  {showTemplateControls ? "Hide Controls" : "Customize"}
                                </Button>
                              </div>

                              {/* Template Controls (Toggleable) */}
                              <AnimatePresence>
                                {showTemplateControls && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-6">
                                      {/* Template Mode Selection */}
                                      <div>
                                        <Label className="font-semibold text-slate-700">Template Mode</Label>
                                        <Select value={summaryMode} onValueChange={setSummaryMode}>
                                          <SelectTrigger className="mt-2 rounded-xl">
                                            <SelectValue placeholder="Select a mode" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ai">AI Auto-Select</SelectItem>
                                            <SelectItem value="manual">Manual Template</SelectItem>
                                            <SelectItem value="pool">Auto-Match from Pool</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Manual Template Selector */}
                                      {summaryMode === 'manual' && (
                                        <div>
                                          <Label className="font-semibold text-slate-700">Your Templates</Label>
                                          <Select value={selectedTemplate?.id} onValueChange={handleTemplateChange}>
                                            <SelectTrigger className="mt-2 rounded-xl">
                                              <SelectValue placeholder="Select a template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {userTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                      
                                      {/* Template Management Buttons */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <Button onClick={() => setShowTemplateEditorModal(true)} variant="outline">
                                            <Sparkles className="w-4 h-4 mr-2"/>
                                            Create AI Template
                                        </Button>
                                        <Button onClick={() => setShowCommunityModal(true)} variant="outline">
                                            <BookCopy className="w-4 h-4 mr-2"/>
                                            Community
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Live Preview (Always Visible - Main Content) */}
                              <Card className="bg-white border-slate-200 rounded-2xl">
                                <CardContent className="p-6 space-y-4">
                                    <h2 className="text-lg font-bold text-slate-800">Action Items</h2>
                                    <ul className="list-disc list-inside space-y-2">
                                        {generatedSummary.map((sentence, index) => (
                                            <li key={index}>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <span 
                                                            onClick={() => handleSentenceTrace(sentence)}
                                                            className="text-slate-700 cursor-pointer hover:bg-yellow-200 transition-colors rounded px-1"
                                                        >
                                                            {sentence}
                                                        </span>
                                                    </PopoverTrigger>
                                                    {tracingData && tracingData.summarySentence === sentence && (
                                                    <PopoverContent className="w-80" align="start">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2 mb-2"><LocateFixed className="w-4 h-4 text-blue-500"/>Source Fragments</h4>
                                                                <div className="space-y-2 text-xs p-2 bg-slate-100 rounded-md">
                                                                    {tracingData.fragments.map((f, i) => (
                                                                        <p key={i}><strong>{f.speaker}:</strong> "{f.text}"</p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <Button size="sm" className="w-full">
                                                                <PlayCircle className="w-4 h-4 mr-2"/>
                                                                Play Audio Snippet
                                                            </Button>
                                                        </div>
                                                    </PopoverContent>
                                                    )}
                                                </Popover>
                                            </li>
                                        ))}
                                    </ul>
                                    <h2 className="text-lg font-bold text-slate-800 pt-4 border-t border-slate-200">Key Decisions</h2>
                                    <p className="text-slate-700">The preliminary budget was approved for the project.</p>
                                </CardContent>
                              </Card>
                            </>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {activeTab === "todos" && (
                    <Card className="glass-effect border-0 rounded-2xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6">Suggested To-Dos</h3>
                        <p className="text-slate-600 text-sm mb-6">Review and confirm these action items generated from your conversation</p>

                        <AnimatePresence initial={false}>
                          <div className="space-y-3">
                            {suggestedTodos.map((todo) => (
                              <motion.div
                                key={todo.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <Card className="border-0 bg-slate-50">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
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
                                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleConfirmTodo(todo)} className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600">
                                              <CheckCircle2 className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Confirm & Add</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleEditTodo(todo)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                              <Pencil className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleDismissTodo(todo)} className="text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                                              <XCircle className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Dismiss</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                            {suggestedTodos.length === 0 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-center text-slate-500 py-8"
                              >
                                All suggested to-dos confirmed or dismissed! 🎉
                              </motion.div>
                            )}
                          </div>
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === "calendar" && (
                    <Card className="glass-effect border-0 rounded-2xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6">Suggested Calendar Events</h3>
                        <p className="text-slate-600 text-sm mb-6">Add these upcoming meetings and events to your calendar</p>

                        <AnimatePresence initial={false}>
                          <div className="space-y-3">
                            {suggestedEvents.map((event) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <Card className="border-0 bg-slate-50">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h4 className="font-medium text-slate-800">{event.title}</h4>
                                        <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                          <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            {format(new Date(event.start_time), "MMM d, h:mm a")}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleAddToCalendar(event)} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                              <CalendarPlus className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Add to Calendar</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleEditCalendarEvent(event)} className="text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                                              <Pencil className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => handleDismissEvent(event)} className="text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                                              <XCircle className="w-5 h-5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Dismiss</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                            {suggestedEvents.length === 0 && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-center text-slate-500 py-8"
                              >
                                All suggested calendar events confirmed or dismissed! 🎉
                              </motion.div>
                            )}
                          </div>
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
            </div>
          </div>

          <TodoEditModal todo={editingTodo} isOpen={!!editingTodo} onClose={() => setEditingTodo(null)} onSave={handleSaveTodo} />
          <PremiumUpgradeModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={handleUpgrade} />
          <TemplateEditorModal 
              isOpen={showTemplateEditorModal} 
              onClose={() => setShowTemplateEditorModal(false)} 
              onSave={handleSaveNewTemplate}
          />
          
          <Dialog open={showCommunityModal} onOpenChange={setShowCommunityModal}>
              <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                      <DialogTitle>Template Community</DialogTitle>
                      <DialogDescription>
                          Browse, preview, and import templates shared by the community.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                      {communityTemplates.map(template => (
                          <Card key={template.id}>
                              <CardHeader>
                                  <CardTitle className="flex justify-between items-center">
                                      <span>{template.name}</span>
                                      <Button size="sm" onClick={() => handleImportTemplate(template)}>Import</Button>
                                  </CardTitle>
                                  <p className="text-sm text-slate-500">by {template.author}</p>
                              </CardHeader>
                              <CardContent>
                                  <pre className="text-xs p-3 bg-slate-100 rounded-md whitespace-pre-wrap">{template.content}</pre>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </DialogContent>
          </Dialog>

        </div>
      </div>
    </TooltipProvider>
  );
}