import { useEffect, useState } from 'react';
import { usePainLogs } from '@/hooks/usePainLogs';
import { format, isToday } from 'date-fns';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PainEntry {
  id: string;
  logged_at: string;
  pain_level: number;
  pain_locations: string[];
  triggers: string[];
  medications: any[];
  notes: string;
}

export function TodaysPainTimeline() {
  const { getTodaysPainLogs } = usePainLogs();
  const [todayEntries, setTodayEntries] = useState<PainEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTodayData = async () => {
      try {
        const entries = await getTodaysPainLogs();
        setTodayEntries(entries || []);
      } catch (error) {
        console.error('Error loading today\'s pain logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayData();
    
    // Listen for new pain entries
    const handlePainUpdate = () => {
      loadTodayData();
    };
    
    window.addEventListener('painDataUpdated', handlePainUpdate);
    return () => window.removeEventListener('painDataUpdated', handlePainUpdate);
  }, [getTodaysPainLogs]);

  const getCurrentPainLevel = () => {
    if (todayEntries.length === 0) return 0;
    return todayEntries[todayEntries.length - 1].pain_level;
  };

  const getPainTrend = () => {
    if (todayEntries.length < 2) return 'stable';
    const current = todayEntries[todayEntries.length - 1].pain_level;
    const previous = todayEntries[todayEntries.length - 2].pain_level;
    
    if (current > previous) return 'increasing';
    if (current < previous) return 'decreasing';
    return 'stable';
  };

  const getPainColor = (level: number) => {
    if (level === 0) return 'bg-green-500';
    if (level <= 3) return 'bg-yellow-400';
    if (level <= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const currentLevel = getCurrentPainLevel();
  const trend = getPainTrend();

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Today's Pain Timeline</h3>
          <div className="flex items-center gap-2">
            {trend === 'increasing' && <TrendingUp className="h-4 w-4 text-red-500" />}
            {trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-green-500" />}
            {trend === 'stable' && <Minus className="h-4 w-4 text-yellow-500" />}
            {currentLevel > 0 && (
              <div className="px-2 py-1 bg-muted rounded-full">
                <span className="text-sm font-medium">{currentLevel}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {todayEntries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pain entries today</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start a conversation to begin tracking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pain level visualization */}
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              {currentLevel > 0 && (
                <div 
                  className={`h-full transition-all duration-500 ${getPainColor(currentLevel)}`}
                  style={{ width: `${(currentLevel / 10) * 100}%` }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground">
                  {currentLevel === 0 ? 'Pain-free' : `Level ${currentLevel}`}
                </span>
              </div>
            </div>

            {/* Timeline entries */}
            <div className="space-y-2">
              {todayEntries.slice(-5).map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className={`w-3 h-3 rounded-full ${getPainColor(entry.pain_level)}`}
                    />
                    <span className="text-muted-foreground font-medium">
                      {formatTime(entry.logged_at)}
                    </span>
                    <span className="text-foreground">
                      Pain level {entry.pain_level}/10
                    </span>
                  </div>
                  
                  {entry.pain_locations && entry.pain_locations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {entry.pain_locations.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{todayEntries.length} entries today</span>
                <span>
                  {trend === 'increasing' && '📈 Trending up'}
                  {trend === 'decreasing' && '📉 Improving'}
                  {trend === 'stable' && '➡️ Stable'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}