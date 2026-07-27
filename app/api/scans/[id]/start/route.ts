import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/lib/db/services/auth.service';
import { ScanService } from '@/lib/db/services/scan.service';
import { ScanEngine } from '@/lib/scanEngine';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Retrieve user in DB
    const dbUser = await AuthService.getCurrentUser(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur inexistant.' }, { status: 404 });
    }

    // Find the scan and verify ownership
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        website: true,
        scanTools: {
          include: {
            tool: true
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan non trouvé.' }, { status: 404 });
    }

    if (scan.website.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    if (scan.status === 'RUNNING' || scan.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Ce scan est déjà en cours ou terminé.' }, { status: 400 });
    }

    // Set status to RUNNING
    await ScanService.updateScanStatus(scan.id, 'RUNNING');

    const slugs = scan.scanTools.map(st => st.tool.slug);

    // Run the Scan Engine in the background
    setImmediate(async () => {
      try {
        console.log(`[Scan Engine] Starting async scan ${scan.id} for url: ${scan.website.url}`);
        const report = await ScanEngine.run(scan.website.url, slugs);
        await ScanService.storeScanReport(scan.id, report);
        console.log(`[Scan Engine] Successfully finished and saved scan ${scan.id}`);
      } catch (error) {
        console.error(`[Scan Engine] Critical background error for scan ${scan.id}:`, error);
        await ScanService.updateScanStatus(scan.id, 'FAILED');
      }
    });

    // Return 202 Accepted immediately
    return NextResponse.json({ success: true, message: 'Scan démarré avec succès.' }, { status: 202 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
