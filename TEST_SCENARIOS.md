# Scénarios de Test - Application de Facturation

## Vue d'ensemble

Ce document décrit les scénarios de test à exécuter pour valider le bon fonctionnement de l'application de facturation.

---

## ✅ Tests de Configuration

### TC-001 : Configuration initiale
**Objectif** : Vérifier que la configuration des paramètres fonctionne correctement

**Prérequis** : Application installée, aucune configuration existante

**Étapes** :
1. Accéder à `/app/settings`
2. Remplir tous les champs obligatoires :
   - Dénomination : "Test Boutique SARL"
   - Adresse : "1 Rue de Test, 75001 Paris"
   - SIREN : "123456789"
   - TVA : "FRXX999999999"
3. Cocher la checklist de conformité
4. Cliquer sur "Sauvegarder"

**Résultat attendu** :
- ✅ Message de succès affiché
- ✅ Paramètres sauvegardés en base de données
- ✅ Redirection possible vers le dashboard

---

## 📄 Tests de Génération de Facture

### TC-002 : Génération facture client France
**Objectif** : Générer une facture pour un client français avec TVA normale

**Prérequis** : Configuration complète, commande Shopify avec client français

**Données** :
- Client : Jean Dupont, 10 Rue Client, 75010 Paris, FR
- Produit : T-shirt x2, 20€ HT unitaire
- TVA : 20%

**Étapes** :
1. Aller sur `/app/invoices/generate`
2. Entrer l'ID de la commande
3. Cliquer sur "Générer la facture"

**Résultat attendu** :
- ✅ Facture créée avec numéro FAC-2025-0001
- ✅ Total HT : 40,00 €
- ✅ Total TVA : 8,00 € (20%)
- ✅ Total TTC : 48,00 €
- ✅ PDF généré et téléchargeable
- ✅ Toutes les mentions légales présentes

### TC-003 : Génération facture franchise en base
**Objectif** : Vérifier la génération sans TVA pour franchise en base

**Prérequis** : Paramètres avec "Franchise en base" activée

**Données** :
- Client : Marie Martin, 20 Rue Test, 69001 Lyon, FR
- Produit : Livre x1, 15€ HT

**Étapes** :
1. Activer "Franchise en base" dans les paramètres
2. Générer une facture pour une commande

**Résultat attendu** :
- ✅ Total HT : 15,00 €
- ✅ Total TVA : 0,00 €
- ✅ Total TTC : 15,00 €
- ✅ Mention "TVA non applicable, art. 293 B du CGI" présente
- ✅ Badge "Franchise" affiché dans la liste

### TC-004 : Génération facture UE sans OSS
**Objectif** : Client UE, cumul < €10,000, TVA française appliquée

**Prérequis** : OSS désactivé ou seuil non atteint

**Données** :
- Client : Hans Schmidt, Berlin, Allemagne (DE)
- Produit : Chemise x1, 50€ HT

**Étapes** :
1. S'assurer que OSS n'est pas activé OU seuil < €10,000
2. Générer la facture

**Résultat attendu** :
- ✅ Total HT : 50,00 €
- ✅ Total TVA : 10,00 € (TVA française 20%)
- ✅ Total TTC : 60,00 €
- ✅ ossApplied : false
- ✅ Badge "Standard" affiché

### TC-005 : Génération facture UE avec OSS
**Objectif** : Client UE, seuil OSS atteint, TVA allemande appliquée

**Prérequis** : 
- OSS activé dans les paramètres
- Cumul ventes UE pour l'Allemagne ≥ €10,000

**Données** :
- Client : Hans Schmidt, Berlin, Allemagne (DE)
- Produit : Chemise x1, 50€ HT
- TVA Allemagne : 19%

**Étapes** :
1. Activer OSS dans les paramètres
2. S'assurer que le seuil est atteint (manuellement créer des ventes test)
3. Générer la facture

**Résultat attendu** :
- ✅ Total HT : 50,00 €
- ✅ Total TVA : 9,50 € (TVA allemande 19%)
- ✅ Total TTC : 59,50 €
- ✅ ossApplied : true
- ✅ Badge "OSS" affiché
- ✅ Mention OSS présente dans les mentions légales
- ✅ Vente enregistrée dans OssSale pour reporting

