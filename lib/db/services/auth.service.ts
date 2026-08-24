import { prisma } from '../prisma';

export class AuthService {
  /**
   * Upsert a user in our local database based on their Supabase auth user information.
   * If the user doesn't exist, we create them. If they exist, we update their details.
   */
  static async upsertUser(
    authUserId: string,
    email: string,
    fullName: string,
    companyName: string,
    phone?: string | null
  ) {
    const updateData: { email: string; fullName: string; companyName?: string; phone?: string | null } = {
      email,
      fullName,
    };

    if (companyName) {
      updateData.companyName = companyName;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }

    return prisma.user.upsert({
      where: { authUserId },
      update: updateData,
      create: {
        authUserId,
        email,
        fullName,
        companyName: companyName || '',
        phone: phone || null,
      },
      include: {
        subscription: true,
      },
    });
  }

  /**
   * Retrieve the complete Prisma user profile using the Supabase auth user UUID.
   */
  static async getCurrentUser(authUserId: string) {
    return prisma.user.findUnique({
      where: { authUserId },
      include: {
        subscription: true,
      },
    });
  }
}
