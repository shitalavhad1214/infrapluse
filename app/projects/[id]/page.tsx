import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetails } from "@/lib/projects";

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusClass(value: string | null) {
  return (value ?? "unknown").toLowerCase().replaceAll(" ", "-");
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, milestones, updates, alerts, error } = await getProjectDetails(decodeURIComponent(id));
  if (!project && !error) notFound();

  return <main className="project-detail-page"><Link className="detail-back" href="/projects">← Back to projects</Link>{error ? <div className="data-notice detail-notice"><strong>Project data unavailable</strong><span>{error}</span></div> : project && <>
    <div className="detail-heading"><div><p className="eyebrow">PROJECT DETAIL</p><h1>{project.name}</h1><p>{project.id}</p></div><span className={`directory-status status-${statusClass(project.status)}`}><i />{project.status ?? "Not provided"}</span></div>
    <div className="detail-layout"><div className="detail-main-column"><section className="detail-card detail-overview"><div className="detail-card-heading"><h2>Project overview</h2><span>{project.project_code}</span></div><p className="project-description">{project.description ?? "Description not provided in the database."}</p><div className="detail-grid"><div><span>Sector</span><strong>{project.sector}</strong></div><div><span>Location</span><strong>{project.location ?? "Not provided"}</strong></div><div><span>Progress</span><strong>{project.progress ?? 0}%</strong></div><div><span>Planned progress</span><strong>{project.planned_progress ?? 0}%</strong></div><div><span>Planned completion</span><strong>{formatDate(project.expected_end_date)}</strong></div><div><span>Predicted completion</span><strong className="not-provided">Not provided</strong></div></div></section>
      <section className="detail-card"><div className="detail-card-heading"><h2>Milestones</h2><span>{milestones.length} records</span></div>{milestones.length ? <div className="detail-list">{milestones.map((milestone) => <div className="milestone-row" key={milestone.id}><span className={`milestone-state milestone-${statusClass(milestone.status)}`} /><div><strong>{milestone.title}</strong><p>{milestone.description ?? "No description provided"}</p></div><div className="milestone-date"><small>{milestone.status ?? "Not provided"}</small><span>{formatDate(milestone.completed_date ?? milestone.planned_date)}</span></div></div>)}</div> : <p className="detail-empty">No milestones returned for this project.</p>}</section>
      <section className="detail-card"><div className="detail-card-heading"><h2>Recent progress updates</h2><span>{updates.length} records</span></div>{updates.length ? <div className="detail-list">{updates.map((update) => <div className="update-row" key={update.id}><div className="update-progress">{update.progress}%</div><div><strong>{update.remarks ?? "Progress update"}</strong><p>{formatDate(update.update_date)}</p></div></div>)}</div> : <p className="detail-empty">No progress updates returned for this project.</p>}</section></div>
      <aside className="detail-side-column"><section className="detail-card risk-card"><div className="detail-card-heading"><h2>Risk profile</h2></div><strong className="risk-score">{project.risk_score ?? "Not provided"}</strong><span className={`risk-label risk-${(project.risk_level ?? "unknown").toLowerCase()}`}>{project.risk_level ?? "Risk status not provided"}</span><p>Risk data is read directly from the projects table.</p></section><section className="detail-card"><div className="detail-card-heading"><h2>Alerts</h2><span>{alerts.length} records</span></div>{alerts.length ? <div className="detail-list">{alerts.map((alert) => <div className="detail-alert" key={alert.id}><span className={`severity severity-${alert.severity.toLowerCase()}`} /><div><strong>{alert.title}</strong><p>{alert.description ?? "No description provided"}</p><small>{formatDate(alert.created_at)}</small></div></div>)}</div> : <p className="detail-empty">No alerts returned for this project.</p>}</section><section className="detail-card unavailable-card"><div className="detail-card-heading"><h2>Evidence & photos</h2></div><p>No evidence or photo table exists in the current backend schema.</p></section></aside></div>
  </>}</main>;
}