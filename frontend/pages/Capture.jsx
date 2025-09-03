
import React, { useState, useEffect } from "react";
import { Recording } from "@/api/localApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, AlertTriangle, Sparkles, Zap, Bot, ChevronDown, ChevronRight, Link as LinkIcon, Play, Clock, MapPin, ArrowDown, BarChart, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import RecordingCard from "../components/memories/RecordingCard";
import NewRecordingModal from "../components/memories/NewRecordingModal";
import ShareModal from "../components/memories/ShareModal";
import PremiumUpgradeModal from "../components/recording-details/PremiumUpgradeModal";

export default function CapturePage() {
  const [recordings, setRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewRecording, setShowNewRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Assume false by default, can be fetched from user data
  const [showAIResults, setShowAIResults] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [showReasoning, setShowReasoning] = useState(true);
  const [searchHistory, setSearchHistory] = useState([
    {
      id: 1,
      query: "What were the main action items from the project update?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      results: {
        query: "What were the main action items from the project update?",
        reasoning: {
          steps: [
            "Analyzing conversation transcript for relevant context...",
            "Identifying key entities: people, dates, locations, tasks...",
            "Mapping relationships between discussion topics...",
            "Extracting causal connections and dependencies...",
            "Ranking segments by relevance to query...",
            "Generating contextual answer based on evidence..."
          ],
          finalThought: "Based on the conversation analysis, I found 3 key segments related to your query about project planning and follow-ups."
        },
        evidence: [
          {
            id: "segment_1",
            title: "Project Status Update",
            source_recording_id: "rec_123",
            time: "00:08",
            location: "Team Meeting",
          },
          {
            id: "segment_1a",
            title: "Wireframe & Mockup Details",
            source_recording_id: "rec_123",
            time: "00:12",
            location: "Team Meeting",
          },
          {
            id: "segment_2",
            title: "Meeting Scheduling Discussion",
            source_recording_id: "rec_456",
            time: "00:23",
            location: "Sales Call",
          }
        ],
        answer: "Based on your conversation, there are several follow-up items related to the project planning discussion. The main action is that someone needs to follow up on the wireframes for the user onboarding flow, which was mentioned as needing review. Additionally, dashboard mockups are scheduled for Wednesday review. A meeting was proposed for tomorrow at 2 PM to discuss these items in detail."
      }
    },
    {
      id: 2,
      query: "Who mentioned the budget constraints in recent meetings?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      results: {
        query: "Who mentioned the budget constraints in recent meetings?",
        reasoning: {
          steps: [
            "Searching for mentions of budget, cost, and financial constraints...",
            "Identifying speakers who discussed financial topics...",
            "Cross-referencing with meeting context and participants...",
            "Analyzing tone and urgency of budget-related discussions..."
          ],
          finalThought: "Found 2 key discussions about budget constraints from different team members."
        },
        evidence: [
          {
            id: "budget_1",
            title: "Q1 Budget Review Discussion",
            source_recording_id: "rec_789",
            time: "05:23",
            location: "Finance Meeting",
          },
          {
            id: "budget_2",
            title: "Project Resource Allocation",
            source_recording_id: "rec_456",
            time: "12:45",
            location: "Team Standup",
          }
        ],
        answer: "Sarah from Finance mentioned budget constraints during the Q1 review, specifically noting a 15% reduction in marketing spend. Additionally, Alex brought up resource limitations during the team standup, suggesting we need to prioritize features based on available budget."
      }
    }
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock AI search results (template for new searches)
  const mockAIResults = {
    query: "What were the main action items from the project update?",
    reasoning: {
      steps: [
        "Analyzing conversation transcript for relevant context...",
        "Identifying key entities: people, dates, locations, tasks...",
        "Mapping relationships between discussion topics...",
        "Extracting causal connections and dependencies...",
        "Ranking segments by relevance to query...",
        "Generating contextual answer based on evidence..."
      ],
      finalThought: "Based on the conversation analysis, I found 3 key segments related to your query about project planning and follow-ups."
    },
    evidence: [
      {
        id: "segment_1",
        title: "Project Status Update - Discussion on wireframes and mockups",
        source_recording_id: "rec_123",
        time: "00:08",
        location: "Team Meeting",
      },
      {
        id: "segment_1a",
        title: "Wireframe & Mockup Details - User onboarding flow review",
        source_recording_id: "rec_123",
        time: "00:12",
        location: "Team Meeting",
      },
      {
        id: "segment_2",
        title: "Meeting Scheduling Discussion - Proposed follow-up meeting",
        source_recording_id: "rec_456",
        time: "00:23",
        location: "Sales Call",
      }
    ],
    answer: "Based on your conversation, there are several follow-up items related to the project planning discussion. The main action is that someone needs to follow up on the wireframes for the user onboarding flow, which was mentioned as needing review. Additionally, dashboard mockups are scheduled for Wednesday review. A meeting was proposed for tomorrow at 2 PM to discuss these items in detail."
  };

  const barChartData = [
    { name: 'Onboarding Flow', value: 45, color: '#3b82f6' },
    { name: 'Dashboard Mockups', value: 30, color: '#8b5cf6' },
    { name: 'Frontend Dev', value: 15, color: '#10b981' },
    { name: 'Scheduling', value: 10, color: '#f97316' },
  ];

  const donutChartData = [
    { name: 'Constructive', value: 65, color: '#22c55e' },
    { name: 'Neutral', value: 25, color: '#a8a29e' },
    { name: 'Urgent', value: 10, color: '#ef4444' },
  ];

  useEffect(() => {
    loadRecordings();
    // In a real app, you might fetch user premium status here
    // For this example, we'll keep it simple or assume a default.
    // Set initial results to the first history item for demo if history exists
    if (searchHistory.length > 0) {
      setCurrentResults(searchHistory[0].results);
      setAiQuery(searchHistory[0].query);
    }
  }, []);

  const loadRecordings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await Recording.list("-date");
      setRecordings(data);
    } catch (err) {
      console.error("Error loading recordings:", err);
      setError("We couldn't load your recordings. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecordings = recordings.filter(recording => 
    recording.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recording.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNewRecording = async (recordingData) => {
    await loadRecordings();
    setShowNewRecording(false);
  };

  const handleDeleteRecording = async (recording) => {
    try {
      await Recording.delete(recording.id);
      await loadRecordings();
      toast({
        description: "Recording deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({
        description: "Failed to delete recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = (recording) => {
    setSelectedRecording(recording);
    setShowShareModal(true);
  };

  const handleAISearch = () => {
    let finalQuery = searchQuery;
    
    // If user types "AA", replace with the new sample question
    if (searchQuery.trim().toLowerCase() === "aa") {
      finalQuery = "Show me all the start-ups that are working on AI Robot projects.";
    }
    
    // Navigate to search results page with the query
    window.location.href = createPageUrl(`SearchResults?query=${encodeURIComponent(finalQuery)}`);
  };

  const handleUpgrade = () => {
    setIsPremium(true); // Simulate upgrade
    setShowPremiumModal(false);
    toast({
      description: "You've successfully upgraded to Premium!",
      // Assuming a success variant exists or default is fine
    });
  };

  const handleAdvancedSearchToggle = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // Determine the query to use for the AI search
    const queryToUse = searchQuery.trim() || mockAIResults.query;
    
    // Simulate new results based on mock data, but with the specific query
    const newResults = { ...mockAIResults, query: queryToUse };

    // Create a new history item
    const newHistoryItem = {
      id: Date.now(),
      query: queryToUse,
      timestamp: new Date(),
      results: newResults,
    };

    // Add to search history (most recent first)
    setSearchHistory(prev => [newHistoryItem, ...prev]);
    
    // Set current results for display
    setCurrentResults(newResults);
    setAiQuery(queryToUse);
    setShowAIResults(true);
    setShowReasoning(true);
    setShowHistory(false); // Ensure history view is hidden when showing new results
  };

  const handleJumpToRecording = (recordingId) => {
    if (recordingId) {
      navigate(createPageUrl(`RecordingDetails?id=${recordingId}`));
    }
  };

  // Handler for navigating to a meeting detail page when a card is clicked
  const handleCardClick = (recording) => {
    if (recording && recording.id) {
      window.location.href = createPageUrl(`MeetingDetails?id=${recording.id}`);
    }
  };

  const handleBackToSearch = () => {
    setShowAIResults(false);
    setShowHistory(false); // Also hide history if going back to main search
    setAiQuery("");
    setCurrentResults(null); // Clear current AI results
    setSearchQuery(""); // Clear search query when going back
  };

  const handleHistoryClick = (historyItem) => {
    setCurrentResults(historyItem.results);
    setAiQuery(historyItem.query);
    setShowHistory(false); // Hide history view
    setShowReasoning(true); // Show reasoning by default for history items
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const EvidenceCard = ({ segment, onJump, isLast }) => (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="relative z-10"
      >
        <Card 
          onClick={() => onJump(segment.source_recording_id)}
          className="bg-white/90 hover:bg-white hover:shadow-md transition-all cursor-pointer border border-slate-200"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Play className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-800 text-sm leading-tight mb-2">{segment.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{segment.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{segment.location}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs py-0 px-2 h-5">
                  {segment.source_recording_id.replace('rec_', 'Recording ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Connection Arrow */}
      {!isLast && (
        <div className="flex justify-center relative z-0 -mt-1 mb-1">
          <div className="bg-slate-300 rounded-full p-1.5">
            <ArrowDown className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      )}
    </div>
  );

  const SimpleBarChart = ({ data }) => (
    <div className="w-full h-56 bg-slate-50/80 rounded-lg p-4 flex flex-col justify-end gap-2">
      <div className="flex-grow flex items-end justify-around gap-2 border-b border-slate-200">
        {data.map((item, index) => (
          <motion.div
            key={index}
            className="w-full rounded-t-md"
            style={{ backgroundColor: item.color }}
            initial={{ height: 0 }}
            animate={{ height: `${item.value}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            title={`${item.name}: ${item.value}%`}
          />
        ))}
      </div>
      <div className="flex justify-around text-xs text-slate-500">
        {data.map(item => <span key={item.name} className="w-full text-center truncate px-1">{item.name}</span>)}
      </div>
    </div>
  );

  const SimpleDonutChart = ({ data }) => {
      let cumulative = 0;
      const strokes = data.map((item) => {
          const value = item.value;
          const dash = (value / 100) * (2 * Math.PI * 30);
          const offset = (cumulative / 100) * (2 * Math.PI * 30);
          cumulative += value;
          return { dash, offset, color: item.color };
      });

      return (
          <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="30" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                      {strokes.map((stroke, index) => (
                           <motion.circle
                              key={index}
                              cx="40"
                              cy="40"
                              r="30"
                              fill="transparent"
                              stroke={stroke.color}
                              strokeWidth="10"
                              strokeDasharray={2 * Math.PI * 30}
                              initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                              animate={{ strokeDashoffset: (2 * Math.PI * 30) - stroke.dash }}
                              strokeDashoffset={(2 * Math.PI * 30) - stroke.dash}
                              strokeLinecap="round"
                              style={{ transform: `rotate(${(stroke.offset / (2 * Math.PI * 30)) * 360}deg)`, transformOrigin: 'center' }}
                              transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
                          />
                      ))}
                  </svg>
              </div>
              <div className="flex flex-col gap-2">
                  {data.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <span className="text-slate-500">({item.value}%)</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold gradient-text">Capture</h1>
        <p className="text-slate-600">Your conversation archive</p>
      </motion.div>

      {!showAIResults ? (
        <>
          {/* Search Bar with AI Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search recordings by name or hashtag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-16 py-3 glass-effect border-0 rounded-2xl text-slate-700 placeholder-slate-400"
              />
              <Button
                onClick={handleAdvancedSearchToggle}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 gradient-bg text-white rounded-xl h-9 w-9"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Error Display or Recordings */}
          {error && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-6 bg-red-50/50 border border-red-200 text-red-700 rounded-2xl"
            >
              <div className="flex justify-center mb-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg">Unable to Load Data</h3>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={loadRecordings} className="mt-4 gradient-bg text-white hover:opacity-90">
                Try Again
              </Button>
            </motion.div>
          ) : (
            <>
              {/* New Recording Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  onClick={() => setShowNewRecording(true)}
                  className="w-full gradient-bg text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  New Recording
                </Button>
              </motion.div>

              {/* Recordings List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {isLoading ? (
                    Array(3).fill(0).map((_, index) => (
                      <motion.div
                        key={`skeleton-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-effect rounded-2xl p-4 space-y-3"
                      >
                        <div className="h-5 bg-slate-200 rounded animate-pulse" />
                        <div className="flex space-x-2">
                          <div className="h-6 bg-slate-200 rounded-full w-16 animate-pulse" />
                          <div className="h-6 bg-slate-200 rounded-full w-20 animate-pulse" />
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                      </motion.div>
                    ))
                  ) : filteredRecordings.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-slate-500"
                    >
                      {searchQuery ? "No recordings match your search" : "No recordings yet"}
                    </motion.div>
                  ) : (
                    filteredRecordings.map((recording, index) => (
                      <RecordingCard
                        key={recording.id}
                        recording={recording}
                        index={index}
                        onShare={handleShare}
                        onDelete={handleDeleteRecording}
                        onClick={handleCardClick}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </>
      ) : showHistory ? (
        /* History View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Search History</h2>
              <p className="text-slate-600">Your previous AI reasoning queries</p>
            </div>
            <Button
              onClick={() => setShowHistory(false)}
              variant="outline"
              className="flex items-center gap-2"
            >
              ← Back to Results
            </Button>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {searchHistory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-slate-200"
                  onClick={() => handleHistoryClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 text-sm leading-tight mb-2">
                          {item.query}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{formatTimeAgo(item.timestamp)}</span>
                          <span>•</span>
                          <span>{item.results.evidence.length} evidence segments</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Search className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {searchHistory.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No search history yet</p>
            </div>
          )}
        </motion.div>
      ) : (
        /* AI Search Results View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header with History Button */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handleBackToSearch}
              variant="outline"
              className="flex items-center gap-2"
            >
              ← Back to Search
            </Button>
            
            <div className="flex gap-2">
              {searchHistory.length > 0 && (
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  History ({searchHistory.length})
                </Button>
              )}
            </div>
          </div>

          {/* Query Display */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">AI Deep Reasoning Results</h2>
            <p className="text-slate-600">"{currentResults?.query || aiQuery}"</p>
          </div>

          {/* AI Reasoning Process */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="w-5 h-5 text-purple-600" />
                  AI Reasoning Process
                </CardTitle>
                <Button onClick={() => setShowReasoning(!showReasoning)} variant="ghost" size="sm">
                  {showReasoning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {showReasoning ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>
            <AnimatePresence>
              {showReasoning && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {currentResults?.reasoning.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-purple-700">
                          <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                      <p className="text-sm text-purple-800 font-medium">{currentResults?.reasoning.finalThought}</p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Evidence Segments */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-sky-600" />
              Relevant Evidence / Dialogue Segments
            </h3>
            <div className="bg-slate-50/50 rounded-xl p-4">
              <div className="space-y-0">
                {currentResults?.evidence.map((segment, index) => (
                  <EvidenceCard 
                    key={segment.id} 
                    segment={segment} 
                    onJump={handleJumpToRecording} 
                    isLast={index === currentResults.evidence.length - 1} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* AI Answer */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 mr-1 text-green-600" />
                AI Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <p className="text-slate-800 leading-relaxed">{currentResults?.answer}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Data Analysis & Visualization */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart className="w-5 h-5 text-blue-600" />
                Data Analysis & Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Time Spent on Project Topics</h4>
                <SimpleBarChart data={barChartData} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-4">Conversation Sentiment</h4>
                <SimpleDonutChart data={donutChartData} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modals */}
      <NewRecordingModal
        isOpen={showNewRecording}
        onClose={() => setShowNewRecording(false)}
        onSave={handleNewRecording}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recording={selectedRecording}
      />
      <PremiumUpgradeModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        onUpgrade={handleUpgrade} 
      />
    </div>
  );
}
