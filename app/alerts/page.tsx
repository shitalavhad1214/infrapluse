import type { Metadata } from "next";
import { getAlerts } from "@/lib/alerts";
import AlertsTable from "./AlertsTable";

export const metadata: Metadata = { title: "Alerts | InfraPulse" };

export default async function AlertsPage() {
  const { alerts, error } = await getAlerts();

  return <div className="projects-page alerts-page"><header className="projects-page-header"><a className="projects-brand" href="/dashboard"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><b>IP</b></span><span>Infra<span>Pulse</span></span></a><nav><a href="/dashboard">Overview</a><a href="/projects">Projects</a><a className="current" href="/alerts">Alerts</a></nav><a className="projects-back" href="/dashboard">Back to dashboard</a></header><main className="projects-content"><div className="projects-heading"><div><p className="eyebrow">OPERATIONS MONITORING</p><h1>Alerts</h1><p>Review issues and notices reported across the infrastructure portfolio.</p></div><div className="projects-total"><strong>{alerts.length}</strong><span>alerts in database</span></div></div>{error && <div className="data-notice" role="alert"><strong>Alert data unavailable</strong><span>{error}</span></div>}<section className="projects-panel-card alerts-panel-card"><AlertsTable alerts={alerts} /></section></main></div>;
}