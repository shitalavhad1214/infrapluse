import type { Metadata } from "next";
import { getProjects } from "@/lib/projects";
import ProjectsTable from "./ProjectsTable";

export const metadata: Metadata = { title: "Projects | InfraPulse" };

export default async function ProjectsPage() {
  const { projects, error } = await getProjects();

  return <div className="projects-page"><header className="projects-page-header"><a className="projects-brand" href="/dashboard"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><b>IP</b></span><span>Infra<span>Pulse</span></span></a><nav><a href="/dashboard">Overview</a><a className="current" href="/projects">Projects</a><a href="/dashboard#alerts">Alerts</a></nav><a className="projects-back" href="/dashboard">Back to dashboard</a></header><main className="projects-content"><div className="projects-heading"><div><p className="eyebrow">PORTFOLIO DIRECTORY</p><h1>Projects</h1><p>Review every infrastructure project and its current delivery position.</p></div><div className="projects-total"><strong>{projects.length}</strong><span>projects in database</span></div></div>{error && <div className="data-notice" role="alert"><strong>Project data unavailable</strong><span>{error}</span></div>}<section className="projects-panel-card"><ProjectsTable projects={projects} /></section></main></div>;
}