import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { calculateRisk } from "@/lib/risk/riskEngine";

type RouteContext = {
  params: Promise<{
    projectCode: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { projectCode } = await context.params;

    if (!projectCode) {
      return NextResponse.json(
        {
          error: "Project code is required.",
        },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("project_code", projectCode)
      .maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError);

      return NextResponse.json(
        {
          error: "Unable to fetch project.",
          details: projectError.message,
        },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          error: `Project '${projectCode}' was not found.`,
        },
        { status: 404 }
      );
    }

    const { data: milestones, error: milestoneError } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_code", projectCode)
      .order("planned_date", {
        ascending: true,
      });

    if (milestoneError) {
      console.error("Milestone query error:", milestoneError);

      return NextResponse.json(
        {
          error: "Unable to fetch project milestones.",
          details: milestoneError.message,
        },
        { status: 500 }
      );
    }

    const risk = calculateRisk(
      {
        progress: project.progress ?? 0,
        planned_progress: Number(project.planned_progress ?? 0),
        status: project.status ?? "ON TRACK",
        expected_end_date: project.expected_end_date,
      },
      milestones ?? []
    );

    return NextResponse.json({
      project: {
        projectCode: project.project_code,
        name: project.name,
        sector: project.sector,
        location: project.location,
        progress: project.progress,
        plannedProgress: project.planned_progress,
        status: project.status,
      },
      risk,
      milestonesAnalyzed: milestones?.length ?? 0,
    });
  } catch (error) {
    console.error("Risk API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}