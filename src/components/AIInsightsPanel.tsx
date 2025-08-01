import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Brain, TrendingUp, AlertTriangle, Pill, Lightbulb } from 'lucide-react';
import { useAICompanion } from '@/hooks/useAICompanion';
import { formatDistanceToNow } from 'date-fns';

interface AIInsightsPanelProps {
  className?: string;
}

const insightIcons = {
  pattern: Brain,
  trend: TrendingUp,
  suggestion: Lightbulb,
  warning: AlertTriangle,
  medication_analysis: Pill
};

const insightColors = {
  pattern: 'bg-blue-500/10 text-blue-700 border-blue-200',
  trend: 'bg-green-500/10 text-green-700 border-green-200',
  suggestion: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  warning: 'bg-red-500/10 text-red-700 border-red-200',
  medication_analysis: 'bg-purple-500/10 text-purple-700 border-purple-200'
};

export function AIInsightsPanel({ className }: AIInsightsPanelProps) {
  const { insights, isLoading, fetchInsights, dismissInsight } = useAICompanion();
  const [isDismissing, setIsDismissing] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleDismissInsight = async (insightId: string) => {
    setIsDismissing(insightId);
    try {
      await dismissInsight(insightId);
    } finally {
      setIsDismissing(null);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Loading your personalized insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            I'm analyzing your pain patterns to provide personalized insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No insights available yet.</p>
            <p className="text-xs mt-1">
              Keep logging your pain and I'll start providing personalized insights!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Personalized insights from your pain patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const IconComponent = insightIcons[insight.insight_type];
          const colorClass = insightColors[insight.insight_type];
          
          return (
            <div 
              key={insight.id} 
              className={`relative p-4 rounded-lg border ${colorClass} transition-all duration-200`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/50"
                onClick={() => handleDismissInsight(insight.id)}
                disabled={isDismissing === insight.id}
              >
                <X className="h-3 w-3" />
              </Button>
              
              <div className="flex items-start gap-3 pr-8">
                <div className="flex-shrink-0 mt-0.5">
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${getConfidenceColor(insight.confidence_score || 0)}`}
                      >
                        {Math.round((insight.confidence_score || 0) * 100)}% confidence
                      </Badge>
                      
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {insight.data_sources && Array.isArray(insight.data_sources) && insight.data_sources.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs opacity-70">
                        Based on {insight.data_sources.length} data point{insight.data_sources.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => fetchInsights(20)}
        >
          Load More Insights
        </Button>
      </CardContent>
    </Card>
  );
}