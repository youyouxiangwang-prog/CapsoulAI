import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle, Clock, Flag, Edit, Trash2, MoreVertical, ExternalLink, Brain, Crown } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TodoItem({ todo, onToggle, onEdit, onDelete, onShowSource, onShowTips, isCompleting, searchQuery = "" }) {
  const [isHovered, setIsHovered] = useState(false);

  const priorityColors = {
    low: "bg-blue-100 text-blue-700 border-blue-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    high: "bg-red-100 text-red-700 border-red-200"
  };

  const labelColors = {
    work: "bg-indigo-100 text-indigo-700",
    family: "bg-purple-100 text-purple-700",
    personal: "bg-green-100 text-green-700",
    health: "bg-pink-100 text-pink-700",
    learning: "bg-orange-100 text-orange-700"
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="glass-effect border-0 rounded-2xl transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Completion Toggle */}
            <button
              onClick={() => onToggle(todo)}
              disabled={isCompleting}
              className="mt-1 transition-colors hover:scale-110"
            >
              {isCompleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"
                />
              ) : todo.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 hover:text-green-500" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-medium leading-tight ${
                  todo.completed ? "line-through text-slate-500" : "text-slate-800"
                }`}>
                  {highlightText(todo.title, searchQuery)}
                </h3>
                
                {/* Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(todo)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onShowSource(todo)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Source Recording
                      </div>
                      <Crown className="w-3 h-3 text-yellow-500" />
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onShowTips(todo)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Tips
                      </div>
                      <Crown className="w-3 h-3 text-yellow-500" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(todo)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {todo.description && (
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                  {highlightText(todo.description, searchQuery)}
                </p>
              )}

              {/* Badges and Meta */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={priorityColors[todo.priority]}>
                  <Flag className="w-3 h-3 mr-1" />
                  {todo.priority}
                </Badge>

                <Badge variant="outline" className={labelColors[todo.label]}>
                  {todo.label}
                </Badge>

                {todo.due_date && (
                  <Badge variant="outline" className="text-slate-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(todo.due_date), "MMM d")}
                  </Badge>
                )}

                {todo.source_recording_id && (
                  <Badge 
                    variant="outline" 
                    className="text-blue-600 border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100"
                    onClick={() => onShowSource(todo)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Source
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}