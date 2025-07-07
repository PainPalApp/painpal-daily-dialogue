import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Pill, FileText, AlertTriangle } from 'lucide-react';

interface PainEntry {
  id: number;
  date: string;
  timestamp: string;
  painLevel: number | null;
  location: string[];
  triggers: string[];
  medications: any[];
  notes: string;
  symptoms: string[];
  status: string;
}

export const InsightsSection = () => {
  const [painData, setPainData] = useState<PainEntry[]>([]);

  useEffect(() => {
    const savedData = localStorage.getItem('painTrackingData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPainData(parsed || []);
      } catch (error) {
        console.error('Error parsing pain data:', error);
        setPainData([]);
      }
    }

    // Listen for pain data updates
    const handlePainDataUpdate = () => {
      const updatedData = localStorage.getItem('painTrackingData');
      if (updatedData) {
        try {
          const parsed = JSON.parse(updatedData);
          setPainData(parsed || []);
        } catch (error) {
          console.error('Error parsing updated pain data:', error);
        }
      }
    };

    window.addEventListener('painDataUpdated', handlePainDataUpdate);
    return () => window.removeEventListener('painDataUpdated', handlePainDataUpdate);
  }, []);

  // Group entries by date
  const groupedEntries = painData.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, PainEntry[]>);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPainLevelColor = (level: number | null) => {
    if (level === null) return 'bg-muted';
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (painData.length === 0) {
    return (
      <div className="flex-1 bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Daily Insights</h1>
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Entries Yet</h3>
                <p className="text-muted-foreground">Start tracking your pain to see insights here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Daily Insights</h1>
        
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const entries = groupedEntries[date];
            const avgPain = entries
              .filter(e => e.painLevel !== null)
              .reduce((sum, e) => sum + (e.painLevel || 0), 0) / 
              entries.filter(e => e.painLevel !== null).length;

            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(date)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </Badge>
                      {!isNaN(avgPain) && (
                        <Badge 
                          variant="outline" 
                          className={`text-white ${getPainLevelColor(Math.round(avgPain))}`}
                        >
                          Avg: {avgPain.toFixed(1)}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {entries
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((entry, index) => (
                        <div key={entry.id}>
                          {index > 0 && <Separator className="my-4" />}
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {formatTime(entry.timestamp)}
                                </span>
                                {entry.painLevel !== null && (
                                  <Badge 
                                    variant="outline"
                                    className={`text-white ${getPainLevelColor(entry.painLevel)}`}
                                  >
                                    Pain: {entry.painLevel}/10
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {entry.location && entry.location.length > 0 && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.location.map((loc, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {loc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.triggers && entry.triggers.length > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.triggers.map((trigger, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {trigger}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.medications && entry.medications.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.medications.map((med, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {typeof med === 'string' ? med : med.name || 'Medication'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.notes && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-foreground">{entry.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};