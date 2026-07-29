import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { AuthService } from '@/lib/db/services/auth.service';
export async function GET(
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

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        website: true,
        securityScore: true,
        results: {
          include: {
            tool: true,
            recommendations: true
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan non trouvé.' }, { status: 404 });
    }

    // Verify ownership
    const dbUser = await AuthService.upsertUser(
      user.id,
      user.email ?? '',
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      user.user_metadata?.company_name ?? ''
    );

    if (!dbUser || scan.website.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: scan });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { ScanService } = await import('@/lib/db/services/scan.service');
    await ScanService.deleteScan(scanId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
