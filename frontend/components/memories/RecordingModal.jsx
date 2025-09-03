
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Recording } from "@/api/localApi";
import { InvokeLLM, UploadFile } from "@/api/localApi";

export default function NewRecordingModal({ isOpen, onClose, onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingData, setRecordingData] = useState({
    name: "",
    location: "",
    participants: "",
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setRecordingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const simulateRecording = async () => {
    setIsRecording(true);
    
    // Simulate recording for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsRecording(false);
    setIsProcessing(true);

    try {
      // Simulate AI processing
      const mockTranscript = "This is a sample transcript of the recorded conversation. The participants discussed project milestones and upcoming deadlines.";
      
      const summaryResponse = await InvokeLLM({
        prompt: `Summarize this conversation transcript: "${mockTranscript}"`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            key_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      const newRecording = {
        name: recordingData.name || "New Recording",
        transcript: mockTranscript,
        summary: summaryResponse.summary,
        hashtags: summaryResponse.hashtags || ["general", "meeting"],
        duration: 180,
        date: new Date().toISOString(),
        location: recordingData.location,
        participants: recordingData.participants ? recordingData.participants.split(",").map(p => p.trim()) : [],
        audio_url: "https://example.com/audio.mp3" // Mock URL
      };

      await Recording.create(newRecording);
      onSave(newRecording);
      
      // Reset form
      setRecordingData({
        name: "",
        location: "",
        participants: "",
      });
    } catch (error) {
      console.error("Error processing recording:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">New Recording</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                disabled={isRecording || isProcessing}
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {!isRecording && !isProcessing && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Recording Name
                    </label>
                    <Input
                      placeholder="e.g., Team Meeting, Interview..."
                      value={recordingData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location (Optional)
                    </label>
                    <Input
                      placeholder="e.g., Conference Room A, Zoom..."
                      value={recordingData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Participants (Optional)
                    </label>
                    <Input
                      placeholder="e.g., John, Sarah, Mike..."
                      value={recordingData.participants}
                      onChange={(e) => handleInputChange("participants", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={simulateRecording}
                  className="w-full gradient-bg text-white py-4 rounded-2xl"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              </>
            )}

            {isRecording && (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto gradient-bg rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-sky-500 animate-ping opacity-20"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Recording...</h3>
                  <p className="text-slate-600">Speak clearly for best results</p>
                </div>
                <Button
                  onClick={() => setIsRecording(false)}
                  variant="outline"
                  className="bg-white hover:bg-slate-50 rounded-xl"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto gradient-bg rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Processing...</h3>
                  <p className="text-slate-600">Transcribing and analyzing your recording</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
