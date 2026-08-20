import type { AlertRow, ProjectRow } from "./database.types";
import { createSupabaseServerClient } from "./supabase";

export type AlertWithProject = AlertRow & {
  project_name: string | null;
  project_id: string | null;
};

export async function getAlerts() {
  const client = createSupabaseServerClient();

  if (!client) {
    return { alerts: [] as AlertWithProject[], error: "Supabase is not configured. Add the required variables to .env.local." };
  }

  const [alertsResult, projectsResult] = await Promise.all([
    client.from("alerts").select("id, project_code, severity, title, description, created_at").order("created_at", { ascending: false }),
    client.from("projects").select("id, project_code, name"),
  ]);

  const error = alertsResult.error ?? projectsResult.error;
  const projectsByCode = new Map((projectsResult.data ?? []).map((project: Pick<ProjectRow, "id" | "project_code" | "name">) => [project.project_code, project]));

  return {
    alerts: (alertsResult.data ?? []).map((alert) => {
      const project = alert.project_code ? projectsByCode.get(alert.project_code) : undefined;
      return { ...alert, project_name: project?.name ?? null, project_id: project?.id ?? null };
    }),
    error: error ? `Supabase query failed: ${error.message}` : null,
  };
}