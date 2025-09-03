import React, { useState, useEffect } from "react";
import { Recording } from "@/api/localApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";

import RecordingCard from "../components/memories/RecordingCard";
import NewRecordingModal from "../components/memories/NewRecordingModal";
import ShareModal from "../components/memories/ShareModal";

export default function CapturePage() {
  const [recordings, setRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewRecording, setShowNewRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await Recording.list("-date");
      setRecordings(data);
    } catch (error) {
      console.error("Error loading recordings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecordings = Array.isArray(recordings)
    ? recordings.filter(recording =>
        recording.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

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
    }
  };

  const handleShare = (recording) => {
    setSelectedRecording(recording);
    setShowShareModal(true);
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

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search recordings or hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-3 glass-effect border-0 rounded-2xl text-slate-700 placeholder-slate-400"
        />
      </motion.div>

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
            // Loading skeleton
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
              />
            ))
          )}
        </AnimatePresence>
      </div>

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
    </div>
  );
}