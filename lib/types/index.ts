// Project type matching Supabase schema
export interface Project {
  id: string;
  project_code: string;
  name: string;
  sector: string;
  location: string | null;
  district: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  progress: number;
  planned_progress: number | null;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  description: string | null;
  created_at: string;
}

// Milestone type
export interface Milestone {
  id: string;
  project_code: string;
  title: string;
  description: string | null;
  planned_date: string | null;
  completed_date: string | null;
  status: string;
  created_at: string;
}

// Progress update type
export interface ProgressUpdate {
  id: string;
  project_code: string;
  progress: number;
  remarks: string | null;
  update_date: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

// Alert type
export interface Alert {
  id: number;
  project_code: string;
  severity: string;
  title: string;
  description: string | null;
  created_at: string;
}
