// src/components/memories/NewRecordingModal.jsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Recording } from "@/api/localApi";

export default function NewRecordingModal({ isOpen, onClose, onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    participants: "",
  });
  const [activeTab, setActiveTab] = useState('upload');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [permissionError, setPermissionError] = useState("");
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  // 处理文件选择
  const handleFileChange = (e) => {
    setUploadError("");
    const file = e.target.files[0];
    if (file && file.type.startsWith("audio")) {
      setUploadFile(file);
    } else {
      setUploadError("The uploaded file is not a valid audio file.");
      setUploadFile(null);
    }
  };

  // 获取音频文件时长
  const getAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.src = url;
      audio.addEventListener("loadedmetadata", () => {
    resolve(audio.duration);
    URL.revokeObjectURL(url);
      });
      audio.addEventListener("error", (e) => {
    reject(e);
    URL.revokeObjectURL(url);
      });
    });
  };

  // 构建消息的 FormData
  const buildRecordingFormData = ({ id, name, location, participants, started_at, duration, audioFile }) => {
    const fd = new FormData();
    fd.append('id', id);
    fd.append('name', name);
    fd.append('location', location);
    fd.append('participants', JSON.stringify(participants));
    fd.append('started_at', started_at);
    fd.append('duration', duration);
    fd.append('audioFile', audioFile);
    return fd;
  };

  // 上传文件并保存
  const handleUploadFile = async () => {
    if (!uploadFile) {
      setUploadError("The uploaded file is not a valid audio file.");
      return;
    }
    setIsProcessing(true);
    try {
      const durationSec = await getAudioDuration(uploadFile);
      const durationMs = Math.round(durationSec * 1000);
      const newRecording = buildRecordingFormData({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: formData.name,
        location: formData.location,
        participants: formData.participants
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p),
        started_at: new Date(Date.now() - durationMs).toISOString(),
        duration: durationMs,
        audioFile: uploadFile,
      });
      const saved = await Recording.create(newRecording);
      onSave(saved);
      onClose();
      setFormData({ name: "", location: "", participants: "" });
      setUploadFile(null);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
      console.error("Error uploading recording:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 启动录音，获取麦克风权限
  const handleStartRecording = async () => {
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setRecordingStartTime(new Date().toISOString());
      setIsRecording(true);
    } catch (err) {
      setPermissionError("Cannot access microphone. Please check your settings.");
    }
  };

  // 停止录音并保存数据
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    try {
      // 停止录音
      const mediaRecorder = mediaRecorderRef.current;
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        await new Promise((resolve) => {
          const prev = mediaRecorder.onstop;
          mediaRecorder.onstop = (...args) => { try { prev && prev(...args); } finally { resolve(); } };
          mediaRecorder.stop();
        });
      }
      try { mediaRecorder.stream?.getTracks().forEach(t => t.stop()); } catch {}
      // 生成音频
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `rec_${Date.now()}.webm`, { type: "audio/webm" });
      const duration = (new Date(Date.now()).getTime() - new Date(recordingStartTime).getTime());
      const newRecording = buildRecordingFormData({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: formData.name,
        location: formData.location,
        participants: formData.participants
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p),
        started_at: recordingStartTime || new Date().toISOString(),
        duration: duration,
        audioFile: audioFile,
      });
      // 写入本地存储
      const saved = await Recording.create(newRecording);
      // 通知父组件更新列表并关闭弹窗
      onSave(saved);
      onClose();
      // 重置表单
      setFormData({ name: "", location: "", participants: "" });
      setRecordingStartTime(null);
    } catch (err) {
      console.error("Error saving recording:", err);
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  };

  // 表单输入变更
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景蒙层 */}
          <motion.div
            className="fixed inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 弹窗主体 */}
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-md p-0 shadow-lg overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header: Title + Close Button */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">New Recording</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Tab Switch */}
            <div className="flex border-b bg-gray-50">
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload File
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'record' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('record')}
              >
                Record Audio
              </button>
            </div>
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Error Messages */}
              {permissionError && (
                <div className="text-red-500 text-sm mb-2">{permissionError}</div>
              )}
              {uploadError && (
                <div className="text-red-500 text-sm mb-2">{uploadError}</div>
              )}
              {/* Upload File Tab */}
              {activeTab === 'upload' && !isProcessing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Recording Name (Optional)</label>
                    <Input
                      value={formData.name}
                      onChange={handleChange('name')}
                      placeholder="e.g., Team Meeting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location (Optional)</label>
                    <Input
                      value={formData.location}
                      onChange={handleChange('location')}
                      placeholder="e.g., Zoom Meeting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Participants (Optional)</label>
                    <Input
                      value={formData.participants}
                      onChange={handleChange('participants')}
                      placeholder="e.g., Alice, Bob, Carol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Upload Audio File</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 border rounded-lg p-2 mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleUploadFile}
                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-3 rounded-xl mt-2 shadow"
                    disabled={isProcessing || !uploadFile}
                  >
                    Upload & Add Recording
                  </Button>
                </>
              )}
              {/* Record Audio Tab */}
              {activeTab === 'record' && !isProcessing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Recording Name (Optional)</label>
                    <Input
                      value={formData.name}
                      onChange={handleChange('name')}
                      placeholder="e.g., Team Meeting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location (Optional)</label>
                    <Input
                      value={formData.location}
                      onChange={handleChange('location')}
                      placeholder="e.g., Zoom Meeting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Participants (Optional)</label>
                    <Input
                      value={formData.participants}
                      onChange={handleChange('participants')}
                      placeholder="e.g., Alice, Bob, Carol"
                    />
                  </div>
                  <div className="flex flex-col items-center space-y-6 mt-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-200 to-blue-400 flex items-center justify-center">
                      <Mic className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold">{isRecording ? 'Recording…' : 'Click to start recording'}</h3>
                    <p className="text-sm text-gray-500">{isRecording ? 'Click stop when you are done.' : 'You can record audio directly.'}</p>
                    {!isRecording ? (
                      <Button
                        onClick={handleStartRecording}
                        className="py-2 px-4 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow"
                      >
                        <Mic className="w-5 h-5 mr-2" /> Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopRecording}
                        variant="outline"
                        className="py-2 px-4 rounded-lg border-blue-400 text-blue-600 shadow"
                      >
                        <Square className="w-5 h-5 mr-2" /> Stop Recording
                      </Button>
                    )}
                  </div>
                </>
              )}
              {/* Processing State */}
              {isProcessing && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-blue-300 animate-spin" />
                  <h3 className="text-lg font-semibold">Processing…</h3>
                  <p className="text-sm text-gray-500">Please wait while we save your recording.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
