export type ProjectStatus = "ON TRACK" | "AT RISK" | "DELAYED" | string;

export interface ProjectInput {
  progress: number;
  planned_progress: number;
  status: ProjectStatus;
  expected_end_date?: string | null;
}

export interface MilestoneInput {
  status: string;
  planned_date?: string | null;
  completed_date?: string | null;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: string[];
  recommendation: string;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function calculateProgressRisk(project: ProjectInput): {
  score: number;
  factor?: string;
} {
  const progress = safeNumber(project.progress);
  const plannedProgress = safeNumber(project.planned_progress);

  const progressGap = plannedProgress - progress;

  if (!Number.isFinite(progressGap) || progressGap <= 0) {
    return { score: 0 };
  }

  // 0–30 points based on how far actual progress is behind plan.
  const score = clamp(progressGap * 1.5, 0, 30);

  return {
    score,
    factor: `Progress is ${progressGap.toFixed(1)}% below planned progress.`,
  };
}

function calculateStatusRisk(status: string): {
  score: number;
  factor?: string;
} {
  const normalizedStatus = String(status ?? "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "DELAYED":
      return {
        score: 25,
        factor: "Project status is marked as DELAYED.",
      };

    case "AT RISK":
      return {
        score: 15,
        factor: "Project status is marked as AT RISK.",
      };

    case "ON TRACK":
      return {
        score: 0,
      };

    default:
      return {
        score: 5,
        factor: `Project has an unrecognized status: ${status}.`,
      };
  }
}

function calculateMilestoneRisk(milestones: MilestoneInput[]): {
  score: number;
  factor?: string;
} {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return {
      score: 0,
      factor: "No milestone data is available for analysis.",
    };
  }

  const overdueCount = milestones.filter((milestone) => {
    if (!milestone) {
      return false;
    }

    const status = String(milestone.status ?? "").trim().toUpperCase();

    if (status === "OVERDUE") {
      return true;
    }

    if (
      milestone.planned_date &&
      !milestone.completed_date
    ) {
      const plannedDate = new Date(milestone.planned_date);

      if (
        !Number.isNaN(plannedDate.getTime()) &&
        plannedDate < new Date()
      ) {
        return true;
      }
    }

    return false;
  }).length;

  const pendingCount = milestones.filter((milestone) => {
    if (!milestone) {
      return false;
    }

    const status = String(milestone.status ?? "").trim().toUpperCase();

    return status === "PENDING" || status === "IN PROGRESS";
  }).length;

  const score = clamp(
    overdueCount * 10 + pendingCount * 3,
    0,
    25
  );

  const factors: string[] = [];

  if (overdueCount > 0) {
    factors.push(
      `${overdueCount} milestone${
        overdueCount === 1 ? "" : "s"
      } require immediate attention.`
    );
  }

  if (pendingCount > 0) {
    factors.push(
      `${pendingCount} milestone${
        pendingCount === 1 ? "" : "s"
      } remain pending or in progress.`
    );
  }

  return {
    score,
    factor: factors.length > 0 ? factors.join(" ") : undefined,
  };
}

function calculateScheduleRisk(project: ProjectInput): {
  score: number;
  factor?: string;
} {
  if (!project.expected_end_date) {
    return {
      score: 0,
    };
  }

  const expectedEnd = new Date(project.expected_end_date);

  if (Number.isNaN(expectedEnd.getTime())) {
    return {
      score: 0,
      factor: "The expected project end date could not be evaluated.",
    };
  }

  const today = new Date();
  const progress = safeNumber(project.progress);

  if (expectedEnd < today && progress < 100) {
    return {
      score: 20,
      factor:
        "The expected completion date has passed while the project is incomplete.",
    };
  }

  return {
    score: 0,
  };
}

export function calculateRisk(
  project: ProjectInput,
  milestones: MilestoneInput[]
): RiskResult {
  const safeProject: ProjectInput = {
    progress: safeNumber(project?.progress),
    planned_progress: safeNumber(project?.planned_progress),
    status: project?.status ?? "ON TRACK",
    expected_end_date: project?.expected_end_date ?? null,
  };

  const safeMilestones = Array.isArray(milestones)
    ? milestones
    : [];

  const progressRisk = calculateProgressRisk(safeProject);
  const statusRisk = calculateStatusRisk(safeProject.status);
  const milestoneRisk = calculateMilestoneRisk(safeMilestones);
  const scheduleRisk = calculateScheduleRisk(safeProject);

  const rawScore =
    progressRisk.score +
    statusRisk.score +
    milestoneRisk.score +
    scheduleRisk.score;

  const safeRawScore = Number.isFinite(rawScore)
    ? rawScore
    : 0;

  const riskScore = Math.round(
    clamp(safeRawScore, 0, 100)
  );

  let riskLevel: RiskResult["riskLevel"];

  if (riskScore <= 29) {
    riskLevel = "LOW";
  } else if (riskScore <= 59) {
    riskLevel = "MEDIUM";
  } else if (riskScore <= 79) {
    riskLevel = "HIGH";
  } else {
    riskLevel = "CRITICAL";
  }

  const riskFactors = [
    progressRisk.factor,
    statusRisk.factor,
    milestoneRisk.factor,
    scheduleRisk.factor,
  ].filter(
    (factor): factor is string => Boolean(factor)
  );

  let recommendation: string;

  if (riskLevel === "LOW") {
    recommendation =
      "Continue monitoring project progress and upcoming milestones.";
  } else if (riskLevel === "MEDIUM") {
    recommendation =
      "Monitor delayed activities closely and review upcoming milestones.";
  } else if (riskLevel === "HIGH") {
    recommendation =
      "Review delayed milestones and prioritize resources for affected project activities.";
  } else {
    recommendation =
      "Take immediate corrective action, review major delays, and prioritize resources for critical activities.";
  }

  return {
    riskScore: Number.isFinite(riskScore)
      ? riskScore
      : 0,
    riskLevel,
    riskFactors,
    recommendation,
  };
}