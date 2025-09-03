import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Brain, TrendingUp, GitMerge, ArrowRight, Crown, Sparkles } from 'lucide-react';

export default function AITipsModal({ isOpen, onClose, item, itemType }) {
  const [isLoading, setIsLoading] = useState(true);
  const [tips, setTips] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      generateTips();
    }
  }, [isOpen, item]);

  const generateTips = () => {
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockTips = {
        importance: {
          level: "High Priority",
          reasoning: "This task is critical because it was mentioned in 3 separate meetings and impacts the Q3 launch timeline. Two other deliverables depend on its completion.",
          impactScore: 8.5
        },
        mergeSuggestions: [
          {
            id: "merge_1",
            title: "Finalize Q3 marketing deck",
            reason: "Similar scope and timeline. Both involve design review with the same stakeholders.",
            confidence: 85
          },
          {
            id: "merge_2", 
            title: "Review brand guidelines update",
            reason: "Related to the same project workflow. Could be handled in a single design session.",
            confidence: 72
          }
        ],
        nextActions: [
          {
            action: "Schedule design review meeting",
            timeline: "Within 2 days",
            reason: "Get early feedback before investing too much time in the wrong direction."
          },
          {
            action: "Create shared workspace folder",
            timeline: "Today",
            reason: "Ensure all stakeholders can access drafts and provide async feedback."
          },
          {
            action: "Set up progress check-in",
            timeline: "Mid-week",
            reason: "Based on similar past tasks, a mid-week checkpoint reduces last-minute rushes."
          }
        ]
      };
      
      setTips(mockTips);
      setIsLoading(false);
    }, 2000);
  };

  if (!item) return null;

  const ImportanceCard = ({ data }) => (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">Importance Analysis</h4>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-orange-700">{data.impactScore}/10</span>
            <div className="w-16 h-2 bg-orange-200 rounded-full">
              <div 
                className="h-full bg-orange-500 rounded-full" 
                style={{ width: `${(data.impactScore / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
            {data.level}
          </span>
        </div>
        <p className="text-slate-700 leading-relaxed">{data.reasoning}</p>
      </CardContent>
    </Card>
  );

  const MergeCard = ({ suggestions }) => (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Merge Suggestions</h4>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h5 className="font-medium text-slate-800 flex-1">{suggestion.title}</h5>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                {suggestion.confidence}% match
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{suggestion.reason}</p>
          </div>
        ))}
        {suggestions.length === 0 && (
          <p className="text-blue-700 italic text-center py-4">
            No similar tasks found for merging at this time.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const ActionsCard = ({ actions }) => (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-green-800">Recommended Next Actions</h4>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h5 className="font-medium text-slate-800 flex-1">{action.action}</h5>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                {action.timeline}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{action.reason}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Tips & Insights
            <Crown className="w-4 h-4 text-yellow-500" />
          </DialogTitle>
          <p className="text-slate-600">
            AI-powered analysis for: <strong>"{item?.title || item?.content}"</strong>
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center mb-4">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600">Analyzing your task with AI...</p>
            <p className="text-sm text-slate-500 mt-1">This may take a few moments</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Premium Badge */}
            <div className="bg-gradient-to-r from-purple-100 to-yellow-100 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Premium AI Analysis</span>
                <Crown className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Get deeper insights into your tasks and optimize your workflow
              </p>
            </div>

            {/* Analysis Cards */}
            <ImportanceCard data={tips.importance} />
            <MergeCard suggestions={tips.mergeSuggestions} />
            <ActionsCard actions={tips.nextActions} />

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <Button 
                variant="outline"
                onClick={() => console.log('Apply AI suggestions:', tips)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply Suggestions
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}