"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/projects";

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusClass(value: string | null) {
  return (value ?? "unknown").toLowerCase().replaceAll(" ", "-");
}

function riskLabel(project: Project) {
  return project.risk_level ?? (project.risk_score === null ? "Not provided" : String(project.risk_score));
}

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [status, setStatus] = useState("All statuses");
  const sectors = useMemo(() => ["All sectors", ...Array.from(new Set(projects.map((project) => project.sector))).sort()], [projects]);
  const statuses = useMemo(() => ["All statuses", ...Array.from(new Set(projects.map((project) => project.status ?? "Not provided"))).sort()], [projects]);
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sector === "All sectors" || project.sector === sector;
    const matchesStatus = status === "All statuses" || (project.status ?? "Not provided") === status;
    return matchesSearch && matchesSector && matchesStatus;
  });

  return <>
    <div className="projects-filters">
      <label className="project-search"><span className="search-glyph">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project name" aria-label="Search by project name" /></label>
      <select value={sector} onChange={(event) => setSector(event.target.value)} aria-label="Filter by sector">{sectors.map((value) => <option key={value}>{value}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">{statuses.map((value) => <option key={value}>{value}</option>)}</select>
    </div>
    <div className="projects-count">Showing {filteredProjects.length} of {projects.length} projects</div>
    <div className="project-table-wrap">{filteredProjects.length ? <table className="project-directory-table"><thead><tr><th>Project</th><th>Project ID</th><th>Sector</th><th>Location</th><th>Progress</th><th>Status</th><th>Risk</th><th>Planned completion</th><th>Predicted completion</th></tr></thead><tbody>{filteredProjects.map((project) => <tr key={project.id} className="project-row" onClick={() => { window.location.href = `/projects/${encodeURIComponent(project.id)}`; }} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") window.location.href = `/projects/${encodeURIComponent(project.id)}`; }}><td><strong>{project.name}</strong><small>{project.location ?? "Location unavailable"}</small></td><td className="project-code">{project.id}</td><td>{project.sector}</td><td>{project.location ?? "Not provided"}</td><td><div className="directory-progress"><strong>{project.progress ?? 0}%</strong><span><i style={{ width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%` }} /></span></div></td><td><span className={`directory-status status-${statusClass(project.status)}`}><i />{project.status ?? "Not provided"}</span></td><td><span className={`risk-label risk-${(project.risk_level ?? "unknown").toLowerCase()}`}>{riskLabel(project)}</span></td><td>{formatDate(project.expected_end_date)}</td><td className="not-provided">Not provided</td></tr>)}</tbody></table> : <div className="projects-empty">No projects match the selected filters.</div>}</div>
  </>;
}