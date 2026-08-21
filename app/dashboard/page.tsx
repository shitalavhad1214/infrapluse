import type { ReactNode } from "react";
import type { AlertRow, ProjectRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase";

type IconName =
  | "activity"
  | "bell"
  | "building"
  | "chart"
  | "chevron"
  | "clipboard"
  | "map"
  | "menu"
  | "search"
  | "settings"
  | "users";

type Project = {
  project_code: string;
  name: string;
  sector: string;
  location: string;
  progress: number;
  planned_progress: number;
  status: string;
  created_at: string | null;
};

type DashboardAlert = AlertRow & { time: string };

const sectors = ["Education", "Health", "Agriculture", "Transport"];
const sectorTones: Record<string, string> = { Education: "teal", Health: "blue", Agriculture: "gold", Transport: "coral" };

function toProject(row: ProjectRow): Project {
  return { project_code: row.project_code, name: row.name, sector: row.sector, location: row.location ?? "Location unavailable", progress: row.progress ?? 0, planned_progress: row.planned_progress ?? 0, status: row.status ?? "UNKNOWN", created_at: row.created_at };
}

function timeAgo(value: string | null) {
  if (!value) return "Date unavailable";
  const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000));
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

async function loadDashboardData() {
  const client = createSupabaseServerClient();
  if (!client) return { projects: [] as Project[], alerts: [] as DashboardAlert[], error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local." };

  const [{ data: projectRows, error: projectsError }, { data: alertRows, error: alertsError }] = await Promise.all([
    client.from("projects").select("id, project_code, name, sector, location, progress, planned_progress, status, risk_score, risk_level, expected_end_date, description, created_at").order("created_at", { ascending: false }),
    client.from("alerts").select("id, project_code, severity, title, description, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const error = projectsError ?? alertsError;
  return {
    projects: (projectRows ?? []).map(toProject),
    alerts: (alertRows ?? []).map((row) => ({ ...row, time: timeAgo(row.created_at) })),
    error: error ? `Supabase query failed: ${error.message}` : null,
  };
}

function linePath(values: number[]) {
  if (!values.length) return "";
  const points = values.length === 1 ? [values[0], values[0]] : values;
  return points.map((value, index) => `${index === 0 ? "M" : "L"}${(index / (points.length - 1)) * 600} ${190 - Math.min(100, Math.max(0, value)) * 1.6}`).join(" ");
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /><circle cx="9" cy="5" r="1" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20M8 9h2m4 0h2M8 13h2m4 0h2M8 17h2m4 0h2" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 10h6M9 14h4" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-15v15" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H7v-2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8.4 9 9.8 7.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.2 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a4 4 0 0 1 0 8m4 9v-2a4 4 0 0 0-3-3.9" /></>,
  };

  return <svg aria-hidden="true" className="dashboard-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function StatCard({ label, value, change, tone, icon }: { label: string; value: string; change: string; tone: string; icon: IconName }) {
  return <article className={`stat-card stat-${tone}`}><div className="stat-icon"><Icon name={icon} /></div><div><p className="stat-label">{label}</p><p className="stat-value">{value}</p><p className="stat-change">{change}</p></div></article>;
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const statusClass = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-badge status-${statusClass}`}><span />{status}</span>;
}

export default async function Dashboard() {
  const { projects, alerts, error } = await loadDashboardData();
  const totalProjects = projects.length;
  const onTrack = projects.filter((project) => project.status === "ON TRACK").length;
  const atRisk = projects.filter((project) => project.status === "AT RISK").length;
  const delayed = projects.filter((project) => project.status === "DELAYED").length;
  const averageProgress = totalProjects ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / totalProjects) : 0;
  const averagePlanned = totalProjects ? Math.round(projects.reduce((sum, project) => sum + project.planned_progress, 0) / totalProjects) : 0;
  const sectorSummary = sectors.map((name) => {
    const sectorProjects = projects.filter((project) => project.sector === name);
    return { name, count: sectorProjects.length, progress: sectorProjects.length ? Math.round(sectorProjects.reduce((sum, project) => sum + project.progress, 0) / sectorProjects.length) : 0, tone: sectorTones[name] };
  });
  const actualPath = linePath(projects.map((project) => project.progress).reverse());
  const plannedPath = linePath(projects.map((project) => project.planned_progress).reverse());
  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><b>IP</b></span><span>Infra<span>Pulse</span></span></div>
      <div className="sidebar-section-label">COMMAND CENTRE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <a className="nav-item active" href="/dashboard"><Icon name="chart" />Dashboard</a>
        <a className="nav-item" href="/projects"><Icon name="building" />Projects <span className="nav-count">148</span></a>
        <a className="nav-item" href="#map"><Icon name="map" />Map</a>
        <a className="nav-item" href="/alerts"><Icon name="bell" />Alerts <span className="nav-count alert-count">7</span></a>
        <a className="nav-item" href="#field-reports"><Icon name="clipboard" />Field Reports</a>
        <a className="nav-item" href="#analytics"><Icon name="chart" />Analytics</a>
        <a className="nav-item" href="#simulation"><Icon name="activity" />Simulation</a>
        <a className="nav-item" href="#reports"><Icon name="clipboard" />Reports</a>
      </nav>
      <div className="sidebar-bottom"><a className="nav-item" href="#settings"><Icon name="settings" />Settings</a><div className="user-profile"><div className="avatar">AS</div><div><strong>Admin State</strong><small>Government Portal</small></div><Icon name="chevron" size={15} /></div></div>
    </aside>

    <main className="dashboard-main">
      <header className="dashboard-header"><button className="mobile-menu" aria-label="Open navigation"><Icon name="menu" /></button><div><p className="eyebrow">THURSDAY, 20 AUGUST 2026</p><h1>Good morning, Administrator</h1></div><div className="header-actions"><button className="icon-button" aria-label="Search"><Icon name="search" /></button><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" /><span /></button><div className="header-avatar">AS</div></div></header>
      <div className="dashboard-content">
        <section className="welcome-row"><div><h2>National overview</h2><p>Monitor the health and progress of infrastructure projects across the country.</p></div><button className="date-button">Last 30 days <Icon name="chevron" size={15} /></button></section>
        {error && <div className="data-notice" role="alert"><strong>Project data unavailable</strong><span>{error}</span></div>}
        <section className="stats-grid" aria-label="Project statistics"><StatCard label="Total projects" value={String(totalProjects)} change={error ? "Waiting for data connection" : "Live from projects table"} tone="teal" icon="building" /><StatCard label="On track" value={String(onTrack)} change="Live from projects table" tone="green" icon="activity" /><StatCard label="At risk" value={String(atRisk)} change="Live from projects table" tone="gold" icon="chart" /><StatCard label="Delayed" value={String(delayed)} change="Live from projects table" tone="coral" icon="bell" /></section>

        <section className="content-grid">
          <article className="panel progress-panel"><div className="panel-header"><div><h3>Overall project progress</h3><p>Actual vs planned completion across all projects</p></div><div className="legend"><span className="legend-actual" />Actual <span className="legend-planned" />Planned</div></div>{totalProjects ? <div className="line-chart"><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="Overall project progress line chart"><path className="planned-line" d={plannedPath} /><path className="actual-line" d={actualPath} /></svg><div className="chart-x-labels"><span>Earlier projects</span><span>Latest projects</span></div></div></div> : <div className="chart-empty">No project progress data available.</div>}</article>
          <article className="panel sector-panel"><div className="panel-header"><div><h3>Sector performance</h3><p>Average completion by sector</p></div><button className="more-button" aria-label="More sector options">•••</button></div><div className="sector-bars">{sectorSummary.map((sector) => <div className="sector-bar-row" key={sector.name}><div className="sector-name"><span className={`sector-dot dot-${sector.tone}`} />{sector.name}<strong>{sector.progress}%</strong></div><div className="bar-track"><div className={`bar-fill fill-${sector.tone}`} style={{ width: `${sector.progress}%` }} /></div></div>)}</div><div className="sector-total"><span>Projects tracked</span><strong>{totalProjects}</strong></div></article>
        </section>

        <section className="summary-grid"><article className="panel sector-summary"><div className="panel-header"><div><h3>Sector summary</h3><p>Active projects by focus area</p></div><a className="text-link" href="#projects">View all <Icon name="chevron" size={14} /></a></div><div className="summary-cards">{sectorSummary.map((sector) => <div className="summary-item" key={sector.name}><span className={`summary-icon icon-${sector.tone}`}><Icon name={sector.name === "Education" ? "building" : sector.name === "Health" ? "activity" : sector.name === "Agriculture" ? "map" : "chart"} size={17} /></span><div><strong>{sector.count}</strong><span>{sector.name}</span></div></div>)}</div></article><article className="panel system-panel"><div className="panel-header"><div><h3>System status</h3><p>{error ? "Data connection needs attention" : "Database connection operational"}</p></div><span className={error ? "offline-dot" : "online-dot"}><i />{error ? "Offline" : "Online"}</span></div><div className="system-status"><div className="pulse-ring"><Icon name="activity" size={22} /></div><div><strong>{averageProgress}%</strong><span>Average actual progress</span></div><div className="status-divider" /><div><strong>{averagePlanned}%</strong><span>Average planned progress</span></div></div></article></section>

        <section className="bottom-grid"><article className="panel projects-panel" id="projects"><div className="panel-header"><div><h3>Recent projects</h3><p>Latest updates across your portfolio</p></div><a className="text-link" href="#projects">View all projects <Icon name="chevron" size={14} /></a></div><div className="table-wrap">{projects.length ? <table><thead><tr><th>Project</th><th>Sector</th><th>Location</th><th>Progress</th><th>Status</th></tr></thead><tbody>{projects.map((project) => <tr key={project.project_code}><td><strong>{project.name}</strong><small>{project.project_code}</small></td><td>{project.sector}</td><td>{project.location}</td><td><div className="table-progress"><span>{project.progress}%</span><div className="mini-track"><i style={{ width: `${project.progress}%` }} /></div></div></td><td><StatusBadge status={project.status} /></td></tr>)}</tbody></table> : <div className="table-empty">No projects returned from the projects table.</div>}</div></article><article className="panel alerts-panel" id="alerts"><div className="panel-header"><div><h3>Recent alerts</h3><p>Items requiring attention</p></div><span className="alert-total">{alerts.length} active</span></div><div className="alerts-list">{alerts.length ? alerts.map((alert) => <div className="alert-item" key={alert.id}><span className={`severity severity-${alert.severity.toLowerCase()}`} /> <div><strong>{alert.title}</strong><p>{alert.description ?? "No description provided"}</p><small>{alert.time}</small></div><Icon name="chevron" size={15} /></div>) : <div className="table-empty">No alerts returned from the alerts table.</div>}</div><a className="all-alerts" href="#alerts">View alert centre <Icon name="chevron" size={14} /></a></article></section>
      </div>
    </main>
  </div>;
}