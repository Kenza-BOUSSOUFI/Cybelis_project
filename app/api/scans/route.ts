import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/lib/db/services/auth.service';
import { ScanService } from '@/lib/db/services/scan.service';
import { prisma } from '@/lib/db/prisma';

const isValidDomain = (d: string) => {
  const sanitized = d.trim().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(sanitized);
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { url, scanType, toolSlugs } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'L\'URL ou le domaine est requis.' }, { status: 400 });
    }

    if (!isValidDomain(url)) {
      return NextResponse.json({ error: 'Format de domaine invalide.' }, { status: 400 });
    }

    if (scanType !== 'FULL' && scanType !== 'CUSTOM') {
      return NextResponse.json({ error: 'Type de scan invalide. Doit être FULL ou CUSTOM.' }, { status: 400 });
    }

    // Determine tool slugs to run
    let slugs: string[] = [];
    if (scanType === 'FULL') {
      const activeTools = await prisma.securityTool.findMany({
        where: { isActive: true }
      });
      slugs = activeTools.map(t => t.slug);
    } else {
      if (!Array.isArray(toolSlugs) || toolSlugs.length === 0) {
        return NextResponse.json({ error: 'Pour un scan personnalisé, vous devez sélectionner au moins un outil.' }, { status: 400 });
      }
      slugs = toolSlugs;
    }

    // Sync user profile
    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || 'Utilisateur';
    const companyName = metadata.company || 'Entreprise';
    const dbUser = await AuthService.upsertUser(user.id, user.email || '', fullName, companyName);

    // Find/Create website
    const website = await ScanService.findOrCreateWebsite(dbUser.id, url);

    // Check if a scan is already running on this website
    const isRunning = await ScanService.hasRunningScan(website.id);
    if (isRunning) {
      return NextResponse.json({ error: 'Un scan est déjà en cours sur ce site web.' }, { status: 409 });
    }

    // Initialize scan
    const scan = await ScanService.createScan(website.id, scanType, slugs);

    return NextResponse.json({
      success: true,
      data: {
        scanId: scan.id
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rawScans = await ScanService.getUserScans(user.id);

    const formattedScans = rawScans.map((scan) => {
      let critical = 0;
      let high = 0;
      let medium = 0;

      for (const res of scan.results || []) {
        if (res.status === 'FAIL') {
          if (res.severity === 'CRITICAL') critical++;
          else if (res.severity === 'HIGH') high++;
          else if (res.severity === 'MEDIUM') medium++;
        }
      }

      const duration = scan.finishedAt
        ? Math.max(1, Math.round((new Date(scan.finishedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000))
        : 0;

      return {
        id: scan.id,
        domain: scan.website.domain,
        url: scan.website.url,
        status: scan.status,
        type: scan.type,
        date: scan.startedAt.toISOString(),
        finishedAt: scan.finishedAt?.toISOString() || null,
        duration,
        score: scan.securityScore?.score ?? 0,
        grade: scan.securityScore?.grade ?? 'N/A',
        riskLevel: scan.securityScore?.riskLevel ?? 'LOW',
        critical,
        high,
        medium,
      };
    });

    return NextResponse.json({ success: true, data: formattedScans });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
