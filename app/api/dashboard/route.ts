import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/db/services/auth.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await AuthService.upsertUser(
      user.id,
      user.email ?? '',
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      user.user_metadata?.company ?? user.user_metadata?.companyName ?? user.user_metadata?.company_name ?? '',
      user.user_metadata?.phone ?? null
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    // Fetch the recent scans for the user (last 5 for the dashboard table)
    const recentScans = await prisma.scan.findMany({
      where: {
        website: {
          userId: dbUser.id
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        website: true,
        securityScore: true,
        results: {
          select: {
            severity: true,
            status: true
          }
        }
      }
    });

    // Fetch all completed scans for the user to compute global stats
    const allCompletedScans = await prisma.scan.findMany({
      where: {
        website: {
          userId: dbUser.id
        },
        status: 'COMPLETED'
      },
      include: {
        securityScore: true,
      }
    });

    // Fetch all results for completed scans to compute vulnerability totals
    const results = await prisma.scanResult.findMany({
      where: {
        scan: {
          website: {
            userId: dbUser.id
          },
          status: 'COMPLETED'
        }
      },
      select: {
        severity: true,
        status: true
      }
    });

    const totalScans = allCompletedScans.length;
    
    let totalScore = 0;
    allCompletedScans.forEach((scan: any) => {
      if (scan.securityScore) {
        totalScore += scan.securityScore.score;
      }
    });
    const avgScore = totalScans > 0 ? Math.round(totalScore / totalScans) : 0;

    let totalCritical = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;

    results.forEach((result: any) => {
      if (result.status === 'FAIL' || result.status === 'WARNING') {
        if (result.severity === 'CRITICAL') totalCritical++;
        if (result.severity === 'HIGH') totalHigh++;
        if (result.severity === 'MEDIUM') totalMedium++;
        if (result.severity === 'LOW') totalLow++;
      }
    });

    const formattedRecentScans = recentScans.map((scan: any) => {
      let critical = 0, high = 0, medium = 0, low = 0;
      scan.results.forEach((r: any) => {
        if (r.status === 'FAIL' || r.status === 'WARNING') {
          if (r.severity === 'CRITICAL') critical++;
          if (r.severity === 'HIGH') high++;
          if (r.severity === 'MEDIUM') medium++;
          if (r.severity === 'LOW') low++;
        }
      });

      return {
        id: scan.id,
        domain: scan.website.domain,
        score: scan.securityScore?.score || 0,
        date: scan.createdAt.toISOString(),
        status: scan.status,
        critical,
        high,
        medium,
        low
      };
    });

    return NextResponse.json({
      totalScans,
      avgScore,
      totalCritical,
      totalHigh,
      totalMedium,
      totalLow,
      recentScans: formattedRecentScans,
      plan: dbUser.subscription?.plan || 'FREE'
    });

  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
