import { PrivacyPage } from "@/components/legal/PrivacyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Clarveon",
  description:
    "Découvrez comment Clarveon collecte, utilise et protège vos données personnelles conformément au RGPD.",
};

export default function Page() {
  return <PrivacyPage />;
}
