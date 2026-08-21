"use client";

import { useMemo, useState } from "react";
import type { AlertWithProject } from "@/lib/alerts";

function formatDate(value: string | null) {
  if (!value) return "Date not provided";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function severityClass(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}

export default function AlertsTable({ alerts }: { alerts: AlertWithProject[] }) {
  const [severity, setSeverity] = useState("All severities");
  const severities = useMemo(() => ["All severities", ...Array.from(new Set(alerts.map((alert) => alert.severity))).sort()], [alerts]);
  const filteredAlerts = alerts.filter((alert) => severity === "All severities" || alert.severity === severity);

  return <>
    <div className="alerts-filters"><label>Filter by severity<select value={severity} onChange={(event) => setSeverity(event.target.value)}>{severities.map((value) => <option key={value}>{value}</option>)}</select></label><label>Resolution status<select disabled defaultValue="Unavailable"><option>Unavailable in database</option></select></label></div>
    <div className="alerts-count">Showing {filteredAlerts.length} of {alerts.length} alerts</div>
    <div className="alerts-directory-wrap">{filteredAlerts.length ? <table className="alerts-directory-table"><thead><tr><th>Severity</th><th>Alert message</th><th>Project</th><th>Project ID</th><th>Date / time</th><th>Resolution</th></tr></thead><tbody>{filteredAlerts.map((alert) => <tr key={alert.id}><td><span className={`alert-severity severity-${severityClass(alert.severity)}`}><i />{alert.severity}</span></td><td><strong>{alert.title}</strong><small>{alert.description ?? "No description provided"}</small></td><td>{alert.project_name ?? "Project unavailable"}</td><td className="project-code">{alert.project_code ?? "Not provided"}</td><td>{formatDate(alert.created_at)}</td><td><span className="resolution-unavailable">Not provided</span></td></tr>)}</tbody></table> : <div className="alerts-empty">No alerts match the selected severity.</div>}</div>
  </>;
}