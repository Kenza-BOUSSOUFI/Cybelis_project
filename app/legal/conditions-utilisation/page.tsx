import { TermsPage } from "@/components/legal/TermsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Clarveon",
  description:
    "Consultez les conditions générales d'utilisation de la plateforme Clarveon, la solution d'audit de sécurité web pour les PME.",
};

export default function Page() {
  return <TermsPage />;
}
