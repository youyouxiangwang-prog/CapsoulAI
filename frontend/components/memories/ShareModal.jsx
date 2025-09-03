import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Share2, FileText, Headphones, Brain, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

export default function ShareModal({ isOpen, onClose, recording }) {
  const [options, setOptions] = useState({
    audio: true,
    summary: true,
    transcript: true,
  });
  const { toast } = useToast();

  const handleCheckboxChange = (option) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleCopyLink = () => {
    const shareableLink = `${window.location.origin}/share/recording/${recording.id}?options=${Object.keys(options).filter(k => options[k]).join(',')}`;
    navigator.clipboard.writeText(shareableLink);
    toast({
      description: (
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-500" />
          <span>Link copied to clipboard!</span>
        </div>
      ),
    });
  };

  const handleShare = async () => {
    const shareableLink = `${window.location.origin}/share/recording/${recording.id}?options=${Object.keys(options).filter(k => options[k]).join(',')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Capsoul Recording: ${recording.name}`,
          text: `Check out this recording from Capsoul: ${recording.name}`,
          url: shareableLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'summary', label: 'Summary', icon: Brain },
    { id: 'transcript', label: 'Transcript', icon: FileText },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Share Recording</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6">Choose what you want to include in the shareable link.</p>

            <div className="space-y-4 mb-8">
              {shareOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={options[option.id]}
                    onCheckedChange={() => handleCheckboxChange(option.id)}
                  />
                  <Label htmlFor={option.id} className="flex items-center gap-2 text-base font-medium text-slate-700 cursor-pointer">
                    <option.icon className="w-5 h-5 text-slate-500" />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCopyLink} variant="outline" className="w-full">
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={handleShare} className="w-full gradient-bg text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}