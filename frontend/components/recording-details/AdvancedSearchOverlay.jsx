import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ChevronDown, ChevronRight, History, Link as LinkIcon, ArrowDown, Bot, Sparkles, Play, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

// Mock data moved outside for clarity
const mockResults = {
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
};

export default function AdvancedSearchOverlay({ onClose, onJumpToRecording }) {
  const [searchResult, setSearchResult] = useState(mockResults);
  const [query, setQuery] = useState(mockResults.query);
  const [hasSearched, setHasSearched] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const [searchHistory, setSearchHistory] = useState([mockResults]);
  const [showHistory, setShowHistory] = useState(false);

  const exampleQueries = [
    "What's the full backstory of the marketing discussion from last month's planning meeting?",
    "What should I remember to buy when I go to the supermarket?",
    "What were the main action items from the project update?",
    "Who needs to follow up on the wireframes and when?",
    "What are the upcoming deadlines mentioned in this conversation?"
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setShowReasoning(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const resultToSet = {
        ...mockResults,
        query: query,
        timestamp: new Date().toISOString()
      };
      setSearchResult(resultToSet);
      setSearchHistory(prev => [resultToSet, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryClick = (historicalResult) => {
    setSearchResult(historicalResult);
    setQuery(historicalResult.query);
    setShowHistory(false);
    setHasSearched(true);
    setShowReasoning(false);
  };

  const handleNewSearch = () => {
    setSearchResult(null);
    setQuery("");
    setHasSearched(false);
    setShowHistory(false);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center md:p-4 md:pt-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-white w-full h-full flex flex-col md:relative md:rounded-lg md:shadow-xl md:max-w-2xl md:max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">AI Deep Reasoning</h3>
                <p className="text-sm text-slate-600">Ask questions across conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {searchHistory.length > 0 && (
                <Button onClick={() => setShowHistory(!showHistory)} variant="outline" size="sm" className="px-2 md:px-3">
                  <History className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">History</span>
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm" className="px-2 md:px-3">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasSearched || showHistory ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Ask a question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 pr-20 py-4 text-sm md:text-base rounded-xl border-2 border-slate-200 focus:border-purple-400"
                    disabled={isSearching}
                  />
                  <Button onClick={handleSearch} disabled={!query.trim()} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {!showHistory ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Example questions:</h4>
                    <div className="space-y-2">
                      {exampleQueries.map((example, index) => (
                        <button key={index} onClick={() => setQuery(example)} className="block w-full text-left p-3 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                          "{example}"
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-700">Previous searches:</h4>
                    <div className="space-y-2">
                      {searchHistory.map((item, index) => (
                        <button key={index} onClick={() => handleHistoryClick(item)} className="block w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                          <p className="font-medium text-slate-800 mb-1">"{item.query}"</p>
                          <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {searchResult.reasoning.steps.map((step, index) => (
                              <div key={index} className="flex items-center gap-3 text-sm text-purple-700">
                                <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                            <p className="text-sm text-purple-800 font-medium">{searchResult.reasoning.finalThought}</p>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                    <LinkIcon className="w-4 h-4 mr-2 text-sky-600" />
                    Relevant Evidence / Dialogue Segments
                  </h3>
                  <div className="bg-slate-50/50 rounded-xl p-4">
                    <div className="space-y-0">
                      {searchResult.evidence.map((segment, index) => (
                        <EvidenceCard key={segment.id} segment={segment} onJump={onJumpToRecording} isLast={index === searchResult.evidence.length - 1} />
                      ))}
                    </div>
                  </div>
                </div>
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      AI Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <p className="text-slate-800 leading-relaxed">{searchResult.answer}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-center pt-4">
                  <Button onClick={handleNewSearch} variant="outline" className="px-6">
                    Ask Another Question
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}