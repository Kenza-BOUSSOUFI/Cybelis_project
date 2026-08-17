import { PrivacyPage } from "@/components/legal/PrivacyPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Cybelis",
  description:
    "Découvrez comment Cybelis collecte, utilise et protège vos données personnelles conformément au RGPD.",
};

export default function Page() {
  return <PrivacyPage />;
}
