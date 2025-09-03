
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, Plus, Mic, MoreVertical, Pencil, CheckCircle2, ExternalLink, Link as LinkIcon, Sparkles, Trash2, Crown } from "lucide-react";
import { Todo } from "@/api/localApi";
import TodoItem from "./TodoItem";
import EditTodoModal from "./EditTodoModal";
import SourceRecordingModal from "./SourceRecordingModal";
import AITipsModal from "./AITipsModal";

export default function TodoSection({ todos, isLoading, onRefresh, searchQuery = "" }) {
  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [completingIds, setCompletingIds] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    
    setIsAdding(true);
    try {
      await Todo.create({
        title: newTodo,
        completed: false,
        priority: "medium",
        label: "personal"
      });
      setNewTodo("");
      onRefresh();
    } catch (error) {
      console.error("Error adding todo:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTodo = async (todo) => {
    if (completingIds.includes(todo.id)) return;

    setCompletingIds(ids => [...ids, todo.id]);
    
    try {
      await Todo.update(todo.id, { completed: !todo.completed });
      
      setTimeout(() => {
        onRefresh();
        setCompletingIds(ids => ids.filter(id => id !== todo.id));
      }, 1500);

    } catch (error) {
      console.error("Error updating todo:", error);
      setCompletingIds(ids => ids.filter(id => id !== todo.id));
    }
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
  };

  const handleSaveTodo = async (todoData) => {
    try {
      await Todo.update(todoData.id, todoData);
      setEditingTodo(null);
      onRefresh();
    } catch (error) {
      console.error("Error saving todo:", error);
    }
  };

  const handleDeleteTodo = async (todo) => {
    try {
      await Todo.delete(todo.id);
      onRefresh();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleShowSource = (todo) => {
    setSelectedTodo(todo);
    setShowSourceModal(true);
  };

  const handleShowTips = (todo) => {
    setSelectedTodo(todo);
    setShowTipsModal(true);
  };
  
  return (
    <div className="space-y-4">
      {/* Add New Todo */}
      <Card className="glass-effect border-0 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Input
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
              className="flex-1 border-0 bg-white/50 rounded-xl"
            />
            <Button
              variant="outline"
              size="icon"
              className="bg-white/50 rounded-xl flex-shrink-0"
            >
              <Mic className="w-4 h-4 text-slate-600" />
            </Button>
            <Button
              onClick={handleAddTodo}
              disabled={!newTodo.trim() || isAdding}
              className="gradient-bg text-white rounded-xl px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Todo List */}
      {isLoading ? (
        Array(3).fill(0).map((_, index) => (
          <div key={index} className="glass-effect rounded-2xl p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-slate-200 rounded-full" />
              <div className="flex-1 h-4 bg-slate-200 rounded" />
            </div>
          </div>
        ))
      ) : (
        <AnimatePresence>
          {todos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-slate-500"
            >
              <Circle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>{searchQuery ? `No tasks match "${searchQuery}"` : "No tasks yet. Add one above!"}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {todos.filter(t => !t.completed).map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={handleToggleTodo}
                  onEdit={handleEditTodo}
                  onDelete={handleDeleteTodo}
                  onShowSource={handleShowSource}
                  onShowTips={handleShowTips}
                  isCompleting={completingIds.includes(todo.id)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Modals */}
      <EditTodoModal
        todo={editingTodo}
        isOpen={!!editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={handleSaveTodo}
      />
      
      <SourceRecordingModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        item={selectedTodo}
        itemType="todo"
      />
      
      <AITipsModal
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        item={selectedTodo}
        itemType="todo"
      />
    </div>
  );
}
