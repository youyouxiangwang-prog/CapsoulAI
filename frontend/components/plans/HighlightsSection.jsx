import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Quote, Target, Zap, Brain, Mic } from "lucide-react";
import { format } from "date-fns";

export default function HighlightsSection({ highlights, isLoading }) {
  const categoryConfig = {
    insight: {
      icon: Brain,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      bgColor: "bg-purple-50",
    },
    decision: {
      icon: Target,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      bgColor: "bg-emerald-50",
    },
    action: {
      icon: Zap,
      color: "bg-orange-100 text-orange-700 border-orange-200",
      bgColor: "bg-orange-50",
    },
    quote: {
      icon: Quote,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      bgColor: "bg-blue-50",
    },
    idea: {
      icon: Lightbulb,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      bgColor: "bg-yellow-50",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, index) => (
          <div key={index} className="glass-effect rounded-2xl p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-slate-200 rounded" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Lightbulb className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p>No highlights yet</p>
        <p className="text-sm mt-2">Key insights will appear here from your recordings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlights.map((highlight, index) => {
        const config = categoryConfig[highlight.category] || categoryConfig.insight;
        const IconComponent = config.icon;

        return (
          <motion.div
            key={highlight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Category Header */}
                <div className={`px-4 py-3 ${config.bgColor} border-b border-white/50`}>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={config.color}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {highlight.category}
                    </Badge>
                    <div className="text-xs text-slate-500">
                      {format(new Date(highlight.created_date), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h4 className="font-semibold text-slate-800 leading-tight">
                    {highlight.title}
                  </h4>
                  
                  <p className="text-slate-700 leading-relaxed">
                    {highlight.content}
                  </p>

                  {/* Source Recording Link */}
                  {highlight.source_recording_id && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center text-sm text-slate-500">
                        <Mic className="w-4 h-4 mr-1" />
                        From recording
                        {highlight.timestamp && (
                          <span className="ml-2 px-2 py-1 bg-slate-100 rounded text-xs">
                            {Math.floor(highlight.timestamp / 60)}:{(highlight.timestamp % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}