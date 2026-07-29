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
      user.user_metadata?.company_name ?? ''
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    const completedScans = await prisma.scan.findMany({
      where: {
        website: {
          userId: dbUser.id
        },
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
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

    const formattedScans = completedScans.map((scan: any) => {
      let critical = 0, high = 0, medium = 0, low = 0;
      scan.results.forEach((r: any) => {
        if (r.status === 'FAIL' || r.status === 'WARNING') {
          if (r.severity === 'CRITICAL') critical++;
          if (r.severity === 'HIGH') high++;
          if (r.severity === 'MEDIUM') medium++;
          if (r.severity === 'LOW') low++;
        }
      });

      let duration = 0;
      if (scan.finishedAt && scan.startedAt) {
        duration = Math.round((scan.finishedAt.getTime() - scan.startedAt.getTime()) / 1000);
      }

      return {
        id: scan.id,
        domain: scan.website.domain,
        score: scan.securityScore?.score || 0,
        critical,
        high,
        medium,
        low,
        duration,
        date: scan.createdAt.toISOString()
      };
    });

    return NextResponse.json(formattedScans);
  } catch (error) {
    console.error("[COMPARE_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
