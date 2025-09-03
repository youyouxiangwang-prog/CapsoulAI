import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Clock, MapPin, User, Mic } from 'lucide-react';
import { format } from 'date-fns';

export default function SourceRecordingModal({ isOpen, onClose, item, itemType }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!item) return null;

  // Mock source recording data based on item
  const mockSourceData = {
    recordingId: item.source_recording_id || "rec_12345",
    recordingName: "Team Meeting - Q3 Planning",
    timestamp: "00:14:32",
    segmentTitle: "Action Items Discussion",
    originalDialogue: [
      {
        speaker: "Sarah",
        time: "00:14:32",
        text: "We need someone to follow up on the wireframes for the user onboarding flow."
      },
      {
        speaker: "Alex",
        time: "00:14:45", 
        text: "I can take that on. When do you need it by?"
      },
      {
        speaker: "Sarah",
        time: "00:14:50",
        text: "Let's aim for next Friday so we can review it in the following week's meeting."
      }
    ],
    recordingDate: new Date('2024-02-15T14:30:00'),
    location: "Conference Room A"
  };

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Mock audio playback - in real app this would control actual audio
    console.log(`Playing audio from ${mockSourceData.timestamp}`);
    
    // Simulate audio playing for 3 seconds
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            Source Recording
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recording Info */}
          <Card className="bg-slate-50 border border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-lg mb-2">
                    {mockSourceData.recordingName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Timestamp: {mockSourceData.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{mockSourceData.location}</span>
                    </div>
                    <div className="col-span-full">
                      <strong>Segment:</strong> {mockSourceData.segmentTitle}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePlayAudio}
                  className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'gradient-bg'} text-white flex items-center gap-2`}
                >
                  <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                  {isPlaying ? 'Playing...' : 'Play'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Original Dialogue */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Original Dialogue
            </h4>
            <div className="space-y-3">
              {mockSourceData.originalDialogue.map((line, index) => (
                <Card key={index} className="border border-slate-200">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {line.speaker.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-500 mt-1">{line.time}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-700 text-sm mb-1">{line.speaker}</div>
                        <p className="text-slate-600 leading-relaxed">{line.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How this became an item */}
          <Card className="border-l-4 border-blue-500 bg-blue-50/50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-2">AI Reasoning</h4>
              <p className="text-blue-700 text-sm leading-relaxed italic">
                "This {itemType} was automatically generated because the conversation included 
                a clear action item assignment ('I can take that on') with a specific deadline 
                ('next Friday'). The system detected ownership transfer and time-bound commitment."
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => console.log(`Navigate to full recording: ${mockSourceData.recordingId}`)}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              View Full Recording
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}