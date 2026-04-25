export type CandidateStatus =
'pending' |
'in_progress' |
'completed' |
'rejected';

export type CompatibilityLevel =
'not_recommended' |
'recommended_with_reserves' |
'recommended' |
'highly_recommended';

export type ScoreLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type PositionLevel =
'operative' |
'administrative' |
'sales' |
'supervisor' |
'management' |
'executive';

export interface Candidate {
  id: string;
  name: string;
  document: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  education: string;
  phone: string;
  email: string;
  position: string;
  status: CandidateStatus;
  evaluationDate?: string;
  photo?: string;
  compatibility?: number;
  recommendation?: CompatibilityLevel;
}

export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  level: ScoreLevel;
  weight: number;
}

export interface FactorResult {
  name: string;
  score: number;
  level: ScoreLevel;
}

export interface Alert {
  type: 'risk' | 'warning' | 'info';
  message: string;
}

export interface Position {
  id: string;
  name: string;
  area: string;
  level: PositionLevel;
  activeVacancies: number;
  minScore: number;
}

export interface TestWeight {
  testId: string;
  weight: number;
}

export interface PositionWeights {
  positionLevel: PositionLevel;
  weights: TestWeight[];
}