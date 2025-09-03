
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BarChart, Brain, Heart, Briefcase, Book, User, Utensils, Film, Plane, PieChart, Check, Search, History, X, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Moment } from '../api/localApi';


// Icon mapping for dynamic icon rendering
const iconMap = {
  Briefcase,
  Book,
  User,
  Utensils,
  Film,
  Plane,
  Heart
};

// Simple SVG Pie Chart Component
const SimplePieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const createPath = (item, index) => {
    const percentage = item.value / total;
    const startAngle = cumulativePercentage * 2 * Math.PI;
    const endAngle = (cumulativePercentage + percentage) * 2 * Math.PI;
    
    cumulativePercentage += percentage;
    
    const x1 = 150 + 80 * Math.cos(startAngle);
    const y1 = 150 + 80 * Math.sin(startAngle);
    const x2 = 150 + 80 * Math.cos(endAngle);
    const y2 = 150 + 80 * Math.sin(endAngle);
    
    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    
    return `M 150 150 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="300" height="300" viewBox="0 0 300 300">
        {data.map((item, index) => (
          <path
            key={index}
            d={createPath(item, index)}
            fill={item.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium text-slate-700">
              {item.name} ({item.value}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Time Overview Block with Simple Chart
const TimeOverviewBlock = ({ data }) => {
  const [chartType, setChartType] = useState("pie");

  return (
    <motion.div className="relative p-6 rounded-3xl glass-effect flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-lg">Time Overview</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("pie")}
            className={`p-2 rounded-lg transition-colors ${chartType === "pie" ? "gradient-bg text-white" : "hover:bg-slate-100"}`}
          >
            <PieChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-2 rounded-lg transition-colors ${chartType === "bar" ? "gradient-bg text-white" : "hover:bg-slate-100"}`}
          >
            <BarChart className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        {chartType === "pie" ? (
          <SimplePieChart data={data} />
        ) : (
          <div className="w-full max-w-md">
            {data.map((item, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="text-sm text-slate-600">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const QuoteBlock = ({ quote }) => (
  <motion.div className="p-6 rounded-3xl glass-effect flex flex-col justify-center text-center">
    <p className="text-xl font-semibold italic gradient-text mb-2">"{quote}"</p>
    <p className="text-sm text-slate-500"></p>
  </motion.div>
);

const AiRecapBlock = ({ recap }) => (
  <motion.div className="p-5 rounded-3xl gradient-bg text-white">
    <div className="flex items-center gap-3 mb-4">
      <Brain className="w-6 h-6" />
      <h3 className="font-bold text-lg">AI Recap</h3>
    </div>
    <p className="text-white/95 leading-relaxed text-base">{recap}</p>
    <div className="text-right text-xs text-white/70 mt-3">Powered by Capsoul AI</div>
  </motion.div>
);

const KeyPointsBlock = ({ title, icon: TitleIcon, points, color }) => {
  const [completedIndices, setCompletedIndices] = useState({});

  const handleToggleComplete = (index) => {
    setCompletedIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <motion.div className="p-5 rounded-3xl glass-effect">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-full ${color.bg}`}>
          <TitleIcon className={`w-5 h-5 ${color.text}`} />
        </div>
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>
      </div>
      <ul className="space-y-3">
        {points.map((point, i) => {
          const isCompleted = !!completedIndices[i];
          const PointIcon = iconMap[point.icon] || User; // 使用动态图标映射
          return (
            <li
              key={i}
              className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-slate-800 transition-colors"
              onClick={() => handleToggleComplete(i)}
            >
              <motion.div
                initial={false}
                animate={{ opacity: isCompleted ? 1 : 0, scale: isCompleted ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4 flex-shrink-0 flex items-center justify-center"
              >
                  {isCompleted && <Check className="w-4 h-4 text-green-500" />}
              </motion.div>
              {!isCompleted && <PointIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              <motion.span
                initial={false}
                animate={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? '#94a3b8' : '#475569',
                }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {point.text}
              </motion.span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
};

export default function MomentsPage() {
  const [timeframe, setTimeframe] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 获取仪表板数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const data = await Moment.getDashboard(timeframe);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // 使用回退数据
        setDashboardData({
          time_overview: [
            { name: 'Work', value: 40, color: '#3b82f6' },
            { name: 'Family', value: 30, color: '#8b5cf6' },
            { name: 'Learning', value: 15, color: '#10b981' },
            { name: 'Personal', value: 15, color: '#f97316' },
          ],
          ai_recap: "正在分析您的活动数据，请稍后再试。",
          key_points: {
            work: [
              { text: "回顾本周工作进展", icon: "Briefcase" },
              { text: "计划下周重点任务", icon: "Book" },
            ],
            family: [
              { text: "安排家庭聚餐时间", icon: "Utensils" },
              { text: "计划周末活动", icon: "Heart" },
            ]
          },
          quote: "每一天都是新的开始，充满无限可能。"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  // Mock summary history
  const [summaryHistory, setSummaryHistory] = useState([
    {
      id: 'sum_1',
      query: 'wearable AI related projects',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      timeRange: 'This Year',
      summary: { title: 'Wearable AI Project Journey - Annual Overview' }
    },
    {
      id: 'sum_2', 
      query: 'team meetings and decisions',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      timeRange: 'This Week',
      summary: { title: 'Weekly Team Decision Summary' }
    }
  ]);

  const timeframes = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];
  
  const currentLabel = timeframes.find(t => t.id === timeframe)?.label || 'Today';

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(createPageUrl(`MomentsSearchResults?query=${encodeURIComponent(searchQuery)}`));
  };

  const handleHistoryItemClick = (historyItem) => {
    // Navigate to search results with the historical query
    navigate(createPageUrl(`MomentsSearchResults?query=${encodeURIComponent(historyItem.query)}&historyId=${historyItem.id}`));
    setShowHistoryModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto gradient-bg rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Loading your moments...</h3>
            <p className="text-slate-600">Analyzing your data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with History Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-2xl font-bold gradient-text p-0 h-auto">
              {currentLabel}
              <ChevronDown className="w-5 h-5 ml-2 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {timeframes.map(t => (
              <DropdownMenuItem key={t.id} onSelect={() => setTimeframe(t.id)}>
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          onClick={() => setShowHistoryModal(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          <span className="hidden md:inline">History</span>
        </Button>
      </motion.div>

      {/* AI Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="relative">
          <Input
            placeholder="eg. Show me all my conversations on wearable AI related projects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-4 pr-24 py-3 h-12 text-base glass-effect border-0 rounded-2xl text-slate-700 placeholder:text-slate-400"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 gradient-bg text-white rounded-xl"
          >
            <Search className="w-4 h-4 mr-0 md:mr-2" />
            <span className="hidden md:inline">Search</span>
          </Button>
        </div>
      </motion.div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowHistoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[70vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-slate-600" />
                    Summary History
                  </h2>
                  <p className="text-slate-600">Your previous searches and summaries</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistoryModal(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <div className="space-y-3">
                  {summaryHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all border border-slate-200"
                        onClick={() => handleHistoryItemClick(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800 mb-1">{item.summary.title}</h4>
                              <p className="text-sm text-slate-600 mb-2">Query: "{item.query}"</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{format(item.timestamp, 'MMM d, yyyy h:mm a')}</span>
                                <span>•</span>
                                <span>{item.timeRange}</span>
                              </div>
                            </div>
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-slate-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {summaryHistory.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No summary history yet</p>
                      <p className="text-sm mt-2">Perform searches to build your history</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rest of existing content */}
      {dashboardData && (
        <motion.div 
          className="space-y-6"
          key={timeframe}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Time Overview Block - Full Width */}
          <TimeOverviewBlock data={dashboardData?.time_overview || []} />
          
          {/* AI Recap Block - Full Width */}
          <AiRecapBlock recap={dashboardData?.ai_recap || ""} />

          {/* Work and Family Blocks - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KeyPointsBlock 
              title="Work" 
              icon={Briefcase} 
              points={dashboardData?.key_points?.work || []} 
              color={{bg: 'bg-blue-100', text: 'text-blue-600'}} 
            />
            <KeyPointsBlock 
              title="Family" 
              icon={Heart} 
              points={dashboardData?.key_points?.family || []} 
              color={{bg: 'bg-purple-100', text: 'text-purple-600'}} 
            />
          </div>

          {/* Quote Block - Full Width */}
          <QuoteBlock quote={dashboardData.quote} />
        </motion.div>
      )}
    </div>
  );
}
