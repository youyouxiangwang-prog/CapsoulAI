import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Clock, Calendar, CheckSquare, Sparkles, Users, X, FileText, History, Download, Share, MessageSquare, Layers, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Moment } from '../api/localApi';
import AncestryGraph from '../components/AncestryGraph';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MomentsSearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [ancestryGraphs, setAncestryGraphs] = useState([]);
  const [summaryText, setSummaryText] = useState('');
  const [stats, setStats] = useState({
    conversations: 0,
    segments: 0,
    tasks: 0,
    notes: 0,
    schedules: 0,
    reminders: 0,
    lines: 0
  });

  const fetchSearchResults = useCallback(async (searchQuery) => {
    setIsLoading(true);
    try {
      console.log("Fetching search results for query:", searchQuery);
      const results = await Moment.search(searchQuery);
      console.log("Backend search results:", results);
      
      // Use new ancestry_graphs format
      setAncestryGraphs(results.ancestry_graphs || []);

      // Use stats directly from backend
      const finalStats = results.stats || {
        conversations: 0,
        segments: 0,
        tasks: 0,
        notes: 0,
        schedules: 0,
        reminders: 0,
        lines: 0
      };

      setStats(finalStats);
      
      // Parse and store the summary text
      let summaryText = results.summary || '';
      if (typeof summaryText === 'string' && summaryText.startsWith('{')) {
        try {
          const parsed = JSON.parse(summaryText);
          summaryText = parsed.summary || summaryText;
        } catch (e) {
          console.warn('Failed to parse summary JSON:', e);
        }
      }
      setSummaryText(summaryText);
      
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      setAncestryGraphs([]);
      setStats({
        conversations: 0,
        segments: 0,
        tasks: 0,
        notes: 0,
        schedules: 0,
        reminders: 0,
        lines: 0
      });
      setSummaryText('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('query');
    if (searchQuery && searchQuery !== lastQuery) {
      setQuery(searchQuery);
      fetchSearchResults(searchQuery);
      setLastQuery(searchQuery);
    } else if (!searchQuery) {
      setIsLoading(false);
    }
  }, [location, fetchSearchResults, lastQuery]);

  const handleTodoClick = () => {
    // Extract todos from ancestry graphs
    const allTodos = [];
    ancestryGraphs.forEach(graph => {
      // Check source node
      if (graph.source_node.type.toLowerCase() === 'task') {
        allTodos.push({
          id: graph.source_node.data.id,
          title: graph.source_node.title,
          priority: graph.source_node.data.priority || 'medium',
          category: graph.source_node.data.category || 'General'
        });
      }
      // Check ancestry path nodes
      graph.ancestry_path.forEach(node => {
        if (node.type.toLowerCase() === 'task') {
          allTodos.push({
            id: node.data.id,
            title: node.title,
            priority: node.data.priority || 'medium',
            category: node.data.category || 'General'
          });
        }
      });
    });
    
    setShowTodoModal(true);
  };

  const handleRecordingClick = (recordingId) => {
    navigate(createPageUrl(`RecordingDetails?id=${recordingId}`));
  };

  const handleOneClickSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summaryResult = await Moment.getSummary(query);
      const newSummary = {
        id: `sum_${Date.now()}`,
        query: query,
        timestamp: new Date(),
        timeRange: 'Custom Search',
        summary: summaryResult,
      };
      setCurrentSummary(newSummary);
      setSummaryHistory(prev => [newSummary, ...prev]);
      setShowSummaryModal(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      // Handle error in UI
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    setCurrentSummary(historyItem);
    setShowHistoryModal(false);
    setShowSummaryModal(true);
  };

  const handleExportSummary = () => {
    // Mock export functionality
    console.log('Exporting summary...', currentSummary);
  };

  const handleShareSummary = () => {
    // Mock share functionality
    console.log('Sharing summary...', currentSummary);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto gradient-bg rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Analyzing your moments...</h3>
            <p className="text-slate-600">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Moments"))}
            className="rounded-full flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold gradient-text">AI Search Results</h1>
            <p className="text-slate-600 text-sm md:text-base mt-1 line-clamp-2">For: "{query}"</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={() => setShowHistoryModal(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
          </Button>
          <Button
            onClick={handleOneClickSummary}
            disabled={isGeneratingSummary}
            className="gradient-bg text-white flex items-center gap-2"
            size="sm"
          >
            {isGeneratingSummary ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="hidden md:inline">{isGeneratingSummary ? 'Generating...' : 'One-Click Summary'}</span>
          </Button>
        </div>
      </motion.div>

      {/* AI Summary Card - 4 Block Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-effect border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Sparkles className="w-5 h-5 mr-2 text-sky-500" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.conversations}</p>
              <p className="text-xs text-slate-600">Conversations</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <Layers className="w-6 h-6 mx-auto text-teal-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.segments}</p>
              <p className="text-xs text-slate-600">Segments</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <Type className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.lines}</p>
              <p className="text-xs text-slate-600">Lines</p>
            </div>
            <div 
              className="bg-slate-50 p-4 rounded-xl text-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={handleTodoClick}
            >
              <CheckSquare className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.tasks}</p>
              <p className="text-xs text-slate-600">Tasks</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <FileText className="w-6 h-6 mx-auto text-purple-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.notes}</p>
              <p className="text-xs text-slate-600">Notes</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <Calendar className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.schedules}</p>
              <p className="text-xs text-slate-600">Schedules</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <Clock className="w-6 h-6 mx-auto text-red-500 mb-2" />
              <p className="text-xl font-bold text-slate-800">{stats.reminders}</p>
              <p className="text-xs text-slate-600">Reminders</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Results Summary */}
      {(ancestryGraphs.length > 0 || summaryText) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-effect border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Brain className="w-5 h-5 mr-2 text-indigo-500" />
                Search Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                <p className="text-slate-800 leading-relaxed">
                  {summaryText || (
                    `Based on your search for "${query}", I found ${ancestryGraphs.length} knowledge path${ancestryGraphs.length !== 1 ? 's' : ''} 
                    ${stats.tasks > 0 ? ` containing ${stats.tasks} task${stats.tasks !== 1 ? 's' : ''}` : ''} 
                    related to your query. The graphs show various interactions and developments over time.`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Knowledge Graph Visualization */}
      {ancestryGraphs.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
        >
          <AncestryGraph ancestry_graphs={ancestryGraphs} />
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <div className="text-slate-400 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No knowledge paths found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search query to find more results.</p>
          </div>
        </motion.div>
      )}

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                {currentSummary?.summary.title}
              </DialogTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportSummary} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleShareSummary} variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Generated: {currentSummary && format(currentSummary.timestamp, 'MMM d, yyyy h:mm a')} | 
              Query: "{currentSummary?.query}" | 
              Range: {currentSummary?.timeRange}
            </div>
          </DialogHeader>
          
          {currentSummary && (
            <div className="space-y-6 py-4">
              {/* Key Highlights */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Key Highlights
                </h3>
                <ul className="space-y-2">
                  {currentSummary.summary.keyHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Timeline
                </h3>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                  {currentSummary.summary.timeline.map((item, index) => (
                    <div key={index} className="relative mb-4 last:mb-0">
                      <div className="absolute -left-4 top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-800">{format(new Date(item.date), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-slate-600 mt-1">{item.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  Action Items
                </h3>
                <ul className="space-y-2">
                  {currentSummary.summary.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Insights (if available) */}
              {currentSummary.summary.insights && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {currentSummary.summary.insights.map((insight, index) => (
                      <li key={index} className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r-lg">
                        <span className="text-slate-700 italic">"{insight}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-6 h-6 text-slate-600" />
              Summary History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {summaryHistory.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-slate-200"
                onClick={() => handleHistoryItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 mb-1">{item.summary.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">Query: "{item.query}"</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{format(item.timestamp, 'MMM d, yyyy h:mm a')}</span>
                        <span>•</span>
                        <span>{item.timeRange}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {summaryHistory.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No summary history yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* To-Do Modal */}
      <AnimatePresence>
        {showTodoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowTodoModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">All Tasks ({stats.tasks})</h2>
                  <p className="text-slate-600">Tasks from your knowledge graphs</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTodoModal(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-3">
                  {(() => {
                    // Extract all todos from ancestry graphs
                    const allTodos = [];
                    ancestryGraphs.forEach(graph => {
                      // Check source node
                      if (graph.source_node.type.toLowerCase() === 'task') {
                        allTodos.push({
                          id: graph.source_node.data.id,
                          title: graph.source_node.title,
                          priority: graph.source_node.data.priority || 'medium',
                          category: graph.source_node.data.category || 'General'
                        });
                      }
                      // Check ancestry path nodes
                      graph.ancestry_path.forEach(node => {
                        if (node.type.toLowerCase() === 'task') {
                          allTodos.push({
                            id: node.data.id,
                            title: node.title,
                            priority: node.data.priority || 'medium',
                            category: node.data.category || 'General'
                          });
                        }
                      });
                    });
                    return allTodos;
                  })().map((todo) => (
                    <Card key={todo.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{todo.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className={
                                  todo.priority === 'high' ? 'border-red-200 text-red-700' :
                                  todo.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                  'border-blue-200 text-blue-700'
                                }
                              >
                                {todo.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {todo.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
