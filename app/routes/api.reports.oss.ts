/**
 * API Route: OSS Report
 * GET /api/reports/oss?year=2025&quarter=1
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { generateOssReport, exportOssReportToCsv } from "~/services/oss.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const quarterParam = url.searchParams.get('quarter');
    const format = url.searchParams.get('format') || 'json';

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const quarter = quarterParam ? parseInt(quarterParam) : Math.floor((new Date().getMonth() / 3)) + 1;

    if (quarter < 1 || quarter > 4) {
      return new Response(
        JSON.stringify({ success: false, error: "Quarter must be between 1 and 4" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const report = await generateOssReport(shop, year, quarter);

    if (format === 'csv') {
      const csv = exportOssReportToCsv(report);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="oss-report-${year}-Q${quarter}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating OSS report:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
