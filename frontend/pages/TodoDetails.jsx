import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckSquare, Lightbulb, User, Clock, Calendar as CalendarIcon, Tag, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Todo } from "@/api/localApi";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function TodoDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const todoId = new URLSearchParams(location.search).get('id');
    if (todoId) {
      loadTodo(todoId);
    }
  }, [location]);

  const loadTodo = async (id) => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch a single item: await Todo.get(id);
      // For now, we filter the list.
      const todos = await Todo.list(); 
      const foundTodo = todos.find(t => t.id === id);

      // Mock AI reasoning if it doesn't exist
      if (foundTodo && !foundTodo.ai_reasoning) {
        foundTodo.ai_reasoning = "This task was identified from your conversation about 'Project Apollo'. It appears to be a critical follow-up action based on the mention of 'reviewing wireframes' and a 'Wednesday deadline'. Creating this to-do helps ensure the deadline is not missed.";
      }
      setTodo(foundTodo);

    } catch (error) {
      console.error("Error loading to-do:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-end)]"></div>
      </div>
    );
  }

  if (!todo) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">To-Do Not Found</h2>
            <p className="text-slate-500 mb-6">We couldn't find the details for this task.</p>
            <Button onClick={() => navigate(createPageUrl("Plans"))}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plan
            </Button>
        </div>
    );
  }
  
  const detailItems = [
    { icon: User, label: "Created By", value: todo.created_by ? todo.created_by.split('@')[0] : 'AI' },
    { icon: Clock, label: "Created On", value: format(new Date(todo.created_date), "MMM d, yyyy") },
    { icon: CalendarIcon, label: "Due Date", value: todo.due_date ? format(new Date(todo.due_date), "MMM d, yyyy") : 'Not set' },
    { icon: Flag, label: "Priority", value: todo.priority, isBadge: true, color: {low: 'info', medium: 'warning', high: 'destructive'}[todo.priority] },
    { icon: Tag, label: "Label", value: todo.label, isBadge: true, color: 'secondary' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Plans"))} className="rounded-full flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 truncate">{todo.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect border-0 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckSquare className={`w-6 h-6 ${todo.completed ? 'text-green-500' : 'text-slate-400'}`} />
                  <h2 className="text-xl font-semibold text-slate-800">Task Details</h2>
                </div>
                {todo.description ? (
                  <p className="text-slate-600 leading-relaxed">{todo.description}</p>
                ) : (
                  <p className="text-slate-500 italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-effect border-0 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-semibold text-slate-800">AI Reasoning</h2>
                </div>
                <div className="bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg p-4">
                    <p className="text-slate-700 leading-relaxed italic">
                        "{todo.ai_reasoning}"
                    </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with details */}
          <div className="space-y-6">
            <Card className="glass-effect border-0 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-700 mb-4">Properties</h3>
                <ul className="space-y-3">
                  {detailItems.map(item => (
                    <li key={item.label} className="flex items-center text-sm">
                      <item.icon className="w-4 h-4 mr-3 text-slate-400" />
                      <span className="text-slate-500 w-24">{item.label}</span>
                      {item.isBadge ? (
                        <Badge variant={item.color || 'default'} className="capitalize">{item.value}</Badge>
                      ) : (
                        <span className="font-medium text-slate-700">{item.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}