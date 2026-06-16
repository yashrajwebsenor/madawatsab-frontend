// Match compatibility is computed on the BACKEND (single source of truth) and
// fetched via ENDPOINTS.PROFILE.COMPATIBILITY. These are only the response types
// the UI renders — do NOT reintroduce client-side scoring here.

export interface CompatibilityDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface MatchCompatibility {
  overallScore: number;
  label: string;
  confidence: number;
  dataPoints: number;
  summary: string;
  reasons: string[];
  dimensions: CompatibilityDimension[];
}
