/**
 * OSS Reports Page - View and export OSS reports
 */

import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Select,
  Button,
  DataTable,
  Text,
  Banner,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  
  return json({ currentYear, currentQuarter });
};

export default function OssReportsPage() {
  const { currentYear, currentQuarter } = useLoaderData<typeof loader>();
  
  const [year, setYear] = useState(String(currentYear));
  const [quarter, setQuarter] = useState(String(currentQuarter));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return { label: String(y), value: String(y) };
  });

  const quarterOptions = [
    { label: "Q1 (Janvier-Mars)", value: "1" },
    { label: "Q2 (Avril-Juin)", value: "2" },
    { label: "Q3 (Juillet-Septembre)", value: "3" },
    { label: "Q4 (Octobre-Décembre)", value: "4" },
  ];

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/reports/oss?year=${year}&quarter=${quarter}&format=json`
      );
      const data = await response.json();

      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || "Erreur lors du chargement du rapport");
      }
    } catch (err) {
      setError("Erreur réseau lors du chargement du rapport");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    window.open(
      `/api/reports/oss?year=${year}&quarter=${quarter}&format=csv`,
      "_blank"
    );
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const detailRows = report?.entries.map((entry: any) => [
    entry.invoice_number,
    entry.date,
    entry.country,
    formatCurrency(entry.base_ht),
    `${entry.tax_rate.toFixed(2)}%`,
    formatCurrency(entry.tax_amount),
    formatCurrency(entry.total_ttc),
  ]) || [];

  const summaryRows = Object.entries(report?.summary || {}).map(
    ([country, data]: [string, any]) => [
      country,
      String(data.orderCount),
      formatCurrency(data.totalHt),
      formatCurrency(data.totalTva),
      formatCurrency(data.totalTtc),
    ]
  );

  const totalRow = report?.summary
    ? [
        <strong key="total-label">TOTAL</strong>,
        String(
          Object.values(report.summary).reduce(
            (sum: number, data: any) => sum + data.orderCount,
            0
          )
        ),
        <strong key="total-ht">
          {formatCurrency(
            Object.values(report.summary).reduce(
              (sum: number, data: any) => sum + data.totalHt,
              0
            )
          )}
        </strong>,
        <strong key="total-tva">
          {formatCurrency(
            Object.values(report.summary).reduce(
              (sum: number, data: any) => sum + data.totalTva,
              0
            )
          )}
        </strong>,
        <strong key="total-ttc">
          {formatCurrency(
            Object.values(report.summary).reduce(
              (sum: number, data: any) => sum + data.totalTtc,
              0
            )
          )}
        </strong>,
      ]
    : [];

  return (
    <Page title="Rapports OSS">
      <TitleBar title="Rapports OSS" />
      <Layout>
        <Layout.Section>
          <Banner>
            <Text as="p" variant="bodyMd">
              <strong>Régime OSS (One Stop Shop)</strong> : Pour les ventes
              intracommunautaires B2C dépassant le seuil de 10 000 € annuels,
              vous devez déclarer et payer la TVA dans le pays de consommation.
              Ce rapport trimestriel vous aide à préparer votre déclaration OSS.
            </Text>
          </Banner>
        </Layout.Section>

        {error && (
          <Layout.Section>
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Sélection de la période
              </Text>

              <InlineStack gap="400" align="start">
                <div style={{ width: "200px" }}>
                  <Select
                    label="Année"
                    options={yearOptions}
                    value={year}
                    onChange={setYear}
                  />
                </div>
                <div style={{ width: "250px" }}>
                  <Select
                    label="Trimestre"
                    options={quarterOptions}
                    value={quarter}
                    onChange={setQuarter}
                  />
                </div>
                <div style={{ paddingTop: "24px" }}>
                  <Button onClick={loadReport} loading={loading}>
                    Charger le rapport
                  </Button>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {report && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">
                      Détail des ventes OSS - Q{report.period.quarter}{" "}
                      {report.period.year}
                    </Text>
                    <Button onClick={downloadCsv}>Télécharger CSV</Button>
                  </InlineStack>

                  {report.entries.length > 0 ? (
                    <DataTable
                      columnContentTypes={[
                        "text",
                        "text",
                        "text",
                        "numeric",
                        "text",
                        "numeric",
                        "numeric",
                      ]}
                      headings={[
                        "N° Facture",
                        "Date",
                        "Pays",
                        "Base HT",
                        "Taux TVA",
                        "Montant TVA",
                        "Total TTC",
                      ]}
                      rows={detailRows}
                    />
                  ) : (
                    <Banner>
                      Aucune vente OSS pour cette période.
                    </Banner>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>

            {Object.keys(report.summary).length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">
                      Résumé par pays
                    </Text>

                    <DataTable
                      columnContentTypes={[
                        "text",
                        "numeric",
                        "numeric",
                        "numeric",
                        "numeric",
                      ]}
                      headings={[
                        "Pays",
                        "Nb commandes",
                        "Total HT",
                        "Total TVA",
                        "Total TTC",
                      ]}
                      rows={[...summaryRows, totalRow]}
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}
          </>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Informations importantes
              </Text>

              <Text as="p" variant="bodyMd">
                <strong>Déclaration OSS</strong> : Les déclarations doivent
                être effectuées trimestriellement avant la fin du mois suivant
                la fin du trimestre :
              </Text>

              <Text as="p" variant="bodyMd">
                • Q1 (Jan-Mar) : déclaration avant le 30 avril
              </Text>
              <Text as="p" variant="bodyMd">
                • Q2 (Avr-Juin) : déclaration avant le 31 juillet
              </Text>
              <Text as="p" variant="bodyMd">
                • Q3 (Juil-Sep) : déclaration avant le 31 octobre
              </Text>
              <Text as="p" variant="bodyMd">
                • Q4 (Oct-Déc) : déclaration avant le 31 janvier
              </Text>

              <Banner status="warning">
                Ce rapport est fourni à titre informatif. Veuillez consulter
                votre expert-comptable pour valider les montants avant de
                procéder à votre déclaration OSS officielle.
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
