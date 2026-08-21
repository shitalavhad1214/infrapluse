"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ProjectRow } from "@/lib/database.types";
import { getProjects } from "@/lib/projects";
import { createSupabaseServerClient } from "@/lib/supabase";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const fieldLabelClass = "mb-2 block text-sm font-semibold text-[#3d2c53]";
const inputClass = "w-full rounded-md border border-[#e5dbf3] bg-white px-4 py-3 text-base text-[#302344] outline-none transition focus:border-[#8958d2] focus:ring-2 focus:ring-[#eee5ff]";

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not available" : String(value);
}

export default function FieldProgressPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [gpsState, setGpsState] = useState<"idle" | "capturing" | "captured" | "error">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      const result = await getProjects();
      if (!active) return;
      setProjects(result.projects);
      setLoadingError(result.error);
      setLoading(false);
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const selectedProject = projects.find((project) => project.project_code === selectedCode);

  function selectProject(value: string) {
    setSelectedCode(value);
    setProgress("");
    setRemarks("");
    setCoordinates(null);
    setGpsState("idle");
    setGpsError(null);
    setValidationError(null);
    setSubmissionError(null);
    setSubmissionSuccess(false);
  }

  function captureLocation() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsState("error");
      setGpsError("Location services are not available on this device or browser.");
      return;
    }

    setGpsState("capturing");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setGpsState("captured");
      },
      (error) => {
        setGpsState("error");
        setGpsError(error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Allow location access and try again."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Your current location could not be determined. Please try again."
            : "Location capture timed out. Please try again.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericProgress = Number(progress);
    if (!selectedProject) {
      setValidationError("Select a project before submitting an update.");
    } else if (progress.trim() === "" || !Number.isFinite(numericProgress) || numericProgress < 0 || numericProgress > 100) {
      setValidationError("Enter today's progress as a number from 0 to 100.");
    } else {
      setValidationError(null);
      setSubmissionError(null);
      setSubmissionSuccess(false);
      setSaving(true);

      try {
        const client = createSupabaseServerClient();
        if (!client) {
          throw new Error("Supabase is not configured. Add the required variables to .env.local.");
        }

        const progressUpdate = {
          project_id: selectedProject.id,
          project_code: selectedProject.project_code,
          progress: numericProgress,
          remarks: remarks.trim() || null,
          update_date: new Date().toISOString(),
          latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null,
        };
        const { error: progressInsertError } = await client.from("progress_updates").insert(progressUpdate);

        if (progressInsertError) {
          throw new Error(progressInsertError.message);
        }

        const { error: projectUpdateError } = await client
          .from("projects")
          .update({ progress: numericProgress })
          .eq("id", selectedProject.id);

        if (projectUpdateError) {
          throw new Error(`Progress history was saved, but the current project progress could not be updated: ${projectUpdateError.message}`);
        }

        setSelectedCode("");
        setProgress("");
        setRemarks("");
        setCoordinates(null);
        setGpsState("idle");
        setGpsError(null);
        setSubmissionSuccess(true);
      } catch (error) {
        setSubmissionError(error instanceof Error ? `Could not submit progress update: ${error.message}` : "Could not submit progress update. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4fc] text-[#302344]">
      <header className="border-b border-[#e8e0f2] bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8958d2]">InfraPulse / Field Reports</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#302344]">Field Progress Update</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        {loadingError && <div className="mb-5 rounded-md border border-[#e5d5fb] border-l-4 border-l-[#8958d2] bg-[#fbf8ff] p-4 text-sm text-[#5d477e]" role="alert"><strong className="block text-[#3d2762]">Project data unavailable</strong><span>{loadingError}</span></div>}

        <form className="space-y-5" onSubmit={submitUpdate}>
          <section className="rounded-lg border border-[#e8e0f2] bg-white p-5 shadow-[0_8px_25px_rgba(65,33,109,0.05)] sm:p-7" aria-labelledby="project-heading">
            <div className="mb-5"><h2 id="project-heading" className="text-lg font-bold">Project</h2><p className="mt-1 text-sm text-[#887b9c]">Choose the active infrastructure project.</p></div>
            <label className={fieldLabelClass} htmlFor="project">Project</label>
            <select id="project" className={inputClass} value={selectedCode} onChange={(event) => selectProject(event.target.value)} disabled={loading || Boolean(loadingError)}>
              <option value="">{loading ? "Loading projects..." : projects.length ? "Select a project" : "No projects available"}</option>
              {projects.map((project) => <option key={project.id} value={project.project_code}>{project.project_code} - {project.name}</option>)}
            </select>
            {!loading && !loadingError && !projects.length && <p className="mt-3 text-sm text-[#887b9c]" role="status">There are no projects available for field updates.</p>}
          </section>

          {selectedProject && <section className="rounded-lg border border-[#e8e0f2] bg-white p-5 shadow-[0_8px_25px_rgba(65,33,109,0.05)] sm:p-7" aria-labelledby="details-heading">
            <div className="mb-5"><h2 id="details-heading" className="text-lg font-bold">Project details</h2><p className="mt-1 text-sm text-[#887b9c]">Confirm the project before recording progress.</p></div>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[#eee8f5] bg-[#eee8f5] sm:grid-cols-2">
              {[['Project name', selectedProject.name], ['Project code', selectedProject.project_code], ['Current progress', `${displayValue(selectedProject.progress)}%`], ['Planned progress', `${displayValue(selectedProject.planned_progress)}%`], ['Status', displayValue(selectedProject.status)], ['Sector', displayValue(selectedProject.sector)], ['Location', displayValue(selectedProject.location)]].map(([label, value]) => <div className="bg-white p-4" key={label}><dt className="text-xs text-[#988baa]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#4b3765]">{value}</dd></div>)}
            </dl>
          </section>}

          {selectedProject && <>
            <section className="rounded-lg border border-[#e8e0f2] bg-white p-5 shadow-[0_8px_25px_rgba(65,33,109,0.05)] sm:p-7" aria-labelledby="update-heading">
              <div className="mb-5"><h2 id="update-heading" className="text-lg font-bold">Today's update</h2><p className="mt-1 text-sm text-[#887b9c]">Record the latest observed progress on site.</p></div>
              <label className={fieldLabelClass} htmlFor="progress">Today's progress (%)</label>
              <input id="progress" className={inputClass} type="number" min="0" max="100" step="any" required value={progress} onChange={(event) => { setProgress(event.target.value); setValidationError(null); setSubmissionError(null); setSubmissionSuccess(false); }} placeholder="0 - 100" />
              <label className={`${fieldLabelClass} mt-5`} htmlFor="remarks">Remarks <span className="font-normal text-[#988baa]">(optional)</span></label>
              <textarea id="remarks" className={`${inputClass} min-h-28 resize-y`} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add observations from the site visit" />
            </section>

            <section className="rounded-lg border border-[#e8e0f2] bg-white p-5 shadow-[0_8px_25px_rgba(65,33,109,0.05)] sm:p-7" aria-labelledby="gps-heading">
              <div className="mb-5"><h2 id="gps-heading" className="text-lg font-bold">GPS location</h2><p className="mt-1 text-sm text-[#887b9c]">Capture your position when you are ready. Location is not tracked continuously.</p></div>
              <button className="min-h-12 w-full rounded-md bg-[#7549c1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#60399f] disabled:cursor-wait disabled:opacity-60" type="button" onClick={captureLocation} disabled={gpsState === "capturing"}>{gpsState === "capturing" ? "Capturing location..." : "Capture Current Location"}</button>
              {coordinates && <p className="mt-4 rounded-md bg-[#f7f4fc] p-3 text-sm text-[#5d477e]" role="status">Captured coordinates: <strong>{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</strong></p>}
              {gpsError && <p className="mt-4 text-sm text-[#b04c73]" role="alert">{gpsError}</p>}
            </section>

            <div>
              {validationError && <p className="mb-3 text-sm font-semibold text-[#b04c73]" role="alert">{validationError}</p>}
              {submissionError && <p className="mb-3 text-sm font-semibold text-[#b04c73]" role="alert">{submissionError}</p>}
              {submissionSuccess && <p className="mb-3 text-sm font-semibold text-[#36785b]" role="status">Progress update submitted successfully.</p>}
              <button className="min-h-12 w-full rounded-md border border-[#7549c1] bg-white px-5 py-3 text-sm font-bold text-[#7549c1] transition hover:bg-[#fbf8ff] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Progress Update"}</button>
            </div>
          </>}
        </form>
      </div>
    </main>
  );
}