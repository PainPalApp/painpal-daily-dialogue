export interface ConditionDefaults {
  painLocations: string[];
  relevantBodyAreas: string[];
  painIsConsistent: boolean;
  commonTriggers: string[];
  description: string;
}

// General body areas fallback
export const GENERAL_BODY_AREAS = [
  "Head", "Neck", "Shoulders", "Upper back", "Lower back", 
  "Chest", "Arms", "Elbows", "Wrists", "Hands", 
  "Hips", "Thighs", "Knees", "Calves", "Ankles", "Feet"
];

export const CONDITION_MAPPINGS: Record<string, ConditionDefaults> = {
  migraine: {
    painLocations: ["Forehead", "Temples", "Back of head", "Behind eyes", "Neck"],
    relevantBodyAreas: ["Forehead", "Temples", "Back of head", "Behind eyes", "Face", "Jaw", "Neck", "Shoulders"],
    painIsConsistent: true,
    commonTriggers: ["Stress", "Bright lights", "Loud noises", "Weather changes", "Certain foods", "Lack of sleep", "Dehydration"],
    description: "Migraines often affect specific areas of the head, face, and neck."
  },
  headache: {
    painLocations: ["Forehead", "Temples", "Back of head", "Neck"],
    relevantBodyAreas: ["Forehead", "Temples", "Back of head", "Behind eyes", "Face", "Jaw", "Neck", "Shoulders"],
    painIsConsistent: true,
    commonTriggers: ["Stress", "Eye strain", "Dehydration", "Poor posture", "Lack of sleep"],
    description: "Headaches typically occur in specific head and neck regions."
  },
  arthritis: {
    painLocations: ["Hands", "Fingers", "Wrists", "Knees", "Ankles"],
    relevantBodyAreas: ["Hands", "Fingers", "Wrists", "Elbows", "Shoulders", "Knees", "Ankles", "Hips", "Feet", "Toes"],
    painIsConsistent: true,
    commonTriggers: ["Weather changes", "Cold temperatures", "Physical activity", "Barometric pressure", "Overuse"],
    description: "Arthritis commonly affects joints throughout the body."
  },
  fibromyalgia: {
    painLocations: ["Shoulders", "Upper back", "Lower back", "Neck", "Arms"],
    relevantBodyAreas: ["Neck", "Shoulders", "Upper back", "Lower back", "Arms", "Hips", "Thighs", "Chest"],
    painIsConsistent: false,
    commonTriggers: ["Stress", "Sleep disruption", "Physical exertion", "Weather changes", "Emotional stress"],
    description: "Fibromyalgia involves widespread muscle and soft tissue pain."
  },
  "back pain": {
    painLocations: ["Lower back", "Upper back"],
    relevantBodyAreas: ["Upper back", "Lower back", "Hips", "Neck", "Shoulders"],
    painIsConsistent: true,
    commonTriggers: ["Poor posture", "Physical activity", "Lifting", "Sitting too long", "Stress"],
    description: "Back pain usually affects the spine and surrounding muscle areas."
  },
  sciatica: {
    painLocations: ["Lower back", "Hips", "Thighs"],
    relevantBodyAreas: ["Lower back", "Hips", "Thighs", "Calves", "Feet"],
    painIsConsistent: true,
    commonTriggers: ["Sitting", "Bending", "Coughing", "Sneezing", "Physical activity"],
    description: "Sciatica typically follows the nerve path from lower back down through the legs."
  },
  "chronic pain": {
    painLocations: [],
    relevantBodyAreas: GENERAL_BODY_AREAS,
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