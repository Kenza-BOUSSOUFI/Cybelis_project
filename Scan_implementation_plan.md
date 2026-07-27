# Dashboard Scan Feature — Plan d'Implémentation (v2)

## Architecture Globale

```
[ScanForm] → POST /api/scans → { scanId, status: PENDING }
                 ↓ (immédiatement, frontend lance)
             POST /api/scans/:id/start → 202 Accepted (non bloquant)
                 ↓ (en arrière-plan, Node.js event loop)
             ScanEngine.run(url, tools[]) → DB updates (RUNNING → COMPLETED)
                 ↓
[ProgressCard] polls GET /api/scans/:id/status toutes les 3s
                 ↓
[ResultsCard] affiche score + grade → /dashboard/reports/[scanId]
```

---

## Layer 0 — ScanEngine : ajout de `runCustomScan()`

### [MODIFY] lib/scanEngine.ts

Ajouter une méthode `runCustomScan(url, slugs[])` qui n'exécute que les outils sélectionnés.

```
Full Scan  → ScanEngine.runFullScan(url)   → 16 outils
Custom     → ScanEngine.runCustomScan(url, ["ssl-checker","dns-lookup"]) → N outils
```

Slugs standard (correspondance outil ↔ slug) :

| Catégorie | Slug |
|---|---|
| WEBSITE_SECURITY | ssl-checker, tls-analyzer, security-headers, cookie-analyzer, http-methods, cors-analyzer, csp-validator, redirect-analyzer, robots-analyzer, sitemap-checker |
| EMAIL_SECURITY | spf-checker, dkim-checker, dmarc-checker |
| DNS_DOMAIN_SECURITY | dns-lookup, whois-lookup, domain-age-checker |

---

## Layer 1 — Database Seed

### [NEW] prisma/seed.ts

Seeds les 16 lignes `SecurityTool` avec slug comme clé unique.
```bash
npx prisma db seed  # à exécuter manuellement une seule fois
```

Le `package.json` aura :
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

---

## Layer 2 — Prisma Singleton

### [NEW] lib/db/prisma.ts
Instance globale unique du Prisma Client (évite les connexions multiples en dev).

---

## Layer 3 — Services

### [NEW] lib/db/services/auth.service.ts
Logique utilisateur — réutilisable partout (Scan, Profile, Settings, History) :
- `upsertUser(authUserId, email, fullName, companyName)` — crée si absent
- `getCurrentUser(authUserId)` — retourne le User Prisma complet

### [NEW] lib/db/services/scan.service.ts
Logique métier du scan uniquement :
- `findOrCreateWebsite(userId, url, domain)` — évite les doublons
- `hasRunningScan(websiteId)` → bool — vérifie la queue
- `createScan(websiteId, type, toolIds[])` — crée Scan + ScanTools
- `updateScanStatus(scanId, status)` — PENDING → RUNNING → COMPLETED/FAILED
- `storeScanReport(scanId, report)` — ScanResult, SecurityScore, Recommendations
- `getScanStatus(scanId, authUserId)` — retourne statut + vérifie ownership
- `getUserScans(userId)` — historique

---

## Layer 4 — API Routes

### [NEW] app/api/security-tools/route.ts
```
GET /api/security-tools
→ Retourne tous les SecurityTool actifs groupés par catégorie
→ Auth requise
```

### [NEW] app/api/scans/route.ts
```
POST /api/scans
Body: { url, scanType: "FULL"|"CUSTOM", toolSlugs: string[] }

1. Valider : url non vide, domaine valide, toolSlugs si CUSTOM
2. Auth : getUser() Supabase → upsertUser() Prisma
3. findOrCreateWebsite(userId, url, domain)
4. hasRunningScan(websiteId) → si OUI → 409 Conflict
5. createScan(websiteId, scanType, toolIds[])
6. Retourne { success: true, data: { scanId } }  ← IMMÉDIAT
```

### [NEW] app/api/scans/[id]/start/route.ts
```
POST /api/scans/:id/start

1. Auth + ownership : Scan → Website → User → authUserId
2. updateScanStatus(RUNNING)
3. Lance le scan en arrière-plan (sans await bloquant) :
   setImmediate(async () => {
     try {
       const report = await ScanEngine.run(url, slugs)
       await storeScanReport(scanId, report)
       await updateScanStatus(COMPLETED)
     } catch {
       await updateScanStatus(FAILED)
     }
   })
4. Retourne 202 Accepted { success: true }  ← IMMÉDIAT
```

