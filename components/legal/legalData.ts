import { Shield, Database, Eye, Server, Trash2, Lock, Globe, Mail } from "lucide-react";
import React from "react";

export interface LegalSection {
  id: string;
  title: string;
  content: string;
  icon?: React.ElementType;
  color?: string;
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptation",
    title: "1. Acceptation des conditions",
    content: `En créant un compte ou en utilisant les services de Clarveon, vous reconnaissez avoir lu, compris et accepté l'intégralité des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.

Ces CGU constituent un accord juridiquement contraignant entre vous (l'utilisateur) et Clarveon. Nous nous réservons le droit de modifier ces conditions à tout moment, avec notification préalable par e-mail ou via l'interface de la plateforme. Votre usage continu après modification vaut acceptation.`,
  },
  {
    id: "description",
    title: "2. Description des services",
    content: `Clarveon est une plateforme SaaS d'audit et de surveillance de sécurité web qui fournit :

• Analyse automatisée et passive de la posture de sécurité de vos sites (SSL/TLS, en-têtes HTTP, DNS, sécurité e-mail)
• Génération de rapports de conformité ISO/IEC 27001:2022 et OWASP Top 10
• Détection de vulnérabilités publiques et scoring CVSS
• Tableaux de bord de suivi et historique des synthèses d'audit
• Exportation de rapports exécutifs au format PDF

Les analyses sont réalisées de manière externe et passive à partir de données publiques. Clarveon ne réalise aucun test intrusif ou destructeur sur vos serveurs.`,
  },
  {
    id: "eligibilite",
    title: "3. Éligibilité et création de compte",
    content: `Pour créer un compte Clarveon, vous devez :

• Être une personne physique majeure (18 ans ou plus) ou une entité juridique légalement constituée
• Fournir des informations exactes et à jour (nom, e-mail professionnel, entreprise)
• Disposer de l'autorité nécessaire pour engager votre entreprise

Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion. Toute action effectuée depuis votre compte est réputée avoir été réalisée par vous-même. En cas de suspicion de compromission, prévenez immédiatement support@clarveon.io.`,
  },
  {
    id: "utilisation-autorisee",
    title: "4. Utilisation autorisée et interdictions",
    content: `Vous vous engagez expressément à :

• N'analyser que des noms de domaine et sous-domaines dont vous êtes propriétaire ou pour lesquels vous disposez d'un mandat d'audit écrit et explicite
• Ne pas utiliser les outils Clarveon à des fins de malveillance, d'attaque ou de repérage non autorisé sur des cibles tiers
• Respecter les limites de requêtes et de volumétrie associées à votre offre
• Ne pas tenter de contourner, décompiler ou rétro-concevoir les mécanismes de sécurité ou le code de la plateforme

Toute violation de cette règle entraînera la suspension immédiate et irrévocable du compte, sans remboursement, et pourra donner lieu à des poursuites judiciaires.`,
  },
  {
    id: "propriete-intellectuelle",
    title: "5. Propriété intellectuelle",
    content: `L'ensemble de la plateforme Clarveon (marque, logos, algorithmes d'analyse, interfaces, code source, documentation et modèles de rapports) est la propriété exclusive de Clarveon et protégé par les lois sur la propriété intellectuelle.

Vous conservez la propriété exclusive des données d'audit propres à vos systèmes. Clarveon dispose d'un droit restreint d'exploiter ces données anonymisées pour améliorer ses modèles de détection.`,
  },
  {
    id: "disponibilite",
    title: "6. Disponibilité et maintenance",
    content: `Clarveon s'efforce de garantir un taux de disponibilité élevé de ses services. Des fenêtres de maintenance programmées peuvent toutefois survenir et feront l'objet d'une information préalable.

Le service est fourni « en l'état ». Clarveon ne garantit pas l'absence totale d'interruption ou d'erreur temporaire de service.`,
  },
  {
    id: "limitation-responsabilite",
    title: "7. Limitation de responsabilité",
    content: `Les rapports et diagnostics produits par Clarveon sont des outils d'aide à la décision et ne constituent en aucun cas une garantie absolue de sécurité ni un audit de pénétration intrusif exhaustif.

Dans les limites permises par la loi, Clarveon ne pourra être tenu responsable des dommages directs ou indirects (perte de données, manque à gagner, faille non détectée) résultant de l'utilisation de la plateforme. La responsabilité globale de Clarveon est plafonnée au montant payé par l'utilisateur au cours des 12 derniers mois.`,
  },
  {
    id: "resiliation",
    title: "8. Résiliation",
    content: `Vous pouvez clôturer votre compte à tout moment depuis les paramètres utilisateur. Clarveon se réserve le droit de résilier ou suspendre un compte en cas de manquement aux présentes CGU.

À la fermeture du compte, vos données d'analyse personnelles seront supprimées définitivement dans un délai maximal de 30 jours, sous réserve des obligations légales de conservation.`,
  },
  {
    id: "droit-applicable",
    title: "9. Droit applicable et juridiction",
    content: `Les présentes conditions sont régies par le droit français. Tout litige relatif à leur interprétation ou leur exécution relève de la compétence exclusive des tribunaux compétents du siège social de Clarveon, après tentative préalable de résolution amiable.`,
  },
  {
    id: "contact",
    title: "10. Contact juridique",
    content: `Pour toute question relative aux CGU ou aux aspects juridiques de Clarveon :

• E-mail : legal@clarveon.io
• Support client : support@clarveon.io
• Délais d'assistance : 24 à 48 heures ouvrées`,
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    icon: Shield,
    color: "sky",
    title: "1. Responsable du traitement",
    content: `Clarveon agit en qualité de responsable du traitement de vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).

Coordonnées officielles :
• Organisme : Clarveon
• Délégué à la Protection des Données (DPO) : dpo@clarveon.io
• Demande d'exercice des droits : dpo@clarveon.io ou via votre espace client`,
  },
  {
    id: "collecte",
    icon: Database,
    color: "blue",
    title: "2. Données collectées",
    content: `Dans le cadre strict du fonctionnement du service, nous collectons les catégories de données suivantes :

• Données d'identité & compte : Nom complet, adresse e-mail professionnelle, nom d'entreprise, numéro de téléphone (optionnel).
• Sécurité du compte : Mot de passe haché (bcrypt salé à fort facteur de coût, jamais conservé en clair).
• Données d'utilisation : Domaines soumis aux audits, résultats des analyses, historiques des rapports.
• Données techniques : Adresse IP de connexion, logs d'accès, type de navigateur, horodatage (à des fins de sécurité et d'audit interne).`,
  },
  {
    id: "finalites",
    icon: Eye,
    color: "purple",
    title: "3. Finalités et bases légales",
    content: `Vos données sont traitées pour les finalités suivantes :

• Fiche de compte et fourniture des services (Base légale : Exécution contractuelle Art. 6.1.b RGPD)
• Sécurisation des accès et prévention des abus (Base légale : Intérêt légitime Art. 6.1.f RGPD)
• Envoi de notifications techniques et mises à jour (Base légale : Exécution contractuelle Art. 6.1.b RGPD)
• Respect des obligations légales et comptables (Base légale : Obligation légale Art. 6.1.c RGPD)`,
  },
  {
    id: "hebergement",
    icon: Server,
    color: "emerald",
    title: "4. Hébergement et localisation (100% UE)",
    content: `Toutes les données Clarveon sont strictement stockées et traitées au sein de l'Union Européenne :

• Infrastructure cloud & base de données : Supabase (serveurs basés à Francfort, Allemagne — UE)
• Chiffrement : Données chiffrées en transit (TLS 1.3) et au repos (AES-256)
• Pas de transfert hors UE : Aucune donnée personnelle n'est transférée vers des pays tiers hors UE sans garanties adéquates.`,
  },
  {
    id: "duree",
    icon: Trash2,
    color: "orange",
    title: "5. Durée de conservation des données",
    content: `• Données de compte utilisateur : Conservées pendant la durée de la relation contractuelle + 30 jours.
• Logs d'accès et de sécurité : Conservés pendant 12 mois glissants.
• Rapports d'analyse : Conservés jusqu'à la suppression du compte ou à la demande de l'utilisateur.
• Documents comptables/factures : Conservés 10 ans selon les obligations légales en vigueur.`,
  },
  {
    id: "droits",
    icon: Lock,
    color: "sky",
    title: "6. Vos droits RGPD",
    content: `Conformément à la réglementation RGPD, vous disposez des droits suivants :

• Droit d'accès (Art. 15) : Obtenir une copie de vos données personnelles.
• Droit de rectification (Art. 16) : Mettre à jour des informations inexactes.
• Droit à l'effacement / droit à l'oubli (Art. 17) : Demander la suppression définitive de votre compte.
• Droit à la limitation du traitement (Art. 18) et d'opposition (Art. 21).
• Droit à la portabilité (Art. 20) : Exporter vos données dans un format structuré (JSON/CSV).

Pour exercer un droit, envoyez un message à dpo@clarveon.io. Réponse garantie sous 30 jours. Vous conservez également le droit d'introduire une réclamation auprès de la CNIL (cnil.fr).`,
  },
  {
    id: "cookies",
    icon: Globe,
    color: "cyan",
    title: "7. Cookies et cookies de session",
    content: `Clarveon applique une politique d'utilisation minimale de cookies :

• Cookies strictement nécessaires : Authentification Supabase, sécurité CSRF, préférences de session.
• Aucun cookie publicitaire tiers ni de traçage commercial préjudiciable n'est utilisé.`,
  },
  {
    id: "securite",
    icon: Shield,
    color: "emerald",
    title: "8. Sécurité et protection des données",
    content: `En tant qu'acteur de la cybersécurité, nous appliquons les principes de Privacy by Design et Security by Design :

• Chiffrement fort des connexions et bases de données
• Contrôle d'accès strict par rôles (RBAC)
• Mises à jour de sécurité automatisées et surveillance continue
• Sauvegardes régulières et chiffrées`,
  },
  {
    id: "modifications",
    icon: Eye,
    color: "blue",
    title: "9. Mise à jour de la politique",
    content: `Cette politique de confidentialité peut être révisée pour se conformer aux évolutions légales ou techniques. En cas de modification majeure, une alerte sera affichée dans votre espace ou envoyée par e-mail.`,
  },
  {
    id: "contact",
    icon: Mail,
    color: "rose",
    title: "10. Contact DPO",
    content: `Pour toute question concernant le traitement de vos données personnelles :

• Délégué à la Protection des Données (DPO) : dpo@clarveon.io
• Adresse de l'entreprise : Clarveon — Service RGPD`,
  },
];

export const RGPD_RIGHTS_SUMMARY = [
  { label: "Accès", desc: "Consulter vos données", color: "sky" },
  { label: "Rectification", desc: "Corriger vos données", color: "blue" },
  { label: "Effacement", desc: "Droit à l'oubli", color: "rose" },
  { label: "Portabilité", desc: "Export JSON / CSV", color: "emerald" },
  { label: "Opposition", desc: "Refuser un traitement", color: "orange" },
  { label: "Limitation", desc: "Geler l'utilisation", color: "purple" },
];
