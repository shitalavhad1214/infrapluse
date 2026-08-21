"use client";

import { useState } from "react";

type Project = {
  project_code: string;
  name: string;
  sector: string;
  location: string;
  progress: number;
  planned_progress: number;
  status: string;
};

type RiskResult = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: string[];
};

type ApiResponse = {
  project?: {
    projectCode: string;
    name: string;
    sector: string;
    location: string | null;
    progress: number;
    plannedProgress: number;
    status: string;
  };
  risk?: RiskResult;
  milestonesAnalyzed?: number;
  error?: string;
};

export default function RiskSimulation({
  projects,
}: {
  projects: Project[];
}) {
  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.project_code ?? ""
  );

  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSimulation() {
    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/risk/${encodeURIComponent(selectedProject)}`
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to calculate project risk.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while running the simulation."
      );
    } finally {
      setLoading(false);
    }
  }

  const riskLevel = result?.risk?.riskLevel;

  return (
    <section className="panel simulation-panel" id="simulation">
      <div className="panel-header">
        <div>
          <h3>Risk Simulation</h3>
          <p>
            Run B3 risk analysis using the project's current progress,
            milestones, status and schedule.
          </p>
        </div>
        <span className="simulation-badge">B3 Analysis</span>
      </div>

      <div className="simulation-controls">
        <div className="simulation-select">
          <label htmlFor="simulation-project">Select project</label>

          <select
            id="simulation-project"
            value={selectedProject}
            onChange={(event) => {
              setSelectedProject(event.target.value);
              setResult(null);
              setError("");
            }}
            disabled={!projects.length || loading}
          >
            {!projects.length && <option value="">No projects available</option>}

            {projects.map((project) => (
              <option key={project.project_code} value={project.project_code}>
                {project.name} ({project.project_code})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="simulation-button"
          onClick={runSimulation}
          disabled={!selectedProject || loading}
        >
          {loading ? "Running analysis..." : "Run Risk Simulation"}
        </button>
      </div>

      {error && (
        <div className="simulation-error" role="alert">
          {error}
        </div>
      )}

      {result?.risk && (
        <div className="simulation-result">
          <div className="risk-score-card">
            <span>Risk Score</span>
            <strong>{result.risk.riskScore}</strong>
            <small>out of 100</small>
          </div>

          <div
            className={`risk-level-card risk-${result.risk.riskLevel.toLowerCase()}`}
          >
            <span>Risk Level</span>
            <strong>{result.risk.riskLevel}</strong>
          </div>

          <div className="simulation-project-info">
            <span>Project</span>
            <strong>{result.project?.name}</strong>

            <div className="simulation-project-details">
              <span>
                Progress: <strong>{result.project?.progress}%</strong>
              </span>

              <span>
                Planned: <strong>{result.project?.plannedProgress}%</strong>
              </span>

              <span>
                Status: <strong>{result.project?.status}</strong>
              </span>

              <span>
                Milestones analysed:{" "}
                <strong>{result.milestonesAnalyzed ?? 0}</strong>
              </span>
            </div>
          </div>

          <div className="risk-factors">
            <h4>Risk Factors</h4>

            {result.risk.riskFactors.length ? (
              <ul>
                {result.risk.riskFactors.map((factor, index) => (
                  <li key={`${factor}-${index}`}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p>No significant risk factors identified.</p>
            )}
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="simulation-empty">
          Select a project and run the simulation to view its infrastructure
          risk analysis.
        </div>
      )}
    </section>
  );
}