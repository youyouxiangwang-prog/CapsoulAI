
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Lightbulb, Bell, Target, Wand2, Mic, Plus, MoreVertical, Pencil, CheckCircle2, ExternalLink, Trash2, Sparkles, Crown } from "lucide-react";
import { format } from "date-fns";
import { Highlight } from "@/api/localApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";
import SourceRecordingModal from "./SourceRecordingModal";
import AITipsModal from "./AITipsModal";

export default function SparkSection({ highlights, isLoading, onRefresh, searchQuery }) {
  const [newSpark, setNewSpark] = useState("");
  const [sparkCategory, setSparkCategory] = useState("idea");
  const [isAdding, setIsAdding] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  const categoryConfig = {
    idea: { icon: Wand2, bgColor: "bg-purple-50" },
    reminder: { icon: Bell, bgColor: "bg-blue-50" },
    decision: { icon: Target, bgColor: "bg-emerald-50" },
    insight: { icon: Lightbulb, bgColor: "bg-yellow-50" },
  };

  const handleAddSpark = async () => {
    if (!newSpark.trim()) return;
    setIsAdding(true);
    try {
      await Highlight.create({ title: sparkCategory, content: newSpark, category: sparkCategory });
      setNewSpark("");
      setSparkCategory("idea");
      onRefresh();
    } catch (error) { console.error("Error adding note:", error); } 
    finally { setIsAdding(false); }
  };

  const handleShowSource = (item) => {
    setSelectedItem(item);
    setShowSourceModal(true);
  };

  const handleShowTips = (item) => {
    setSelectedItem(item);
    setShowTipsModal(true);
  };

  const sampleReminder = {
      id: "sample_reminder",
      title: "Reminder",
      content: "Buy Harry Potter Lego for Daniel's birthday next weekend",
      category: "reminder",
      created_date: new Date().toISOString(),
      source_recording_id: "rec_12345"
  };

  const allNotes = [...highlights];

  const renderHighlightCard = (highlight) => {
    const config = categoryConfig[highlight.category] || categoryConfig.idea;
    const IconComponent = config.icon;
    const isLegoReminder = highlight.id === "sample_reminder";

    return (
      <motion.div key={highlight.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-effect border-0 rounded-2xl overflow-hidden group">
          <CardContent className="p-0 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" /><span>Mark Complete</span></DropdownMenuItem>
                
                {highlight.source_recording_id && (
                  <DropdownMenuItem onClick={() => handleShowSource(highlight)} className="flex items-center justify-between">
                    <div className="flex items-center"><ExternalLink className="mr-2 h-4 w-4" /><span>Source Recording</span></div>
                    <Crown className="w-3 h-3 text-yellow-500" />
                  </DropdownMenuItem>
                )}
                 <DropdownMenuItem onClick={() => handleShowTips(highlight)} className="flex items-center justify-between">
                    <div className="flex items-center"><Sparkles className="mr-2 h-4 w-4" /><span>AI Tips</span></div>
                    <Crown className="w-3 h-3 text-yellow-500" />
                </DropdownMenuItem>

                {isLegoReminder ? (
                  <DropdownMenuItem onClick={() => window.open('https://www.amazon.com/s?k=harry+potter+lego', '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" /><span>Buy on Amazon</span>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className={`px-4 py-3 ${config.bgColor} border-b border-white/50 flex items-center`}>
              <IconComponent className="w-5 h-5 mr-3 text-slate-600" />
              <h4 className="font-semibold text-slate-700 capitalize">{highlight.title}</h4>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-slate-800">{highlight.content}</p>
              <p className="text-xs text-slate-500">{format(new Date(highlight.created_date), "MMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="glass-effect border-0 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input placeholder="Add a new note, idea, or reminder..." value={newSpark} onChange={(e) => setNewSpark(e.target.value)} className="flex-1 border-0 bg-white/50 rounded-xl" />
            <Select value={sparkCategory} onValueChange={setSparkCategory}>
              <SelectTrigger className="w-32 border-0 bg-white/50 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="insight">Insight</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddSpark} disabled={!newSpark.trim() || isAdding} className="gradient-bg text-white rounded-xl px-4"><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
      {isLoading ? (
        <p>Loading notes...</p>
      ) : (
        <AnimatePresence>
          {allNotes.length > 0 ? (
            <div className="space-y-3">
              {allNotes.map(renderHighlightCard)}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500"><Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p>{searchQuery ? `No notes match "${searchQuery}"` : "No notes yet. Add one above!"}</p></div>
          )}
        </AnimatePresence>
      )}
       <SourceRecordingModal isOpen={showSourceModal} onClose={() => setShowSourceModal(false)} item={selectedItem} itemType="note" />
       <AITipsModal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} item={selectedItem} itemType="note" />
    </div>
  );
}
