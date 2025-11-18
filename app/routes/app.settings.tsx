/**
 * Settings Page - Configure shop information for invoice generation
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Checkbox,
  Select,
  Text,
  BlockStack,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = await fetch(new URL("/api/settings", request.url).toString(), {
    headers: request.headers,
  });
  const data = await response.json();
  return json(data);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const settings = {
    companyName: formData.get("companyName"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    legalForm: formData.get("legalForm"),
    shareCapital: formData.get("shareCapital"),
    siren: formData.get("siren"),
    siret: formData.get("siret"),
    rcs: formData.get("rcs"),
    tvaIntracom: formData.get("tvaIntracom"),
    ossEnabled: formData.get("ossEnabled") === "true",
    ossNumber: formData.get("ossNumber"),
    franchiseEnBase: formData.get("franchiseEnBase") === "true",
    invoicePrefix: formData.get("invoicePrefix"),
    invoiceFormat: formData.get("invoiceFormat"),
    autoGenerateOnPaid: formData.get("autoGenerateOnPaid") === "true",
    defaultLanguage: formData.get("defaultLanguage"),
    pdfTheme: formData.get("pdfTheme"),
    paymentTerms: formData.get("paymentTerms"),
    latePenaltyRate: formData.get("latePenaltyRate"),
    legalChecklistConfirmed: formData.get("legalChecklistConfirmed") === "true",
  };

  // Call API to save settings
  const response = await fetch(new URL("/api/settings", request.url).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(request.headers.entries()),
    },
    body: JSON.stringify({ settings }),
  });

  return json(await response.json());
};

export default function SettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
  const [formState, setFormState] = useState({
    companyName: "",
    address: "",
    postalCode: "",
    city: "",
    country: "FR",
    legalForm: "",
    shareCapital: "",
    siren: "",
    siret: "",
    rcs: "",
    tvaIntracom: "",
    ossEnabled: false,
    ossNumber: "",
    franchiseEnBase: false,
    invoicePrefix: "FAC",
    invoiceFormat: "{PREFIX}-{YYYY}-{NNNN}",
    autoGenerateOnPaid: false,
    defaultLanguage: "FR",
    pdfTheme: "Standard",
    paymentTerms: "Paiement à réception",
    latePenaltyRate: "3 fois le taux d'intérêt légal",
    legalChecklistConfirmed: false,
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (loaderData?.settings) {
      setFormState({
        companyName: loaderData.settings.companyName || "",
        address: loaderData.settings.address || "",
        postalCode: loaderData.settings.postalCode || "",
        city: loaderData.settings.city || "",
        country: loaderData.settings.country || "FR",
        legalForm: loaderData.settings.legalForm || "",
        shareCapital: loaderData.settings.shareCapital || "",
        siren: loaderData.settings.siren || "",
        siret: loaderData.settings.siret || "",
        rcs: loaderData.settings.rcs || "",
        tvaIntracom: loaderData.settings.tvaIntracom || "",
        ossEnabled: loaderData.settings.ossEnabled || false,
        ossNumber: loaderData.settings.ossNumber || "",
        franchiseEnBase: loaderData.settings.franchiseEnBase || false,
        invoicePrefix: loaderData.settings.invoicePrefix || "FAC",
        invoiceFormat: loaderData.settings.invoiceFormat || "{PREFIX}-{YYYY}-{NNNN}",
        autoGenerateOnPaid: loaderData.settings.autoGenerateOnPaid || false,
        defaultLanguage: loaderData.settings.defaultLanguage || "FR",
        pdfTheme: loaderData.settings.pdfTheme || "Standard",
        paymentTerms: loaderData.settings.paymentTerms || "Paiement à réception",
        latePenaltyRate: loaderData.settings.latePenaltyRate || "3 fois le taux d'intérêt légal",
        legalChecklistConfirmed: loaderData.settings.legalChecklistConfirmed || false,
      });
    }
  }, [loaderData]);

  const handleSubmit = () => {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    submit(formData, { method: "post" });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <Page>
      <TitleBar title="Paramètres de Facturation" />
      <Layout>
        {showSuccess && (
          <Layout.Section>
            <Banner status="success" onDismiss={() => setShowSuccess(false)}>
              Paramètres sauvegardés avec succès
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Informations de l'entreprise (obligatoires)
              </Text>
              <FormLayout>
                <TextField
                  label="Dénomination sociale"
                  value={formState.companyName}
                  onChange={(value) => setFormState({ ...formState, companyName: value })}
                  autoComplete="organization"
                  requiredIndicator
                />
                <TextField
                  label="Adresse"
                  value={formState.address}
                  onChange={(value) => setFormState({ ...formState, address: value })}
                  autoComplete="street-address"
                  requiredIndicator
                />
                <FormLayout.Group>
                  <TextField
                    label="Code postal"
                    value={formState.postalCode}
                    onChange={(value) => setFormState({ ...formState, postalCode: value })}
                    autoComplete="postal-code"
                  />
                  <TextField
                    label="Ville"
                    value={formState.city}
                    onChange={(value) => setFormState({ ...formState, city: value })}
                    autoComplete="address-level2"
                  />
                </FormLayout.Group>
                <TextField
                  label="Forme juridique (SARL, SAS, etc.)"
                  value={formState.legalForm}
                  onChange={(value) => setFormState({ ...formState, legalForm: value })}
                />
                <TextField
                  label="Capital social"
                  value={formState.shareCapital}
                  onChange={(value) => setFormState({ ...formState, shareCapital: value })}
                  placeholder="Ex: 10 000 EUR"
                />
                <FormLayout.Group>
                  <TextField
                    label="SIREN"
                    value={formState.siren}
                    onChange={(value) => setFormState({ ...formState, siren: value })}
                    requiredIndicator
                    maxLength={9}
                  />
                  <TextField
                    label="SIRET"
                    value={formState.siret}
                    onChange={(value) => setFormState({ ...formState, siret: value })}
                    maxLength={14}
                  />
                </FormLayout.Group>
                <TextField
                  label="RCS (ex: RCS Paris)"
                  value={formState.rcs}
                  onChange={(value) => setFormState({ ...formState, rcs: value })}
                  placeholder="RCS Paris"
                />
                <TextField
                  label="N° TVA Intracommunautaire"
                  value={formState.tvaIntracom}
                  onChange={(value) => setFormState({ ...formState, tvaIntracom: value })}
                  placeholder="FRXX999999999"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Régime de TVA
              </Text>
              <Checkbox
                label="Franchise en base (TVA non applicable, art. 293 B du CGI)"
                checked={formState.franchiseEnBase}
                onChange={(value) => setFormState({ ...formState, franchiseEnBase: value })}
                helpText="Cochez si votre entreprise bénéficie de la franchise en base de TVA"
              />
              <Divider />
              <Checkbox
                label="Inscrit au régime OSS (One Stop Shop)"
                checked={formState.ossEnabled}
                onChange={(value) => setFormState({ ...formState, ossEnabled: value })}
                helpText="Pour les ventes intracommunautaires B2C > 10 000€/an"
              />
              {formState.ossEnabled && (
                <TextField
                  label="Numéro d'identification OSS"
                  value={formState.ossNumber}
                  onChange={(value) => setFormState({ ...formState, ossNumber: value })}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Numérotation des factures
              </Text>
              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    label="Préfixe"
                    value={formState.invoicePrefix}
                    onChange={(value) => setFormState({ ...formState, invoicePrefix: value })}
                  />
                  <TextField
                    label="Format"
                    value={formState.invoiceFormat}
                    onChange={(value) => setFormState({ ...formState, invoiceFormat: value })}
                    helpText="Utilisez {PREFIX}, {YYYY}, {NNNN}"
                  />
                </FormLayout.Group>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Conditions de paiement
              </Text>
              <FormLayout>
                <TextField
                  label="Modalités de paiement"
                  value={formState.paymentTerms}
                  onChange={(value) => setFormState({ ...formState, paymentTerms: value })}
                  placeholder="Paiement à réception"
                />
                <TextField
                  label="Taux de pénalités de retard"
                  value={formState.latePenaltyRate}
                  onChange={(value) => setFormState({ ...formState, latePenaltyRate: value })}
                  placeholder="3 fois le taux d'intérêt légal"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Options
              </Text>
              <Checkbox
                label="Générer automatiquement les factures à la capture du paiement"
                checked={formState.autoGenerateOnPaid}
                onChange={(value) => setFormState({ ...formState, autoGenerateOnPaid: value })}
              />
              <Select
                label="Thème PDF"
                options={[
                  { label: "Compact", value: "Compact" },
                  { label: "Standard", value: "Standard" },
                  { label: "Détaillé", value: "Detail" },
                ]}
                value={formState.pdfTheme}
                onChange={(value) => setFormState({ ...formState, pdfTheme: value })}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Conformité légale
              </Text>
              <Banner status="warning">
                <p>
                  Les informations fournies par cette application visent à automatiser la génération
                  de factures, mais ne dispensent pas le commerçant d'une vérification finale pour
                  conformité fiscale. Nous recommandons vivement la validation par un expert-comptable.
                </p>
              </Banner>
              <Checkbox
                label="Je confirme avoir vérifié toutes les informations légales (SIREN, RCS, TVA)"
                checked={formState.legalChecklistConfirmed}
                onChange={(value) => setFormState({ ...formState, legalChecklistConfirmed: value })}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="end">
            <Button variant="primary" onClick={handleSubmit}>
              Sauvegarder les paramètres
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