### TC-006 : Duplicate invoice prevention
**Objectif** : Vérifier qu'on ne peut pas créer deux factures pour la même commande

**Étapes** :
1. Générer une facture pour commande X
2. Essayer de générer à nouveau une facture pour commande X

**Résultat attendu** :
- ✅ Première génération réussit
- ✅ Seconde génération retourne la facture existante
- ✅ Même numéro de facture retourné
- ✅ Pas de nouveau numéro créé

---

## 🔢 Tests de Numérotation

### TC-007 : Numérotation séquentielle
**Objectif** : Vérifier que les numéros se suivent correctement

**Étapes** :
1. Générer facture 1 → FAC-2025-0001
2. Générer facture 2 → FAC-2025-0002
3. Générer facture 3 → FAC-2025-0003

**Résultat attendu** :
- ✅ Numéros séquentiels sans saut
- ✅ Format correct selon configuration

### TC-008 : Non-réutilisation des numéros
**Objectif** : Vérifier qu'un numéro n'est jamais réutilisé même en cas d'erreur

**Étapes** :
1. Générer une facture qui échoue (ex: données manquantes)
2. Vérifier le currentSequence en base
3. Générer une facture valide

**Résultat attendu** :
- ✅ Le numéro incrémente même en cas d'échec
- ✅ Pas de réutilisation du numéro "perdu"

### TC-009 : Format personnalisé
**Objectif** : Vérifier que le format personnalisé fonctionne

**Étapes** :
1. Changer le format en "{PREFIX}-{YY}{MM}-{NNN}"
2. Générer une facture en janvier 2025

**Résultat attendu** :
- ✅ Numéro : FAC-2501-001 (ou équivalent selon le mois)

---

## 📊 Tests OSS

### TC-010 : Suivi du seuil OSS
**Objectif** : Vérifier que le seuil OSS est correctement suivi

**Données** :
- 10 commandes allemandes de 1000€ TTC chacune

**Étapes** :
1. Générer 10 factures pour clients allemands
2. Consulter `/app/reports/oss`

**Résultat attendu** :
- ✅ OssThreshold pour DE créé
- ✅ totalSalesTtc = 10 000€
- ✅ thresholdReached = true
- ✅ Alert sur le dashboard

### TC-011 : Rapport OSS trimestriel
**Objectif** : Générer un rapport OSS complet

**Prérequis** : Plusieurs ventes OSS dans le trimestre

**Étapes** :
1. Aller sur `/app/reports/oss`
2. Sélectionner année et trimestre
3. Cliquer "Charger le rapport"
4. Cliquer "Télécharger CSV"

**Résultat attendu** :
- ✅ Liste des ventes OSS affichée
- ✅ Résumé par pays calculé correctement
- ✅ CSV téléchargeable
- ✅ Format CSV correct avec en-têtes
- ✅ Totaux calculés correctement

---

## 🔍 Tests d'Interface

### TC-012 : Dashboard
**Objectif** : Vérifier l'affichage du dashboard

**Étapes** :
1. Accéder à `/app`

**Résultat attendu** :
- ✅ Nombre de factures affiché
- ✅ Total ventes UE affiché (si OSS activé)
- ✅ 5 dernières factures listées
- ✅ Actions rapides accessibles
- ✅ Banner de configuration si settings manquants

### TC-013 : Liste des factures
**Objectif** : Vérifier la liste et la recherche

**Étapes** :
1. Aller sur `/app/invoices`
2. Utiliser la recherche pour "FAC-2025-0001"
3. Filtrer par nom de client

**Résultat attendu** :
- ✅ Toutes les factures affichées
- ✅ Recherche fonctionne
- ✅ Colonnes correctes (N°, Date, Client, Pays, Montant, Régime, Statut)
- ✅ Bouton télécharger disponible

### TC-014 : Paramètres
**Objectif** : Vérifier la page de paramètres

**Étapes** :
1. Accéder à `/app/settings`
2. Modifier un champ
3. Sauvegarder

**Résultat attendu** :
- ✅ Tous les champs affichés
- ✅ Valeurs actuelles chargées
- ✅ Sauvegarde réussie
- ✅ Message de confirmation
- ✅ Validations côté client fonctionnent

---

## ⚠️ Tests d'Erreur

### TC-015 : Validation SIREN manquant
**Objectif** : Vérifier que la validation bloque la génération

