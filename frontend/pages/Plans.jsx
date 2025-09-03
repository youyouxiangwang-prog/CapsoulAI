import React, { useState, useEffect } from "react";
import { Todo } from "@/api/localApi";
import { CalendarEvent } from "@/api/localApi";
import { Highlight } from "@/api/localApi";
import { motion } from "framer-motion";
import { CheckSquare, Calendar, StickyNote, AlertTriangle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import TodoSection from "../components/plans/TodoSection";
import CalendarSection from "../components/plans/CalendarSection";
import SparkSection from "../components/plans/SparkSection";

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState("todos");
  const [todos, setTodos] = useState([]);
  const [events, setEvents] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const tabs = [
    { id: "todos", label: "To-Dos", icon: CheckSquare },
    { id: "calendar", label: "Schedules", icon: Calendar },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [todosData, eventsData, highlightsData] = await Promise.all([
        Todo.list("-created_date"),
        CalendarEvent.list("start_time"),
        Highlight.list("-created_date"),
      ]);
      
      setTodos(todosData);
      setEvents(eventsData);
      setHighlights(highlightsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("We couldn't load your plans. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Fuzzy/Semantic search function
  const fuzzySearch = (items, query, searchFields) => {
    if (!query.trim()) return items;
    
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/);
    
    return items.filter(item => {
      // Get searchable text from the item
      const searchableText = searchFields
        .map(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value ? String(value).toLowerCase() : '';
        })
        .join(' ');
      
      // Exact match
      if (searchableText.includes(normalizedQuery)) {
        return true;
      }
      
      // Word-based fuzzy matching
      const hasAllWords = queryWords.every(word => {
        return searchableText.includes(word) || 
               // Simple typo tolerance - check if word is contained within longer words
               searchableText.split(/\s+/).some(textWord => 
                 textWord.includes(word) || word.includes(textWord)
               );
      });
      
      if (hasAllWords) return true;
      
      // Semantic matching for common terms
      const semanticMatches = {
        'marketing': ['promo', 'campaign', 'brand', 'social', 'content', 'ads'],
        'meeting': ['sync', 'standup', 'call', 'discussion', 'review'],
        'nda': ['confidential', 'agreement', 'contract', 'legal', 'non-disclosure'],
        'team': ['group', 'colleagues', 'staff', 'members'],
        'deadline': ['due', 'finish', 'complete', 'deliver'],
        'project': ['task', 'work', 'assignment', 'initiative'],
      };
      
      for (const [key, synonyms] of Object.entries(semanticMatches)) {
        if (normalizedQuery.includes(key)) {
          if (synonyms.some(synonym => searchableText.includes(synonym))) {
            return true;
          }
        }
        // Reverse check
        if (synonyms.some(synonym => normalizedQuery.includes(synonym))) {
          if (searchableText.includes(key)) {
            return true;
          }
        }
      }
      
      return false;
    });
  };

  // Filter items based on search
  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return { todos, events, highlights };
    }

    const filteredTodos = fuzzySearch(todos, searchQuery, ['title', 'description', 'label', 'priority']);
    const filteredEvents = fuzzySearch(events, searchQuery, ['title', 'description', 'location', 'label']);
    const filteredHighlights = fuzzySearch(highlights, searchQuery, ['title', 'content', 'category']);

    return {
      todos: filteredTodos,
      events: filteredEvents,
      highlights: filteredHighlights
    };
  };

  const { todos: filteredTodos, events: filteredEvents, highlights: filteredHighlights } = getFilteredItems();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold gradient-text">Plan</h1>
          <p className="text-slate-600">Organize your next steps</p>
        </div>
        <Button
          onClick={() => setShowSearch(!showSearch)}
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </Button>
      </motion.div>

      {/* Search Bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search across all plans (e.g., 'marketing', 'team sync', 'NDA')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200 rounded-xl"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
              {filteredTodos.length + filteredEvents.length + filteredHighlights.length} results
            </div>
          )}
        </motion.div>
      )}

      {/* Search Results Summary */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-50 border border-sky-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-sky-800">Search Results:</span>
              <span className="text-sky-600">{filteredTodos.length} To-Dos</span>
              <span className="text-sky-600">{filteredEvents.length} Schedules</span>
              <span className="text-sky-600">{filteredHighlights.length} Notes</span>
            </div>
            <Button
              onClick={() => setSearchQuery("")}
              variant="ghost"
              size="sm"
              className="text-sky-600 hover:bg-sky-100"
            >
              Clear Search
            </Button>
          </div>
        </motion.div>
      )}

      {/* Compact Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-xl p-1"
      >
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            // Get count based on search results
            let count = 0;
            if (tab.id === 'todos') count = filteredTodos.length;
            else if (tab.id === 'calendar') count = filteredEvents.length;
            else if (tab.id === 'notes') count = filteredHighlights.length;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? `gradient-bg text-white shadow-md`
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                <tab.icon className={`w-4 h-4 mr-1 ${isActive ? "text-white" : "text-[var(--primary-end)]"}`} />
                <span className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
                  {tab.label}
                </span>
                {count > 0 && (
                  <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Error Display */}
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
          <Button onClick={refreshData} className="mt-4 gradient-bg text-white hover:opacity-90">
            Try Again
          </Button>
        </motion.div>
      ) : (
        /* Tab Content */
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {activeTab === "todos" && (
            <TodoSection 
              todos={filteredTodos} 
              isLoading={isLoading} 
              onRefresh={refreshData}
              searchQuery={searchQuery}
            />
          )}
          {activeTab === "calendar" && (
            <CalendarSection 
              events={filteredEvents} 
              isLoading={isLoading} 
              onRefresh={refreshData}
              searchQuery={searchQuery}
            />
          )}
          {activeTab === "notes" && (
            <SparkSection 
              highlights={filteredHighlights} 
              isLoading={isLoading} 
              onRefresh={refreshData}
              searchQuery={searchQuery}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}