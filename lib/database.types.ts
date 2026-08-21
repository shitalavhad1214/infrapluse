export type ProjectRow = {
  id: string;
  project_code: string;
  name: string;
  sector: string;
  location: string | null;
  progress: number | null;
  planned_progress: number | null;
  status: string | null;
  risk_score: number | null;
  risk_level: string | null;
  expected_end_date: string | null;
  description: string | null;
  created_at: string | null;
};

export type MilestoneRow = {
  id: string;
  project_code: string | null;
  title: string;
  description: string | null;
  planned_date: string | null;
  completed_date: string | null;
  status: string | null;
  created_at: string | null;
};

export type ProgressUpdateRow = {
  id: string;
  project_code: string | null;
  progress: number;
  remarks: string | null;
  update_date: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
};

export type AlertRow = {
  id: number;
  project_code: string | null;
  severity: string;
  title: string;
  description: string | null;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow>;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      milestones: {
        Row: MilestoneRow;
        Insert: Partial<MilestoneRow>;
        Update: Partial<MilestoneRow>;
        Relationships: [];
      };
      progress_updates: {
        Row: ProgressUpdateRow;
        Insert: Partial<ProgressUpdateRow>;
        Update: Partial<ProgressUpdateRow>;
        Relationships: [];
      };
      alerts: {
        Row: AlertRow;
        Insert: Partial<AlertRow>;
        Update: Partial<AlertRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};