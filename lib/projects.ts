import type { AlertRow, MilestoneRow, ProgressUpdateRow, ProjectRow } from "./database.types";
import { createSupabaseServerClient } from "./supabase";

export type Project = ProjectRow;

export async function getProjects() {
  const client = createSupabaseServerClient();

  if (!client) {
    return {
      projects: [] as Project[],
      error: "Supabase is not configured. Add the required variables to .env.local.",
    };
  }

  const { data, error } = await client
    .from("projects")
    .select("id, project_code, name, sector, location, progress, planned_progress, status, risk_score, risk_level, expected_end_date, description, created_at")
    .order("created_at", { ascending: false });

  return {
    projects: data ?? [],
    error: error ? `Supabase query failed: ${error.message}` : null,
  };
}

export async function getProject(id: string) {
  const client = createSupabaseServerClient();

  if (!client) {
    return { project: null, error: "Supabase is not configured. Add the required variables to .env.local." };
  }

  const { data, error } = await client
    .from("projects")
    .select("id, project_code, name, sector, location, progress, planned_progress, status, risk_score, risk_level, expected_end_date, description, created_at")
    .eq("id", id)
    .maybeSingle();

  return {
    project: data,
    error: error ? `Supabase query failed: ${error.message}` : null,
  };
}

export async function getProjectDetails(id: string) {
  const client = createSupabaseServerClient();
  if (!client) {
    return { project: null, milestones: [] as MilestoneRow[], updates: [] as ProgressUpdateRow[], alerts: [] as AlertRow[], error: "Supabase is not configured. Add the required variables to .env.local." };
  }

  const projectResult = await client
    .from("projects")
    .select("id, project_code, name, sector, location, progress, planned_progress, status, risk_score, risk_level, expected_end_date, description, created_at")
    .eq("id", id)
    .maybeSingle();

  if (projectResult.error || !projectResult.data) {
    return { project: projectResult.data, milestones: [] as MilestoneRow[], updates: [] as ProgressUpdateRow[], alerts: [] as AlertRow[], error: projectResult.error ? `Supabase query failed: ${projectResult.error.message}` : null };
  }

  const projectCode = projectResult.data.project_code;
  const [milestonesResult, updatesResult, alertsResult] = await Promise.all([
    client.from("milestones").select("id, project_code, title, description, planned_date, completed_date, status, created_at").eq("project_code", projectCode).order("planned_date", { ascending: true }),
    client.from("progress_updates").select("id, project_code, progress, remarks, update_date, latitude, longitude, created_at").eq("project_code", projectCode).order("update_date", { ascending: false }).limit(10),
    client.from("alerts").select("id, project_code, severity, title, description, created_at").eq("project_code", projectCode).order("created_at", { ascending: false }).limit(10),
  ]);
  const error = milestonesResult.error ?? updatesResult.error ?? alertsResult.error;

  return {
    project: projectResult.data,
    milestones: milestonesResult.data ?? [],
    updates: updatesResult.data ?? [],
    alerts: alertsResult.data ?? [],
    error: error ? `Supabase query failed: ${error.message}` : null,
  };
}