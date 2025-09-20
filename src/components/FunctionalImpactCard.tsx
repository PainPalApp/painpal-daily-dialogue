import { ChipPill, EmptyState } from '@/components/lila';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface FunctionalImpactCardProps {
  painData: any[];
  onUseLast7Days: () => void;
  onJumpToToday: () => void;
}

export const FunctionalImpactCard = ({ 
  painData, 
  onUseLast7Days, 
  onJumpToToday 
}: FunctionalImpactCardProps) => {
  // Check if functional_impact or impact_tags columns exist
  const hasFunctionalImpact = painData.some(entry => 
    entry.functional_impact !== undefined && entry.functional_impact !== null
  );
  const hasImpactTags = painData.some(entry => 
    entry.impact_tags !== undefined && entry.impact_tags !== null && entry.impact_tags.length > 0
  );

  // If no relevant data exists, show empty state
  if (!hasFunctionalImpact && !hasImpactTags) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Functional Impact & Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="Track impact to see how pain affects your day."
            actions={
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={onUseLast7Days}
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  Use Last 7 days
                </button>
                <button 
                  onClick={onJumpToToday}
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  Jump to Today
                </button>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate functional impact statistics
  let impactStats = { limited: 0, stopped: 0, bed: 0, total: 0 };
  
  if (hasFunctionalImpact) {
    // Group entries by date and find highest impact per day
    const dailyImpacts = painData.reduce((acc, entry) => {
      if (!entry.functional_impact) return acc;
      
      const date = entry.logged_at?.split('T')[0] || entry.date;
      if (!date) return acc;
      
      const impact = entry.functional_impact.toLowerCase();
      const rank = getRankForImpact(impact);
      
      if (!acc[date] || rank > acc[date].rank) {
        acc[date] = { impact, rank };
      }
      
      return acc;
    }, {} as Record<string, { impact: string; rank: number }>);

    // Count days by impact level
    const totalDays = Object.keys(dailyImpacts).length;
    if (totalDays > 0) {
      Object.values(dailyImpacts).forEach(({ impact }) => {
        if (impact.includes('limited')) impactStats.limited++;
        else if (impact.includes('stopped')) impactStats.stopped++;
        else if (impact.includes('bed')) impactStats.bed++;
      });
      impactStats.total = totalDays;
    }
  }

  // Calculate top impact tags
  let topTags: Array<{ tag: string; count: number }> = [];
  
  if (hasImpactTags) {
    const tagCounts = painData.reduce((acc, entry) => {
      if (entry.impact_tags && Array.isArray(entry.impact_tags)) {
        entry.impact_tags.forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Functional Impact & Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          {/* Impact Statistics */}
          {hasFunctionalImpact && impactStats.total > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Days Affected
              </h4>
              <div className="flex gap-4 text-sm">
                {impactStats.limited > 0 && (
                  <span>
                    Limited{' '}
                    <span className="font-medium">
                      {Math.round((impactStats.limited / impactStats.total) * 100)}%
                    </span>
                  </span>
                )}
                {impactStats.stopped > 0 && (
                  <span>
                    Stopped{' '}
                    <span className="font-medium">
                      {Math.round((impactStats.stopped / impactStats.total) * 100)}%
                    </span>
                  </span>
                )}
                {impactStats.bed > 0 && (
                  <span>
                    Bed{' '}
                    <span className="font-medium">
                      {Math.round((impactStats.bed / impactStats.total) * 100)}%
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Impact Tags */}
          {hasImpactTags && topTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Common Impact Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {topTags.map(({ tag, count }) => (
                  <ChipPill key={tag} variant="outlined">
                    {tag} ({count})
                  </ChipPill>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to rank functional impact severity
function getRankForImpact(impact: string): number {
  const lowerImpact = impact.toLowerCase();
  if (lowerImpact.includes('bed')) return 4;
  if (lowerImpact.includes('stopped')) return 3;
  if (lowerImpact.includes('limited')) return 2;
  if (lowerImpact.includes('none')) return 1;
  return 0;
}