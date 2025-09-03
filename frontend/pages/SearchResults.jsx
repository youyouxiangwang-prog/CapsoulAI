
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, BarChart3, Bot, Link as LinkIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('query');
    if (searchQuery) {
      setQuery(searchQuery);
      setTimeout(() => setIsLoading(false), 2000);
    } else {
      setIsLoading(false);
    }
  }, [location]);

  // Mock data for AI Robot Startups
  const startupsData = [
    {
      id: 1,
      name: "Aether Robotics",
      founders: "Dr. Aris Thorne",
      features: ["Adaptive Learning", "Human-like Dexterity", "Cloud-based AI Core"],
      summary: "Aether Robotics focuses on creating highly adaptable robots for dynamic manufacturing environments. Their key innovation is a cloud-based AI that allows the entire fleet to learn from a single robot's experience.",
      source_recording_id: "rec_aether_01"
    },
    {
      id: 2,
      name: "CogniForm",
      founders: "Jian Li & Dr. Eva Rostova",
      features: ["Swarm Intelligence", "Modular Design", "Low-power Consumption"],
      summary: "CogniForm develops small, modular robots that work together in swarms to accomplish complex tasks like logistics and automated inventory management. Their low-power design allows for continuous operation.",
      source_recording_id: "rec_cogniform_02"
    },
    {
      id: 3,
      name: "Prometheus Labs",
      founders: "Kenji Tanaka",
      features: ["Emotional Recognition", "Natural Language Interaction", "Service-oriented Tasks"],
      summary: "Prometheus Labs is building humanoid robots for the service industry. Their robots can understand and respond to human emotions, making them ideal for roles in hospitality and customer care.",
      source_recording_id: "rec_prometheus_03"
    },
    {
      id: 4,
      name: "automata.io",
      founders: "Sarah Jenkins",
      features: ["DIY Programmable Platform", "Open-source Software", "Educational Focus"],
      summary: "automata.io provides an open-source platform for building and programming custom robots. They are targeting the education and hobbyist markets to foster the next generation of roboticists.",
      source_recording_id: "rec_automata_04"
    }
  ];

  const comparisonData = [
    { metric: "Funding (M)", aether: 50, cogniform: 35, prometheus: 80, automata: 15 },
    { metric: "Team Size", aether: 60, cogniform: 45, prometheus: 75, automata: 25 },
    { metric: "Tech Readiness (TRL)", aether: 7, cogniform: 8, prometheus: 6, automata: 9 },
    { metric: "Market Fit", aether: 8, cogniform: 7, prometheus: 9, automata: 6 },
  ];

  const relatedConversations = [
    {
      id: "rec_founder_1",
      title: "Coffee Chat with Jian Li",
      summary: "Discussed the future of swarm robotics and challenges in multi-agent coordination.",
      date: "2024-02-15",
      tags: ["Swarm AI", "Jian Li", "CogniForm"]
    },
    {
      id: "rec_ai_ethics_1",
      title: "Panel: The Ethics of Humanoid AI",
      summary: "A deep dive into the societal impact of service robots, featuring a debate on emotional recognition technology.",
      date: "2024-01-20",
      tags: ["AI Ethics", "Robotics", "Prometheus Labs"]
    },
    {
      id: "rec_founder_2",
      title: "Catch-up with Sarah Jenkins",
      summary: "Talked about the open-source community's role in democratizing robotics and the next steps for automata.io.",
      date: "2024-02-01",
      tags: ["Open Source", "Sarah Jenkins", "automata.io"]
    },
      {
      id: "rec_general_ai_1",
      title: "Podcast: AI in Manufacturing",
      summary: "Exploring how cloud-based AI is revolutionizing production lines and supply chain management.",
      date: "2023-12-10",
      tags: ["Cloud AI", "Manufacturing", "Aether Robotics"]
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Capture"))} className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">AI Search Results</h1>
            <p className="text-slate-600">Processing your query...</p>
          </div>
        </motion.div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto gradient-bg rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Analyzing your memories...</h3>
              <p className="text-slate-600">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Capture"))} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">AI Robot Startups</h1>
          <p className="text-slate-600 text-sm">Based on query: "{query}"</p>
        </div>
      </motion.div>

      {/* Quick Entries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {startupsData.map((startup) => (
          <Card key={startup.id} className="glass-effect border-0 rounded-2xl flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-600" />
                {startup.name}
              </CardTitle>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <Users className="w-3 h-3"/> {startup.founders}
              </p>
            </CardHeader>
            <CardContent className="flex-grow">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Features</h4>
              <div className="flex flex-wrap gap-1.5">
                {startup.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{feature}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(createPageUrl(`RecordingDetails?id=${startup.source_recording_id}`))}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Source Recording
              </Button>
            </CardFooter>
          </Card>
        ))}
      </motion.div>

      {/* Comparison Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-effect border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              Startup Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4">
                                Metric
                            </th>
                            {startupsData.map(startup => (
                                <th key={startup.id} scope="col" className="px-6 py-4 text-center whitespace-nowrap">
                                    {startup.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonData.map((row, index) => {
                            const values = startupsData.map(s => row[s.name.split('.')[0].toLowerCase()]);
                            // Filter out undefined values that might occur if a key doesn't exist for a startup
                            const validValues = values.filter(v => typeof v === 'number');
                            const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;

                            return (
                                <tr key={index} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-50/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                                        {row.metric}
                                    </th>
                                    {startupsData.map(startup => {
                                        const value = row[startup.name.split('.')[0].toLowerCase()];
                                        // Ensure value is a number before comparing, otherwise handle as null/undefined
                                        const isMax = typeof value === 'number' && value === maxValue;
                                        return (
                                            <td key={startup.id} className={`px-6 py-4 text-center font-medium ${isMax ? 'text-sky-600 font-bold' : 'text-slate-700'}`}>
                                                {row.metric.includes('(M)') && '$'}
                                                {typeof value === 'number' ? value : '-'}
                                                {row.metric.includes('(M)') && 'M'}
                                                {(row.metric.includes('TRL') || row.metric.includes('Fit')) && '/10'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Related Conversations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-600"/>
            Related Conversations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relatedConversations.map((convo) => (
            <Card 
              key={convo.id} 
              className="glass-effect border-0 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(createPageUrl(`RecordingDetails?id=${convo.id}`))}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-800">{convo.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{format(new Date(convo.date), "MMM d, yyyy")}</p>
                <p className="text-sm text-slate-600 mt-2">{convo.summary}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {convo.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
