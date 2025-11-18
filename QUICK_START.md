# Guide de Démarrage Rapide - Application de Facturation

## 🚀 Installation en 5 minutes

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de la base de données
```bash
npx prisma generate
npx prisma migrate dev
```

### 3. Lancement de l'application
```bash
npm run dev
```

L'application sera accessible via Shopify Partner Dashboard.

---

## ⚙️ Configuration initiale (obligatoire)

### Étape 1 : Accéder aux paramètres
Cliquez sur **"Paramètres"** dans le menu ou allez sur `/app/settings`

### Étape 2 : Remplir les informations obligatoires

#### Informations de l'entreprise (requis)
- **Dénomination sociale** : Nom légal de votre entreprise
- **Adresse** : Adresse complète du siège social
- **SIREN** : 9 chiffres (ex: 123456789)
- **SIRET** : 14 chiffres (optionnel mais recommandé)
- **RCS** : Ex: "RCS Paris"
- **N° TVA Intracommunautaire** : Format FRXX999999999

#### Régime de TVA
Choisissez votre situation :

**Option A : TVA normale (défaut)**
- Laissez toutes les cases décochées
- TVA de 20% sera appliquée automatiquement

**Option B : Franchise en base**
- ☑ Cochez "Franchise en base"
- Les factures porteront la mention "TVA non applicable, art. 293 B du CGI"
- Aucune TVA ne sera calculée

**Option C : Inscrit OSS**
- ☑ Cochez "Inscrit au régime OSS"
- Renseignez votre numéro OSS
- Le système appliquera automatiquement la TVA du pays client si le seuil de €10,000 est dépassé

### Étape 3 : Configurer la numérotation
- **Préfixe** : FAC (ou INV, F, etc.)
- **Format** : {PREFIX}-{YYYY}-{NNNN}
  - Résultat : FAC-2025-0001, FAC-2025-0002, etc.

### Étape 4 : Conditions de paiement
- **Modalités** : "Paiement à réception" (recommandé)
- **Pénalités** : "3 fois le taux d'intérêt légal" (légal en France)

### Étape 5 : Confirmer la conformité
- ☑ Cochez "Je confirme avoir vérifié toutes les informations légales"

### Étape 6 : Sauvegarder
Cliquez sur **"Sauvegarder les paramètres"**

---

## 📄 Générer votre première facture

### Méthode 1 : Interface graphique

1. Allez sur le **Dashboard** (`/app`)
2. Cliquez sur **"Générer une facture"**
3. Entrez l'**ID de la commande Shopify**
   - Format : `gid://shopify/Order/123456789`
   - Ou simplement le numéro : `123456789`
4. Cliquez sur **"Générer la facture"**
5. ✅ Votre facture est créée et disponible en téléchargement !

### Méthode 2 : API

```bash
curl -X POST https://your-app.myshopify.com/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{"order_id": "gid://shopify/Order/123456789"}'
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

---

## 📊 Consulter vos factures

### Liste des factures
1. Allez sur `/app/invoices`
2. Utilisez la barre de recherche pour filtrer
3. Téléchargez les PDF en cliquant sur "Télécharger"

### Dernières factures
Le **Dashboard** affiche les 5 dernières factures générées.

---

## 🇪🇺 Suivre le seuil OSS

### Qu'est-ce que l'OSS ?
Le régime **OSS (One Stop Shop)** simplifie la déclaration de TVA pour les ventes intracommunautaires B2C.

### Seuil de €10,000
- Tant que vos ventes UE < €10,000/an → TVA française appliquée
- Dès que ventes UE ≥ €10,000/an → TVA du pays client appliquée

### Suivi automatique
L'application suit automatiquement vos ventes UE par pays et vous alerte quand le seuil est atteint.

### Rapport OSS
1. Allez sur `/app/reports/oss`
2. Sélectionnez l'année et le trimestre
3. Cliquez sur **"Charger le rapport"**
4. Téléchargez le CSV pour votre déclaration

---

## 📋 Checklist de conformité

Avant d'émettre des factures en production :

- [ ] SIREN renseigné et vérifié
- [ ] SIRET renseigné (si applicable)
- [ ] RCS renseigné avec la bonne ville
- [ ] N° TVA intracommunautaire vérifié
- [ ] Régime TVA correct (normal, franchise, OSS)
- [ ] Numérotation testée sur commande test
- [ ] PDF généré et vérifié visuellement
- [ ] Toutes les mentions légales présentes
- [ ] **Expert-comptable consulté** ✓

---

## 🆘 Problèmes courants

### "Shop settings not found"
→ Vous devez d'abord configurer les paramètres dans `/app/settings`

### "SIREN is required"
→ Le SIREN est obligatoire pour la conformité française

### Le PDF n'est pas généré
→ En développement, le PDF est enregistré localement dans `storage/invoices/`

### Le numéro de facture saute des valeurs
→ C'est normal ! Les numéros ne sont jamais réutilisés, même en cas d'erreur

### L'OSS ne s'applique pas
→ Vérifiez que :
  1. OSS est activé dans les paramètres
  2. Le client est dans un pays UE (hors France)
  3. Le seuil de €10,000 a été atteint

---

## 📞 Support

### Documentation complète
Consultez [INVOICE_APP_DOCUMENTATION.md](./INVOICE_APP_DOCUMENTATION.md)

### Conformité légale
⚠️ **Important** : Cette application automatise la génération de factures mais ne remplace pas un conseil professionnel.

**Nous recommandons vivement de :**
1. Faire valider vos paramètres par un expert-comptable
2. Vérifier les premières factures avec votre comptable
3. Consulter votre expert pour toute question fiscale

### Questions techniques
- Ouvrir une issue sur GitHub
- Consulter la documentation Shopify

---

## 🎯 Prochaines étapes

Une fois la configuration terminée :

1. ✅ Testez sur une commande réelle
2. ✅ Vérifiez que toutes les mentions légales sont présentes
3. ✅ Faites valider par votre expert-comptable
4. ✅ Activez la génération automatique (optionnel)
5. ✅ Configurez vos webhooks (optionnel)

**Bon usage de l'application ! 🎉**
