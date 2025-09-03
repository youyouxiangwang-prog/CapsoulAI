
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Sparkles, Brain, Search, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PremiumUpgradeModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Segmentation",
      description: "Automatically organize conversations into logical topics"
    },
    {
      icon: Search,
      title: "Contextual Search",
      description: "Search within transcripts with intelligent highlighting"
    },
    {
      icon: Users,
      title: "Speaker Identification",
      description: "Edit and customize speaker names with auto-suggestions"
    },
    {
      icon: Calendar,
      title: "Smart Extraction",
      description: "Auto-extract notes, reminders, schedules, and to-dos"
    }
  ];

  const plans = [
    {
      name: "Premium Monthly",
      price: "$19",
      period: "/month",
      features: ["All AI features", "Unlimited transcripts", "Advanced search", "Priority support"]
    },
    {
      name: "Premium Yearly",
      price: "$190",
      period: "/year",
      features: ["All AI features", "Unlimited transcripts", "Advanced search", "Priority support", "2 months free"],
      popular: true
    }
  ];

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
                  <p className="text-purple-100">Unlock the full power of AI-enhanced transcripts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <feature.icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`relative ${plan.popular ? 'border-purple-300 shadow-lg' : 'border-slate-200'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-slate-500">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className={`w-full ${plan.popular ? 'gradient-bg text-white' : 'border border-slate-300'}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={handleUpgradeClick}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Choose {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 mb-4">
                Start your 7-day free trial. Cancel anytime.
              </p>
              <div className="flex justify-center items-center gap-6 text-sm text-slate-500">
                <span>✓ No setup fees</span>
                <span>✓ Cancel anytime</span>
                <span>✓ 30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
