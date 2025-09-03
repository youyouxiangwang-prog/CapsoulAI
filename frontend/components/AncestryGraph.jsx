import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Users,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';

const AncestryGraph = ({ ancestry_graphs = [] }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedGraph, setExpandedGraph] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // 获取节点图标
  const getNodeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'conversation': return MessageSquare;
      case 'segment': return Network;
      case 'task': return CheckSquare;
      case 'note': return FileText;
      case 'schedule': return Calendar;
      case 'reminder': return Clock;
      case 'line': return Users;
      default: return FileText;
    }
  };

  // 获取节点颜色
  const getNodeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'conversation': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'segment': return 'bg-indigo-100 border-indigo-300 text-indigo-700';
      case 'task': return 'bg-green-100 border-green-300 text-green-700';
      case 'note': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'schedule': return 'bg-red-100 border-red-300 text-red-700';
      case 'reminder': return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'line': return 'bg-slate-100 border-slate-300 text-slate-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  // 渲染单个节点
  const renderNode = (node, isSource = false) => {
    const Icon = getNodeIcon(node.type);
    const colorClass = getNodeColor(node.type);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${colorClass} ${
          isSource ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        }`}
        onClick={() => setSelectedNode(node)}
      >
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">{node.title}</h4>
            {node.date && (
              <p className="text-xs opacity-70 mt-1">
                {new Date(node.date).toLocaleDateString()}
              </p>
            )}
            <Badge variant="outline" className="text-xs mt-1">
              {node.type}
            </Badge>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render ancestry path
  const renderAncestryPath = (graph) => {
    // Correct hierarchical order: ancestors above, original node below
    const allNodes = [...graph.ancestry_path, graph.source_node];
    
    return (
      <div className="space-y-4">
        {/* Ancestry Path */}
        <div className="relative">
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Ancestry Path
          </h4>
          <div className="relative pl-6">
            {/* Vertical connection line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-300"></div>
            
            {allNodes.map((node, index) => (
              <div key={node.id} className="relative mb-4 last:mb-0">
                {/* Node connection point */}
                <div className="absolute -left-4 top-3 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></div>
                
                {/* Node content */}
                {renderNode(node, index === 0)}
                
                {/* Connection label */}
                {index < allNodes.length - 1 && (
                  <div className="absolute -left-8 top-12 text-xs text-slate-500 bg-white px-1 rounded">
                    Contains
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Origin Story Summary */}
        {graph.path_summary && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Origin Story
            </h4>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-slate-800 leading-relaxed text-sm">
                {graph.path_summary}
              </p>
            </div>
          </div>
        )}

        {/* Related Segments */}
        {graph.related_segments && graph.related_segments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Related Segments
            </h4>
            <div className="grid gap-2">
              {graph.related_segments.map((relSeg, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {renderNode(relSeg.node)}
                  <div className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
                    {relSeg.relationship.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!ancestry_graphs || ancestry_graphs.length === 0) {
    return (
      <Card className="glass-effect border-0 rounded-2xl">
        <CardContent className="p-6 text-center">
          <Network className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">No ancestry graph data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : ''}`}>
      {/* Header control bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-500" />
          Knowledge Graph ({ancestry_graphs.length} path{ancestry_graphs.length !== 1 ? 's' : ''})
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Graph content */}
      <div className="space-y-4">
        {ancestry_graphs.map((graph, index) => (
          <Card key={index} className="glass-effect border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span>Path {index + 1}: {graph.source_node.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {graph.source_node.type}
                    </Badge>
                  </div>
                  {/* Origin story preview when collapsed */}
                  {expandedGraph !== index && graph.path_summary && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                      {graph.path_summary}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedGraph(expandedGraph === index ? -1 : index)}
                >
                  {expandedGraph === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            
            <AnimatePresence>
              {expandedGraph === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent>
                    {renderAncestryPath(graph)}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {/* Node details modal */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedNode(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {React.createElement(getNodeIcon(selectedNode.type), { 
                      className: "w-6 h-6 text-blue-600" 
                    })}
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">{selectedNode.title}</h3>
                      <Badge className="mt-1">{selectedNode.type}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                  >
                    ×
                  </Button>
                </div>
                
                {selectedNode.summary && (
                  <div className="mb-4">
                    <h4 className="font-medium text-slate-700 mb-2">Summary</h4>
                    <p className="text-slate-600 leading-relaxed">{selectedNode.summary}</p>
                  </div>
                )}
                
                {selectedNode.date && (
                  <div className="mb-4">
                    <h4 className="font-medium text-slate-700 mb-2">Date</h4>
                    <p className="text-slate-600">{new Date(selectedNode.date).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedNode.data && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Additional Details</h4>
                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                      {Object.entries(selectedNode.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-slate-600 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-slate-800">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AncestryGraph;
