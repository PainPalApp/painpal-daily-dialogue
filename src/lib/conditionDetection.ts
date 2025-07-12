export interface ConditionDefaults {
  painLocations: string[];
  painIsConsistent: boolean;
  commonTriggers: string[];
  description: string;
}

export const CONDITION_MAPPINGS: Record<string, ConditionDefaults> = {
  migraine: {
    painLocations: ["Head", "Neck", "Shoulders"],
    painIsConsistent: true,
    commonTriggers: ["Stress", "Bright lights", "Loud noises", "Weather changes", "Certain foods", "Lack of sleep", "Dehydration"],
    description: "Migraines often affect the head, neck, and shoulder areas consistently."
  },
  headache: {
    painLocations: ["Head", "Neck"],
    painIsConsistent: true,
    commonTriggers: ["Stress", "Eye strain", "Dehydration", "Poor posture", "Lack of sleep"],
    description: "Headaches typically occur in the head and neck regions."
  },
  arthritis: {
    painLocations: ["Hands", "Wrists", "Knees", "Ankles", "Hips"],
    painIsConsistent: true,
    commonTriggers: ["Weather changes", "Cold temperatures", "Physical activity", "Barometric pressure", "Overuse"],
    description: "Arthritis commonly affects joints in hands, wrists, knees, and other joint areas."
  },
  fibromyalgia: {
    painLocations: ["Shoulders", "Upper back", "Lower back", "Neck", "Hips", "Arms", "Thighs"],
    painIsConsistent: false,
    commonTriggers: ["Stress", "Sleep disruption", "Physical exertion", "Weather changes", "Emotional stress"],
    description: "Fibromyalgia typically involves widespread pain that can vary in location."
  },
  "back pain": {
    painLocations: ["Lower back", "Upper back", "Hips"],
    painIsConsistent: true,
    commonTriggers: ["Poor posture", "Physical activity", "Lifting", "Sitting too long", "Stress"],
    description: "Back pain usually affects the spine and surrounding areas consistently."
  },
  sciatica: {
    painLocations: ["Lower back", "Hips", "Thighs", "Calves"],
    painIsConsistent: true,
    commonTriggers: ["Sitting", "Bending", "Coughing", "Sneezing", "Physical activity"],
    description: "Sciatica typically follows the path from lower back down through the legs."
  },
  "chronic pain": {
    painLocations: [],
    painIsConsistent: false,
    commonTriggers: ["Stress", "Weather changes", "Physical activity", "Sleep disruption"],
    description: "Chronic pain can vary greatly between individuals."
  }
};

export function detectCondition(diagnosis: string): ConditionDefaults | null {
  if (!diagnosis || diagnosis.trim().length === 0) {
    return null;
  }

  const normalizedDiagnosis = diagnosis.toLowerCase().trim();
  
  // Check for exact matches first
  for (const [condition, defaults] of Object.entries(CONDITION_MAPPINGS)) {
    if (normalizedDiagnosis.includes(condition)) {
      return defaults;
    }
  }

  // Check for related terms
  const relatedTerms: Record<string, string> = {
    "tension headache": "headache",
    "cluster headache": "headache",
    "rheumatoid": "arthritis",
    "osteoarthritis": "arthritis",
    "joint pain": "arthritis",
    "lower back": "back pain",
    "upper back": "back pain",
    "spine": "back pain",
    "herniated disc": "back pain",
    "disc": "back pain",
    "fibro": "fibromyalgia",
    "widespread pain": "fibromyalgia",
    "nerve pain": "sciatica",
    "neuropathy": "chronic pain"
  };

  for (const [term, condition] of Object.entries(relatedTerms)) {
    if (normalizedDiagnosis.includes(term)) {
      return CONDITION_MAPPINGS[condition];
    }
  }

  return null;
}

export function getSmartDefaults(diagnosis: string): Partial<ConditionDefaults> {
  const detected = detectCondition(diagnosis);
  if (!detected) {
    return {
      painLocations: [],
      painIsConsistent: false,
      commonTriggers: [],
      description: ""
    };
  }
  return detected;
}