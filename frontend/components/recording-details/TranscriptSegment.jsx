
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Play, Hash, User, MapPin, StickyNote, Bell, Target, CalendarDays, ExternalLink, Pencil, Trash2, CornerDownRight, ThumbsUp, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AttentionItem = ({ item, icon: Icon, onJump, onEdit, onDelete, categoryColor }) => (
    <motion.div 
      className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
    >
      <div className={`p-1.5 rounded-md ${categoryColor.bg} flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${categoryColor.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">{item.content || item.topic}</p>
        {item.expire_time && (
          <p className="text-xs text-slate-500 mt-1">Due: {item.expire_time}</p>
        )}
        {item.time && (
          <p className="text-xs text-slate-500 mt-1">Time: {item.time}</p>
        )}
        {item.participants && (
          <p className="text-xs text-slate-500 mt-1">Participants: {item.participants.join(', ')}</p>
        )}
      </div>
      <div className="flex gap-1 self-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:bg-slate-100">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onJump(item.sourceId)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Jump to Source
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit && onEdit(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete && onDelete(item)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );

export default function TranscriptSegment({ segment, isExpanded, onToggle, onSentenceClick, onJumpToSource, searchQuery }) {
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [speakerNames, setSpeakerNames] = useState({});

  const handleSpeakerEdit = (sentenceId, currentSpeaker) => {
    setEditingSpeaker(sentenceId);
  };

  const handleSpeakerSave = (sentenceId, newName) => {
    setSpeakerNames(prev => ({
      ...prev,
      [sentenceId]: newName
    }));
    setEditingSpeaker(null);
  };

  const handleJumpToSource = (sourceId) => {
    if (onJumpToSource) {
      onJumpToSource(sourceId);
    }
  };

  const handleEditItem = (item) => {
    console.log("Editing item:", item);
    // You can implement edit functionality here
  };

  const handleDeleteItem = (item) => {
    console.log("Deleting item:", item);
    // You can implement delete functionality here
  };

  const getMatchCount = () => {
    if (!searchQuery) return 0;
    const query = searchQuery.toLowerCase();
    let count = 0;
    if (segment.title.toLowerCase().includes(query)) count++;
    if (segment.summary.toLowerCase().includes(query)) count++;
    segment.sentences.forEach(sentence => {
      if (sentence.text.toLowerCase().includes(query)) count++;
    });
    return count;
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  const matchCount = getMatchCount();

  const categoryColors = {
    project: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Project' },
    design: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Design' },
    planning: { bg: 'bg-green-100', text: 'text-green-600', label: 'Planning' },
    default: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'General' },
  };

  const attentionItemConfig = {
    notes: { icon: StickyNote, title: "Notes", color: { bg: 'bg-yellow-100', text: 'text-yellow-600' } },
    reminders: { icon: Bell, title: "Reminders", color: { bg: 'bg-orange-100', text: 'text-orange-600' } },
    schedules: { icon: CalendarDays, title: "Schedules", color: { bg: 'bg-sky-100', text: 'text-sky-600' } },
    todos: { icon: Target, title: "To-Dos", color: { bg: 'bg-red-100', text: 'text-red-600' } },
  };

  const currentCategoryColor = categoryColors[segment.category] || categoryColors.default;

  return (
    <Card className="glass-effect border-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <div 
          className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={onToggle}
        >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Indentation & Chevron */}
            <div 
              className="flex items-center flex-shrink-0 mt-1"
              style={{ paddingLeft: `${(segment.level || 0) * 1.5}rem` }}
            >
              {(segment.level || 0) > 0 && <CornerDownRight className="w-4 h-4 text-slate-400 mr-2" />}
              {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
            </div>

            {/* Title & Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Label Badge */}
                  <Badge className={`text-xs px-2 py-1 ${currentCategoryColor.bg} ${currentCategoryColor.text} border-none font-medium`}>
                    {currentCategoryColor.label}
                  </Badge>
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    {highlightText(segment.title, searchQuery)}
                    {matchCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ({matchCount} matches)
                      </Badge>
                    )}
                  </h4>
                </div>
                {/* Time Range */}
                <div className="text-xs text-slate-500 flex-shrink-0">
                  {segment.startTime} - {segment.endTime}
                </div>
              </div>
              <p className="text-sm text-slate-600">{highlightText(segment.summary, searchQuery)}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-50/70"
          >
            <div 
                className="p-4 md:p-6 pt-4 space-y-6"
                style={{ paddingLeft: `${2.5 + (segment.level || 0) * 1.5}rem` }}
            >
                {/* Transcript Sentences */}
                <div className="space-y-3">
                    {segment.sentences.map((sentence) => (
                      <div key={sentence.id} id={sentence.id} className="p-3 rounded-lg hover:bg-white transition-colors group">
                          
                          <div className="flex flex-col sm:flex-row items-start gap-3">
                              {/* Timestamp + Speaker */}
                              <div className="w-full sm:w-28 flex-shrink-0">
                                  <span className="text-xs text-slate-500 font-mono">{sentence.time}</span>
                                  {editingSpeaker === sentence.id ? (
                                    <Input
                                      defaultValue={speakerNames[sentence.id] || sentence.speaker}
                                      onBlur={(e) => handleSpeakerSave(sentence.id, e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSpeakerSave(sentence.id, e.target.value);
                                      }}
                                      className="h-6 text-xs mt-1"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSpeakerEdit(sentence.id, sentence.speaker);
                                      }}
                                      className="block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1 truncate w-full text-left"
                                    >
                                      {speakerNames[sentence.id] || sentence.speaker}
                                    </button>
                                  )}
                              </div>

                              {/* Main Text */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-relaxed ${sentence.isImportant ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                    {highlightText(sentence.text, searchQuery)}
                                </p>
                              </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-1 mt-2 sm:pl-32 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" onClick={(e) => {e.stopPropagation(); onSentenceClick(sentence);}}><Play className="w-4 h-4"/></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500"><ThumbsUp className="w-4 h-4"/></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500"><MessageSquare className="w-4 h-4"/></Button>
                          </div>
                      </div>
                    ))}
                </div>

                {/* Attention Items & Entities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80">
                  {Object.entries(attentionItemConfig).map(([key, config]) => {
                    const items = segment.attentionItems[key];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={key}>
                        <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                          <config.icon className="w-4 h-4 mr-2" />
                          {config.title}
                        </h6>
                        <div className="space-y-2">
                          {items.map(item => (
                            <AttentionItem 
                              key={item.id} 
                              item={item} 
                              icon={config.icon} 
                              onJump={handleJumpToSource}
                              onEdit={handleEditItem}
                              onDelete={handleDeleteItem}
                              categoryColor={config.color} 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Named Entities */}
                  {(segment.entities.people.length > 0 || segment.entities.locations.length > 0) && (
                      <div>
                        <h6 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Named Entities
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {segment.entities.people.map((person, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleJumpToSource(person.sourceId)}
                              className="h-7 text-xs bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <User className="w-3 h-3 mr-1.5" />
                              {person.name}
                            </Button>
                          ))}
                           {segment.entities.locations.map((location, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleJumpToSource(location.sourceId)}
                              className="h-7 text-xs bg-white hover:bg-green-50 hover:border-green-300 transition-colors"
                            >
                              <MapPin className="w-3 h-3 mr-1.5" />
                              {location.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
