import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ScanService } from '@/lib/db/services/scan.service';

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

    try {
      const statusData = await ScanService.getScanStatus(scanId, user.id);

      if (!statusData) {
        return NextResponse.json({ error: 'Scan non trouvé.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: statusData });
    } catch (ownershipError: any) {
      if (ownershipError.message?.includes('Access denied')) {
        return NextResponse.json({ error: 'Accès refusé à ce scan.' }, { status: 403 });
      }
      throw ownershipError;
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
