import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, MapPin, Hash, Users, MoreVertical, FileText, Share, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";

export default function RecordingCard({ recording, index, onShare, onDelete }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hashtagColors = [
    "text-sky-600 bg-sky-50",
    "text-blue-600 bg-blue-50",
    "text-purple-600 bg-purple-50",
    "text-pink-600 bg-pink-50",
    "text-orange-600 bg-orange-50",
  ];

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    
    switch (action) {
      case 'details':
        window.location.href = createPageUrl(`RecordingDetails?id=${recording.id}`);
        break;
      case 'share':
        onShare(recording);
        break;
      case 'export':
        // Export functionality
        console.log('Export recording:', recording.id);
        break;
      case 'delete':
        onDelete(recording);
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className="glass-effect border-0 rounded-2xl hover:shadow-lg transition-all duration-300"
      >
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                transition={{ type: "spring", stiffness: 300 }}
                className="gradient-bg rounded-full p-2.5 shadow-lg flex-shrink-0 mt-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Play audio");
                }}
              >
                <Play className="w-5 h-5 text-white ml-0.5" />
              </motion.div>
              <div className="flex-1 min-w-0" onClick={() => window.location.href = createPageUrl(`RecordingDetails?id=${recording.id}`)} style={{ cursor: 'pointer' }}>
                <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                  {recording.name || "Untitled Recording"}
                </h3>
                <div className="flex items-center text-sm text-slate-500 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {recording.date ? format(new Date(recording.date), "MMM d, h:mm a") : "No date"}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => handleMenuAction('details', e)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleMenuAction('share', e)}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleMenuAction('export', e)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuAction('delete', e)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hashtags */}
          {recording.hashtags && recording.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recording.hashtags.slice(0, 4).map((hashtag, hashIndex) => (
                <span
                  key={hashIndex}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    hashtagColors[hashIndex % hashtagColors.length]
                  }`}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag}
                </span>
              ))}
              {recording.hashtags.length > 4 && (
                <span className="text-xs text-slate-500 py-1">
                  +{recording.hashtags.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center space-x-4">
              {recording.duration && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(recording.duration)}
                </div>
              )}
              {recording.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-20">{recording.location}</span>
                </div>
              )}
            </div>
            {recording.participants && recording.participants.length > 0 && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{recording.participants.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}