> [!IMPORTANT]
> `setImmediate` fonctionne en `next dev` et `next start` (Node.js traditionnel).
> Pour Vercel/Edge : prévoir migration vers Vercel Background Jobs ou une queue (BullMQ/Inngest) ultérieurement.

### [NEW] app/api/scans/[id]/status/route.ts
```
GET /api/scans/:id/status

1. Auth + ownership : Scan → Website → User → authUserId
2. Retourne { status, completedTools, selectedTools, score?, grade?, riskLevel? }
```

---

## Layer 5 — Frontend Components

### [MODIFY] app/dashboard/scan/page.tsx
Orchestrateur des 4 composants. Pas de logique métier ici.
```
step: "form" | "pending" | "running" | "completed" | "failed"
```

### [NEW] components/dashboard/scan/ScanForm.tsx
- Input URL + validation
- Toggle Full / Custom
- `<ToolSelector>` uniquement si Custom
- Bouton Lancer → POST /api/scans + POST /api/scans/:id/start

### [NEW] components/dashboard/scan/ToolSelector.tsx
- Fetch `GET /api/security-tools`
- Affichage groupé par catégorie (WEBSITE_SECURITY, EMAIL_SECURITY, DNS_DOMAIN_SECURITY)
- Checkboxes multi-sélection
- "Tout sélectionner / désélectionner" par catégorie

### [NEW] components/dashboard/scan/ProgressCard.tsx
- Poll `GET /api/scans/:id/status` toutes les **3 secondes**
- Barre de progression : `(completedTools / selectedTools) * 100`
- Badge statut : PENDING → RUNNING → COMPLETED / FAILED
- Arrête le polling quand status = COMPLETED ou FAILED

### [NEW] components/dashboard/scan/ResultsCard.tsx
- Score global + Grade (A→F) + Risk Level
- Grille résumé par module (score, statut, sévérité)
- Bouton → `/dashboard/reports/[scanId]`

---

## Layer 6 — Report Page Migration

### [MODIFY] app/dashboard/reports/[domain]/page.tsx → [NEW] app/dashboard/reports/[scanId]/page.tsx

La page existante sera migrée vers `[scanId]`.
Un domaine peut avoir plusieurs scans → le `scanId` est la seule clé unique fiable.

---

## Règles de Sécurité (appliquées partout)

| Règle | Implémentation |
|---|---|
| Auth obligatoire | `getUser()` Supabase → 401 si absent |
| Ownership | `Scan.website.userId === currentUser.id` avant toute action |
| Queue | `hasRunningScan(websiteId)` → 409 si déjà en cours |
| Validation | URL vide, domaine invalide → 400 Bad Request |
| Accès croisé | Un user ne peut jamais lire le scan d'un autre |

---

## Plan de Vérification

```bash
npx tsc --noEmit                        # 0 erreur TypeScript
npx prisma db seed                      # 16 SecurityTool créés
```

Test manuel :
1. Connexion → `/dashboard/scan`
2. Saisir `example.com` → Full Scan → Lancer
3. ProgressCard poll → 3s → RUNNING → COMPLETED
4. ResultsCard : score réel affiché
5. Clic "Voir le rapport" → `/dashboard/reports/[scanId]`
6. Vérification DB : Scan, ScanResult, SecurityScore, Recommendation
7. Tenter un 2e scan pendant que le premier tourne → erreur 409 attendue
8. Tester l'accès au scan d'un autre user → 403 attendu

---

## Ordre d'Exécution

```
1. prisma/seed.ts
2. lib/db/prisma.ts
3. lib/scanEngine.ts (runCustomScan)
4. lib/db/services/auth.service.ts
5. lib/db/services/scan.service.ts
6. app/api/security-tools/route.ts
7. app/api/scans/route.ts
8. app/api/scans/[id]/start/route.ts
9. app/api/scans/[id]/status/route.ts
10. components/dashboard/scan/ (4 composants)
11. app/dashboard/scan/page.tsx (refactor)
12. app/dashboard/reports/[scanId]/page.tsx (migration)
```
