# Application de Facturation B2C Shopify - Documentation Complète

## Vue d'ensemble

Cette application Shopify génère des factures PDF conformes à la législation française et européenne pour les ventes B2C (Business to Consumer). Elle gère automatiquement la TVA, le régime OSS (One Stop Shop) pour les ventes intracommunautaires, et inclut toutes les mentions légales obligatoires.

## Table des matières

1. [Fonctionnalités principales](#fonctionnalités-principales)
2. [Conformité légale](#conformité-légale)
3. [Architecture technique](#architecture-technique)
4. [Installation et configuration](#installation-et-configuration)
5. [Utilisation](#utilisation)
6. [API Endpoints](#api-endpoints)
7. [Gestion de la TVA et OSS](#gestion-de-la-tva-et-oss)
8. [Numérotation des factures](#numérotation-des-factures)
9. [Génération de PDF](#génération-de-pdf)
10. [Reporting OSS](#reporting-oss)
11. [Sécurité et RGPD](#sécurité-et-rgpd)
12. [Dépannage](#dépannage)

---

## Fonctionnalités principales

### Génération de factures
- ✅ Génération de facture PDF pour une commande Shopify
- ✅ Génération en lot (batch) pour plusieurs commandes
- ✅ Téléchargement et archivage automatique des PDF
- ✅ Export de lots au format ZIP
- ✅ Rapport OSS trimestriel (CSV)

### Conformité légale française/UE
- ✅ Toutes les mentions obligatoires françaises pour factures B2C
- ✅ Gestion du régime OSS (seuil €10,000)
- ✅ Support de la franchise en base (TVA non applicable)
- ✅ Numérotation séquentielle et non réutilisable
- ✅ Mentions légales automatiques (conservation 10 ans, garantie 2 ans, etc.)

### Interface administrateur
- ✅ Configuration des informations de l'entreprise (SIREN, SIRET, TVA)
- ✅ Visualisation des factures avec recherche et filtres
- ✅ Paramétrage du régime TVA (OSS, franchise en base)
- ✅ Checklist de conformité légale

---

## Conformité légale

### Mentions obligatoires sur chaque facture

Conformément à la législation française, chaque facture générée inclut :

1. **Titre** : "FACTURE" + numéro unique
2. **Date d'émission**
3. **Identité du vendeur** :
   - Dénomination sociale
   - Adresse du siège
   - Forme juridique et capital social
   - SIREN/SIRET
   - RCS + ville du greffe
   - N° TVA intracommunautaire
4. **Identité de l'acheteur** :
   - Nom complet
   - Adresse de livraison/facturation
5. **Description des biens/services** :
   - Désignation détaillée
   - Quantité, unité
   - Prix unitaire HT
   - Montants HT, TVA, TTC par ligne
6. **Totaux** : Total HT, Total TVA, Total TTC
7. **Conditions de paiement** :
   - Modalités
   - Pénalités de retard (taux légal × 3)
   - Indemnité forfaitaire de 40€
8. **Mentions spéciales** :
   - Franchise en base : "TVA non applicable, art. 293 B du CGI"
   - OSS : "TVA acquittée dans le cadre du régime OSS"
9. **Garantie légale** : Mention garantie de conformité 2 ans
10. **Conservation** : Obligation de conservation 10 ans

### Régimes de TVA

#### 1. TVA Standard (France)
- Taux normal : 20%
- Taux réduit : 10%, 5.5%, 2.1%
- Appliqué aux ventes françaises et UE < €10,000

#### 2. Franchise en base (Art. 293 B CGI)
- Pour les micro-entreprises en dessous du seuil
- TVA = 0%
- Mention obligatoire : "TVA non applicable, art. 293 B du CGI"

#### 3. Régime OSS (One Stop Shop)
- Pour ventes UE B2C > €10,000/an (cumulé)
- Application du taux TVA du pays de consommation
- Déclaration trimestrielle obligatoire
- Mention : "TVA acquittée dans le cadre du régime OSS"

### Avertissement important

⚠️ **Cette application fournit une automatisation mais ne remplace pas un conseil d'expert-comptable.**

Les informations et calculs fournis visent à faciliter la génération de factures conformes, mais chaque commerçant reste responsable de :
- La vérification de ses informations légales (SIREN, RCS, TVA)
- La déclaration correcte de ses régimes fiscaux (OSS, franchise en base)
- La validation finale des factures par un expert-comptable
- Le respect des obligations fiscales et comptables

**Nous recommandons vivement de consulter un expert-comptable avant la première émission de factures.**

---

## Architecture technique

### Stack technologique

- **Backend** : Node.js + TypeScript
- **Framework** : Remix (React Router)
- **Base de données** : SQLite (dev) / PostgreSQL (production)
- **ORM** : Prisma
- **Frontend** : React + Shopify Polaris
- **PDF** : HTML/CSS + Puppeteer (à configurer)
- **Queue** : BullMQ + Redis (à configurer)
- **API Shopify** : GraphQL Admin API

### Structure des dossiers

```
app/
├── lib/
│   └── constants.ts              # Constantes (taux TVA, pays UE, etc.)
├── services/
│   ├── invoice.service.server.ts # Logique métier factures
│   ├── pdf.service.server.ts     # Génération PDF
│   ├── oss.service.server.ts     # Reporting OSS
│   └── shopify.service.server.ts # Intégration Shopify
├── types/
│   └── invoice.types.ts          # Types TypeScript
└── routes/
    ├── api.invoices.generate.ts  # API génération facture
    ├── api.settings.ts           # API paramètres
    ├── api.reports.oss.ts        # API rapport OSS
    ├── app.settings.tsx          # Page paramètres
    └── app.invoices.tsx          # Page liste factures

prisma/
├── schema.prisma                 # Schéma base de données
└── migrations/                   # Migrations
```

### Modèle de données

#### ShopSettings
Configuration de la boutique pour la génération de factures :
- Informations légales (SIREN, SIRET, RCS, TVA)
- Régime TVA (OSS, franchise en base)
- Format de numérotation
- Conditions de paiement

#### Invoice
Facture principale :
- Numéro unique et séquentiel
- Informations client et vendeur (snapshot)
- Totaux HT/TVA/TTC
- Indicateurs OSS/franchise en base
- Lien vers le PDF généré

#### InvoiceLine
Lignes de facturation :
- Référence produit (SKU)
- Description
- Quantité, prix unitaire HT
- Taux TVA et montant TVA
- Totaux ligne

#### OssSale
Ventes OSS pour reporting trimestriel :
- Période (année, trimestre)
- Pays du client
- Montants HT, TVA, TTC

#### OssThreshold
Suivi des seuils OSS par pays :
- Cumul annuel des ventes UE
- Statut du seuil (atteint/non atteint)
- Date de franchissement

---

## Installation et configuration

### Prérequis

- Node.js 18.20+ ou 20.10+
- npm ou yarn
- Compte Shopify Partner
- Boutique de test Shopify

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd empty_app_shopify
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Lancer l'application en développement**
```bash
npm run dev
```

### Configuration initiale

1. **Accéder aux paramètres** : `/app/settings`

2. **Remplir les informations obligatoires** :
   - Dénomination sociale
   - Adresse complète
   - SIREN (9 chiffres)
   - SIRET (14 chiffres) - optionnel
   - RCS + ville (ex: "RCS Paris")
   - N° TVA intracommunautaire (ex: "FRXX999999999")

3. **Configurer le régime TVA** :
   - ☐ Franchise en base : cochez si applicable
   - ☐ Inscrit OSS : cochez si ventes UE > €10,000/an

4. **Paramétrer la numérotation** :
   - Préfixe (ex: "FAC")
   - Format (ex: "{PREFIX}-{YYYY}-{NNNN}")

5. **Conditions de paiement** :
   - Modalités (ex: "Paiement à réception")
   - Taux de pénalités de retard

6. **Cocher la checklist de conformité**
   - Confirmer avoir vérifié toutes les informations

7. **Sauvegarder**

### Variables d'environnement (production)

```env
# Shopify
SHOPIFY_API_KEY=<votre-api-key>
SHOPIFY_API_SECRET=<votre-api-secret>

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_invoices

# Redis (pour queue batch)
REDIS_URL=redis://localhost:6379

# S3 (pour stockage PDF)
S3_BUCKET=shopify-invoices
S3_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<votre-key>
AWS_SECRET_ACCESS_KEY=<votre-secret>
```

---

## Utilisation

### Générer une facture pour une commande

#### Via l'interface

1. Aller sur `/app/invoices`
2. Cliquer sur "Générer une facture"
3. Entrer l'ID de la commande Shopify
4. La facture est générée automatiquement

#### Via API

```bash
POST /api/invoices/generate
Content-Type: application/json

{
  "order_id": "gid://shopify/Order/123456789"
}
```

Réponse :
```json
{
  "success": true,
  "invoice": {
    "id": "uuid-xxx",
    "invoiceNumber": "FAC-2025-0001",
    "pdfUrl": "/api/invoices/pdf/FAC-2025-0001.pdf",
    "totalTtc": 120.00
  }
}
```

### Consulter les factures

Accéder à `/app/invoices` pour :
- Voir la liste de toutes les factures
- Rechercher par numéro, client, ou commande
- Télécharger les PDF
- Voir le statut (généré, OSS, franchise en base)

### Générer un rapport OSS

Accéder à `/api/reports/oss?year=2025&quarter=1&format=csv` pour télécharger le rapport OSS trimestriel au format CSV.

---

## API Endpoints

### POST /api/invoices/generate

Génère une facture pour une commande Shopify.

**Body** :
```json
{
  "order_id": "gid://shopify/Order/123456789"
}
```

**Réponse** :
```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "FAC-2025-0001",
    "pdfUrl": "/api/invoices/pdf/FAC-2025-0001.pdf",
    "totalTtc": 120.00
  }
}
```

### GET /api/settings

Récupère les paramètres de la boutique.

**Réponse** :
```json
{
  "success": true,
  "settings": {
    "companyName": "Ma Boutique SARL",
    "siren": "123456789",
    "ossEnabled": true,
    "franchiseEnBase": false,
    ...
  }
}
```

### POST /api/settings

Met à jour les paramètres de la boutique.

**Body** :
```json
{
  "settings": {
    "companyName": "Ma Boutique SARL",
    "siren": "123456789",
    "ossEnabled": true,
    ...
  }
}
```

### GET /api/reports/oss

Génère un rapport OSS trimestriel.

**Paramètres** :
- `year` : année (ex: 2025)
- `quarter` : trimestre (1-4)
- `format` : "json" ou "csv"

**Exemple** :
```
GET /api/reports/oss?year=2025&quarter=1&format=csv
```

---

## Gestion de la TVA et OSS

### Logique de calcul de la TVA

1. **Franchise en base activée** → TVA = 0%, mention "Art. 293 B CGI"
2. **Client France** → TVA française (20%)
3. **Client UE + cumul < €10,000** → TVA française (20%)
4. **Client UE + OSS activé + cumul ≥ €10,000** → TVA du pays client
5. **Client hors UE** → TVA française (export)

### Suivi du seuil OSS

L'application suit automatiquement :
- Le cumul annuel des ventes par pays UE
- Le franchissement du seuil de €10,000
- La date de franchissement du seuil

Quand le seuil est atteint :
- Les factures suivantes appliquent la TVA du pays de destination
- La mention OSS est ajoutée aux factures
- Les ventes sont enregistrées pour le reporting OSS

### Reporting OSS trimestriel

Le rapport OSS inclut :
- Liste détaillée des ventes OSS par pays
- Résumé par pays : Total HT, Total TVA, Nombre de commandes
- Export CSV compatible avec déclaration fiscale

---

## Numérotation des factures

### Règles

- **Séquentielle** : les numéros se suivent sans interruption
- **Non réutilisable** : un numéro utilisé ne peut jamais être réutilisé
- **Configurable** : format personnalisable

### Format par défaut

`{PREFIX}-{YYYY}-{NNNN}`

Exemples :
- FAC-2025-0001
- FAC-2025-0002
- ...

### Placeholders disponibles

- `{PREFIX}` : Préfixe personnalisé (ex: FAC, INV, F)
- `{YYYY}` : Année sur 4 chiffres (ex: 2025)
- `{YY}` : Année sur 2 chiffres (ex: 25)
- `{MM}` : Mois (01-12)
- `{DD}` : Jour (01-31)
- `{NNNN}` : Séquence sur 4 chiffres (0001-9999)
- `{NNN}` : Séquence sur 3 chiffres
- `{NN}` : Séquence sur 2 chiffres

### Reset annuel

La séquence peut se réinitialiser chaque année tout en conservant la monotonie globale.

---

## Génération de PDF

### Thèmes disponibles

1. **Compact** : Format condensé, idéal pour impression économique
2. **Standard** : Format équilibré (recommandé)
3. **Détail** : Format avec plus d'espaces et détails

### Structure du PDF

- **En-tête** : Logo, nom boutique, "FACTURE", numéro
- **Parties** : Informations vendeur et client
- **Badges** : OSS ou Franchise en base si applicable
- **Tableau** : Lignes de facturation avec colonnes :
  - Référence (SKU)
  - Désignation
  - Quantité
  - Prix unitaire HT
  - Total HT
  - Taux TVA
  - Total TTC
- **Totaux** : Total HT, Total TVA, Total TTC
- **Mentions légales** : Conservation, garantie, paiement
- **Pied de page** : Nom boutique, date de génération

### Format

- **Taille** : A4 portrait
- **Qualité** : Haute résolution, prêt à imprimer
- **Encodage** : UTF-8 (support caractères accentués)

---

## Reporting OSS

### Périodicité

Déclarations trimestrielles obligatoires :
- Q1 : Janvier - Mars
- Q2 : Avril - Juin
- Q3 : Juillet - Septembre
- Q4 : Octobre - Décembre

### Format du rapport CSV

```csv
Order ID,Invoice Number,Date,Country,Base HT (€),Tax Rate (%),Tax Amount (€),Total TTC (€)
xxx,FAC-2025-0001,2025-01-15,DE,100.00,19.00,19.00,119.00
xxx,FAC-2025-0002,2025-02-20,ES,200.00,21.00,42.00,242.00

Summary by Country
Country,Order Count,Total HT (€),Total VAT (€),Total TTC (€)
DE,1,100.00,19.00,119.00
ES,1,200.00,42.00,242.00

GRAND TOTAL,,300.00,61.00,361.00
```

---

## Sécurité et RGPD

### Données sensibles

Les données suivantes sont stockées :
- Informations clients (nom, adresse) : nécessaire pour factures
- Informations vendeur (SIREN, RCS) : nécessaire pour conformité
- Montants des transactions : nécessaire pour reporting

### Conformité RGPD

- Conservation minimale : données conservées uniquement le temps nécessaire
- Obligation fiscale : 10 ans pour les factures (art. L123-22 Code de commerce)
- Droit d'accès : possibilité de consulter ses données
- Droit à l'effacement : limité par obligations fiscales

### Recommandations

1. Informer les clients de la conservation des données de facturation
2. Mettre à jour la politique de confidentialité
3. Sécuriser l'accès à l'application Shopify
4. Effectuer des sauvegardes régulières

---

## Dépannage

### La génération de facture échoue

**Erreur** : "Shop settings not found"
→ Configurer les paramètres dans `/app/settings`

**Erreur** : "SIREN is required"
→ Renseigner le SIREN dans les paramètres

### Le PDF n'est pas généré

→ Vérifier que Puppeteer est correctement installé
→ En développement, le PDF est sauvegardé localement dans `storage/invoices/`

### Le seuil OSS ne se met pas à jour

→ Vérifier que `ossEnabled` est activé dans les paramètres
→ Le seuil est calculé par pays, pas globalement

### Les factures ont des numéros manquants

→ C'est normal si des erreurs de génération ont eu lieu
→ Les numéros ne sont jamais réutilisés, même en cas d'erreur

---

## Support et contact

Pour toute question relative à :
- **Conformité légale** : consultez un expert-comptable
- **Fonctionnalités de l'application** : ouvrir une issue GitHub
- **Intégration Shopify** : consulter la documentation Shopify

---

## Licence et avertissement légal

Cette application est fournie "en l'état" sans garantie d'aucune sorte. Le commerçant reste seul responsable de la conformité de ses factures et déclarations fiscales.

**Il est vivement recommandé de faire valider la configuration et les premières factures par un expert-comptable avant utilisation en production.**
