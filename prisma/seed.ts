import { PrismaClient, ToolCategory } from '@prisma/client';

const prisma = new PrismaClient();

const tools = [
  // WEBSITE_SECURITY (10 tools)
  {
    name: 'SSL Checker',
    slug: 'ssl-checker',
    description: "Inspecte la chaîne de certificats SSL/TLS, l'autorité d'émission et la date d'expiration.",
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 1,
  },
  {
    name: 'TLS Analyzer',
    slug: 'tls-analyzer',
    description: 'Audite les versions de protocole TLS supportées (TLS 1.0, 1.1, 1.2, 1.3).',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 2,
  },
  {
    name: 'Security Headers',
    slug: 'security-headers',
    description: 'Vérifie la présence des en-têtes HTTP de sécurité (HSTS, CSP, X-Frame-Options...).',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 3,
  },
  {
    name: 'Cookie Analyzer',
    slug: 'cookie-analyzer',
    description: 'Inspecte les attributs de sécurité des cookies (HttpOnly, Secure, SameSite).',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 4,
  },
  {
    name: 'HTTP Methods',
    slug: 'http-methods',
    description: 'Détecte les méthodes HTTP autorisées et identifie les méthodes verbeuses ou à risque.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 5,
  },
  {
    name: 'CORS Analyzer',
    slug: 'cors-analyzer',
    description: 'Analyse la politique d\'accès Cross-Origin Resource Sharing et ses éventuelles faiblesses.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 6,
  },
  {
    name: 'CSP Validator',
    slug: 'csp-validator',
    description: 'Évalue la robustesse de l\'en-tête Content-Security-Policy contre les attaques XSS.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 7,
  },
  {
    name: 'Redirect Analyzer',
    slug: 'redirect-analyzer',
    description: 'Vérifie les redirections automatiques HTTP vers HTTPS et l\'absence de boucles.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 8,
  },
  {
    name: 'Robots.txt',
    slug: 'robots-analyzer',
    description: 'Analyse le fichier robots.txt pour détecter d\'éventuelles expositions d\'URLs sensibles.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 9,
  },
  {
    name: 'Sitemap',
    slug: 'sitemap-checker',
    description: 'Vérifie l\'accessibilité et le formatage du fichier sitemap.xml.',
    category: ToolCategory.WEBSITE_SECURITY,
    displayOrder: 10,
  },

  // EMAIL_SECURITY (3 tools)
  {
    name: 'SPF Record',
    slug: 'spf-checker',
    description: 'Vérifie la présence et la syntaxe de l\'enregistrement DNS Sender Policy Framework.',
    category: ToolCategory.EMAIL_SECURITY,
    displayOrder: 11,
  },
  {
    name: 'DKIM Selector',
    slug: 'dkim-checker',
    description: 'Analyse la configuration des clés de signature de courriels DomainKeys Identified Mail.',
    category: ToolCategory.EMAIL_SECURITY,
    displayOrder: 12,
  },
  {
    name: 'DMARC Policy',
    slug: 'dmarc-checker',
    description: 'Inspecte la politique DMARC et les règles d\'alignement et d\'exigence de rejet/quarantaine.',
    category: ToolCategory.EMAIL_SECURITY,
    displayOrder: 13,
  },

  // DNS_DOMAIN_SECURITY (3 tools)
  {
    name: 'DNS Lookup',
    slug: 'dns-lookup',
    description: 'Examine la résolution globale des enregistrements DNS A, AAAA, MX, NS et TXT.',
    category: ToolCategory.DNS_DOMAIN_SECURITY,
    displayOrder: 14,
  },
  {
    name: 'WHOIS Lookup',
    slug: 'whois-lookup',
    description: 'Récupère les informations publiques d\'enregistrement du registrar et des serveurs DNS.',
    category: ToolCategory.DNS_DOMAIN_SECURITY,
    displayOrder: 15,
  },
  {
    name: 'Domain Age',
    slug: 'domain-age-checker',
    description: 'Calcule l\'ancienneté du nom de domaine et vérifie la date d\'expiration.',
    category: ToolCategory.DNS_DOMAIN_SECURITY,
    displayOrder: 16,
  },
];

async function main() {
  console.log('Seeding SecurityTools...');
  for (const tool of tools) {
    await prisma.securityTool.upsert({
      where: { slug: tool.slug },
      update: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        displayOrder: tool.displayOrder,
        isActive: true,
      },
      create: {
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        category: tool.category,
        displayOrder: tool.displayOrder,
        isActive: true,
      },
    });
  }
  console.log(`Successfully seeded ${tools.length} SecurityTools.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
