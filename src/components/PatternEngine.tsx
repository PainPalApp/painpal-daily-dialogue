// User pattern learning and smart suggestions engine
interface UserPatterns {
  commonPainLevels: number[];
  frequentLocations: string[];
  commonTriggers: string[];
  effectiveMedications: Array<{name: string, effectiveness: number}>;
  typicalSymptoms: string[];
  timePatterns: {morning: boolean, afternoon: boolean, evening: boolean};
}

export class PatternEngine {
  static getUserPatterns(painHistory: any[]): UserPatterns {
    if (painHistory.length === 0) return {
      commonPainLevels: [],
      frequentLocations: [],
      commonTriggers: [],
      effectiveMedications: [],
      typicalSymptoms: [],
      timePatterns: { morning: false, afternoon: false, evening: false }
    };

    const patterns: UserPatterns = {
      commonPainLevels: this.getCommonPainLevels(painHistory),
      frequentLocations: this.getFrequentLocations(painHistory),
      commonTriggers: this.getCommonTriggers(painHistory),
      effectiveMedications: this.getEffectiveMedications(painHistory),
      typicalSymptoms: this.getTypicalSymptoms(painHistory),
      timePatterns: this.getTimePatterns(painHistory)
    };

    return patterns;
  }

  static generateContextualSuggestions(
    userMessage: string, 
    painHistory: any[], 
    conversationContext: string[]
  ): string[] {
    const patterns = this.getUserPatterns(painHistory);
    const msg = userMessage.toLowerCase();
    const suggestions: string[] = [];

    // Pain level suggestions based on user's history
    if (msg.includes('pain') || msg.includes('hurt') || msg.includes('ache')) {
      if (patterns.commonPainLevels.length > 0) {
        suggestions.push(`Pain level ${patterns.commonPainLevels[0]}`);
      }
      if (patterns.frequentLocations.length > 0) {
        suggestions.push(`${patterns.frequentLocations[0]} pain`);
      }
    }

    // Location-based suggestions from history
    if (msg.includes('head') || msg.includes('headache')) {
      patterns.frequentLocations.forEach(location => {
        if (location.includes('head') || location.includes('temple') || location.includes('forehead')) {
          suggestions.push(`${location} hurts`);
        }
      });
    }

    // Trigger suggestions based on patterns
    if (msg.includes('trigger') || msg.includes('cause') || msg.includes('why')) {
      patterns.commonTriggers.slice(0, 2).forEach(trigger => {
        suggestions.push(`${trigger} trigger`);
      });
    }

    // Medication suggestions from effective history
    if (msg.includes('medication') || msg.includes('medicine') || msg.includes('help')) {
      patterns.effectiveMedications.slice(0, 2).forEach(med => {
        suggestions.push(`Took ${med.name}`);
      });
    }

    // Time-based suggestions
    const currentHour = new Date().getHours();
    if (patterns.timePatterns.morning && currentHour < 12) {
      suggestions.push('Morning headache');
    } else if (patterns.timePatterns.evening && currentHour > 17) {
      suggestions.push('Evening pain');
    }

    // Add quick actions
    suggestions.push('Quick pain log', 'Voice recording');

    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 4);
  }

  private static getCommonPainLevels(history: any[]): number[] {
    const levels = history
      .filter(entry => entry.painLevel && entry.painLevel > 0)
      .map(entry => entry.painLevel);
    
    const frequency = levels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([level]) => parseInt(level));
  }

  private static getFrequentLocations(history: any[]): string[] {
    const allLocations = history
      .flatMap(entry => entry.location || [])
      .filter(Boolean);

    const frequency = allLocations.reduce((acc, location) => {
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([location]) => location);
  }

  private static getCommonTriggers(history: any[]): string[] {
    const allTriggers = history
      .flatMap(entry => entry.triggers || [])
      .filter(Boolean);

    const frequency = allTriggers.reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([trigger]) => trigger);
  }

  private static getEffectiveMedications(history: any[]): Array<{name: string, effectiveness: number}> {
    const medications = history
      .flatMap(entry => entry.medications || [])
      .filter(Boolean);

    const effectiveness = medications.reduce((acc, med) => {
      if (!acc[med.name]) {
        acc[med.name] = { effective: 0, total: 0 };
      }
      acc[med.name].total++;
      if (med.effective) {
        acc[med.name].effective++;
      }
      return acc;
    }, {} as Record<string, {effective: number, total: number}>);

    return Object.entries(effectiveness)
      .map(([name, stats]) => {
        const medStats = stats as {effective: number, total: number};
        return {
          name,
          effectiveness: medStats.total > 0 ? medStats.effective / medStats.total : 0
        };
      })
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 3);
  }

  private static getTypicalSymptoms(history: any[]): string[] {
    const allSymptoms = history
      .flatMap(entry => entry.symptoms || [])
      .filter(Boolean);

    const frequency = allSymptoms.reduce((acc, symptom) => {
      acc[symptom] = (acc[symptom] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([symptom]) => symptom);
  }

  private static getTimePatterns(history: any[]): {morning: boolean, afternoon: boolean, evening: boolean} {
    const timeData = history.map(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    });

    const total = timeData.length;
    const morningCount = timeData.filter(t => t === 'morning').length;
    const afternoonCount = timeData.filter(t => t === 'afternoon').length;
    const eveningCount = timeData.filter(t => t === 'evening').length;

    return {
      morning: morningCount / total > 0.3,
      afternoon: afternoonCount / total > 0.3,
      evening: eveningCount / total > 0.3
    };
  }
}