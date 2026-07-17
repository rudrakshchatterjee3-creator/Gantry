import { NextRequest, NextResponse } from "next/server";
import { getRecentQuickReports } from "@/lib/external/quick-report-store";
import { auth } from "@/auth";

// --- Quick Report Poll ---------------------------------------------------
// Read side of the quick-report relay (see lib/external/quick-report-store.ts).
// The dashboard's ambient telemetry tick polls this per selected venue so
// reports filed from the public, unauthenticated /report/[venueId]/[gateId]
// page reach the Action Feed. Auth-gated like the other dashboard-facing
// routes — this is ops-visible data, not public.

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venueId = request.nextUrl.searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "venueId is required" }, { status: 400 });
  }

  return NextResponse.json({ resolutions: getRecentQuickReports(venueId) });
}
