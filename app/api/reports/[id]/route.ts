import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/db/services/auth.service";
import { getOwaspMapping } from "@/lib/enrichment/owasp";
import { fetchCveForFinding } from "@/lib/enrichment/cve";
import { calculateIso27001Compliance } from "@/lib/enrichment/iso27001";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const scan = await prisma.scan.findFirst({
      where: {
        id,
        website: {
          userId: dbUser.id
        }
      },
      include: {
        website: true,
        securityScore: true,
        results: {
          include: {
            tool: true,
            recommendations: true,
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const vulnerabilities = await Promise.all(
      scan.results
        .filter((r: any) => r.status === 'FAIL' || r.status === 'WARNING')
        .map(async (r: any) => {
          const firstRec = r.recommendations[0];
          const resultData = r.result as any;
          const title = firstRec?.title || resultData?.title || r.tool.name;
          const description = firstRec?.description || resultData?.description || `Vulnérabilité détectée par ${r.tool.name}.`;
          
          const owasp = getOwaspMapping(r.result);
          const cve = await fetchCveForFinding(r.result);

          return {
            id: r.id,
            tool: r.tool.name,
            toolSlug: r.tool.slug,
            title,
            description,
            severity: r.severity.toLowerCase(),
            remediation: firstRec?.remediation || firstRec?.description || "Aucune remédiation spécifiée.",
            owasp,
            cve
          };
        })
    );

    const modules = [...new Set(scan.results.map((r: any) => r.tool.name as string))];
    const iso27001 = calculateIso27001Compliance(scan.results);

    return NextResponse.json({
      id: scan.id,
      domain: scan.website.domain,
      score: scan.securityScore?.score || 0,
      createdAt: scan.createdAt.toISOString(),
      vulnerabilities,
      modules,
      iso27001
    });
  } catch (error) {
    console.error("[REPORT_ID_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
