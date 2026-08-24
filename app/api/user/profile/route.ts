import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/lib/db/services/auth.service';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || 'Utilisateur';
    const companyName = metadata.company || metadata.companyName || metadata.company_name || 'Entreprise';
    const phone = metadata.phone || null;

    let dbUser = await AuthService.getCurrentUser(user.id);

    if (!dbUser) {
      dbUser = await AuthService.upsertUser(user.id, user.email || '', fullName, companyName, phone);
    } else {
      // Synchronisation si des champs sont manquants dans la table Prisma
      const updates: { companyName?: string; fullName?: string; phone?: string } = {};

      if (!dbUser.companyName && (metadata.company || metadata.companyName || metadata.company_name)) {
        updates.companyName = metadata.company || metadata.companyName || metadata.company_name;
      }
      if ((!dbUser.fullName || dbUser.fullName === 'Utilisateur') && (metadata.full_name || metadata.name)) {
        updates.fullName = metadata.full_name || metadata.name;
      }
      if (!dbUser.phone && metadata.phone) {
        updates.phone = metadata.phone;
      }

      if (Object.keys(updates).length > 0) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: updates,
          include: {
            subscription: true,
          },
        });
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          companyName: dbUser.companyName,
          phone: dbUser.phone || '',
          createdAt: dbUser.createdAt.toISOString(),
          plan: dbUser.subscription?.plan || 'FREE',
          initials: dbUser.fullName
            ? dbUser.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, companyName, phone } = body;

    // Mettre à jour les métadonnées globales Supabase pour la synchronisation
    await supabase.auth.updateUser({
      data: {
        full_name: fullName !== undefined ? fullName : user.user_metadata?.full_name,
        company: companyName !== undefined ? companyName : user.user_metadata?.company,
        phone: phone !== undefined ? phone : user.user_metadata?.phone,
      }
    });

    const updatedUser = await prisma.user.update({
      where: { authUserId: user.id },
      data: {
        fullName,
        companyName,
        phone,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