**Étapes** :
1. Supprimer le SIREN des paramètres
2. Essayer de générer une facture

**Résultat attendu** :
- ✅ Erreur : "SIREN is required"
- ✅ Facture non créée
- ✅ Numéro non incrémenté

### TC-016 : Commande inexistante
**Objectif** : Gérer une commande qui n'existe pas

**Étapes** :
1. Entrer un ID de commande invalide
2. Essayer de générer

**Résultat attendu** :
- ✅ Erreur : "Order not found in Shopify"
- ✅ Message d'erreur clair
- ✅ Pas de facture créée

---

## 📄 Tests de PDF

### TC-017 : Contenu du PDF
**Objectif** : Vérifier que le PDF contient toutes les mentions

**Étapes** :
1. Générer une facture
2. Télécharger le PDF
3. Ouvrir et vérifier le contenu

**Résultat attendu** :
- ✅ Titre "FACTURE" présent
- ✅ Numéro de facture visible
- ✅ Date d'émission
- ✅ Informations vendeur complètes
- ✅ Informations client complètes
- ✅ Tableau des lignes avec toutes les colonnes
- ✅ Totaux HT/TVA/TTC
- ✅ Mentions légales complètes
- ✅ Format A4 portrait

### TC-018 : Thèmes PDF
**Objectif** : Vérifier les 3 thèmes disponibles

**Étapes** :
1. Générer facture avec thème Compact
2. Générer facture avec thème Standard
3. Générer facture avec thème Detail

**Résultat attendu** :
- ✅ 3 PDF générés avec styles différents
- ✅ Contenu identique, mise en page différente
- ✅ Tous lisibles et professionnels

---

## 🔒 Tests de Sécurité

### TC-019 : Authentification requise
**Objectif** : Vérifier qu'on ne peut pas accéder sans authentification

**Étapes** :
1. Essayer d'accéder aux API sans token Shopify

**Résultat attendu** :
- ✅ Erreur 401 Unauthorized
- ✅ Redirection vers login Shopify

### TC-020 : Isolation par boutique
**Objectif** : Vérifier que chaque boutique voit seulement ses données

**Étapes** :
1. Créer factures pour boutique A
2. Se connecter avec boutique B
3. Essayer de lister les factures

**Résultat attendu** :
- ✅ Boutique B ne voit que ses factures
- ✅ Pas d'accès aux factures de boutique A

---

## 📈 Tests de Performance

### TC-021 : Génération de masse
**Objectif** : Vérifier la performance avec beaucoup de factures

**Étapes** :
1. Générer 100 factures
2. Mesurer le temps de génération
3. Vérifier la liste des factures

**Résultat attendu** :
- ✅ Génération < 2 secondes par facture
- ✅ Liste se charge rapidement
- ✅ Recherche reste fluide

---

## ✅ Checklist de Test Complète

### Configuration
- [ ] TC-001 : Configuration initiale

### Génération
- [ ] TC-002 : Facture client France
- [ ] TC-003 : Facture franchise en base
- [ ] TC-004 : Facture UE sans OSS
- [ ] TC-005 : Facture UE avec OSS
- [ ] TC-006 : Prévention duplicats

### Numérotation
- [ ] TC-007 : Numérotation séquentielle
- [ ] TC-008 : Non-réutilisation
- [ ] TC-009 : Format personnalisé

### OSS
- [ ] TC-010 : Suivi du seuil
- [ ] TC-011 : Rapport trimestriel

### Interface
- [ ] TC-012 : Dashboard
- [ ] TC-013 : Liste factures
- [ ] TC-014 : Paramètres

### Erreurs
- [ ] TC-015 : SIREN manquant
- [ ] TC-016 : Commande inexistante

### PDF
- [ ] TC-017 : Contenu PDF
- [ ] TC-018 : Thèmes PDF

### Sécurité
- [ ] TC-019 : Authentification
- [ ] TC-020 : Isolation

### Performance
- [ ] TC-021 : Génération de masse

---

## 🎯 Résultat Final

**Tests passés** : __ / 21
**Tests échoués** : __ / 21
**Taux de réussite** : __%

**Statut global** : ☐ Prêt pour production | ☐ Corrections requises

---

## 📝 Notes

Utilisez cette section pour noter les bugs trouvés, améliorations suggérées, ou observations durant les tests.
