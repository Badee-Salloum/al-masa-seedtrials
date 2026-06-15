import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { registerPdfFonts } from "./registerFonts";

const hasFont = registerPdfFonts();
const FONT = hasFont ? "Cairo" : "Helvetica";

export interface ReportFollowup {
  date: string;
  nursery: string;
  germination: string;
  growth: string;
  production: string;
  notes?: string | null;
}

export interface ReportData {
  code: string;
  seedName: string;
  stateLabel: string;
  season?: string | null;
  category?: string | null;
  germination: string;
  purity: string;
  npk: string;
  shelfLife?: number | null;
  country?: string | null;
  supplier?: string | null;
  batch?: string | null;
  avgGermination: string;
  avgGrowth: string;
  avgProduction: string;
  decidedBy?: string | null;
  decisionDate?: string | null;
  rejectionReason?: string | null;
  followups: ReportFollowup[];
}

const s = StyleSheet.create({
  page: { fontFamily: FONT, fontSize: 10, padding: 28, color: "#1e293b" },
  band: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#8cc63f",
    paddingBottom: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, color: "#0f172a" },
  sub: { fontSize: 10, color: "#64748b" },
  section: { marginTop: 12 },
  h2: { fontSize: 12, color: "#2e9ec4", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  label: { color: "#64748b" },
  cols: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  tlItem: {
    borderLeftWidth: 2,
    borderLeftColor: "#8cc63f",
    paddingLeft: 8,
    marginBottom: 8,
  },
  tlHead: { fontSize: 10, color: "#0f172a" },
  tlBody: { fontSize: 9, color: "#64748b" },
});

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

export function TrialReport({ data }: { data: ReportData }) {
  const logo = path.join(process.cwd(), "public", "almasa_logo.png");
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <View>
            <Text style={s.title}>{data.code}</Text>
            <Text style={s.sub}>{data.seedName}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logo} style={{ width: 48, height: 48 }} />
        </View>

        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.h2}>Agronomy</Text>
            <KV label="Status" value={data.stateLabel} />
            <KV label="Season" value={data.season ?? "—"} />
            <KV label="Category" value={data.category ?? "—"} />
            <KV label="Country" value={data.country ?? "—"} />
            <KV label="Supplier" value={data.supplier ?? "—"} />
            <KV label="Batch" value={data.batch ?? "—"} />
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Quality</Text>
            <KV label="Germination %" value={data.germination} />
            <KV label="Purity %" value={data.purity} />
            <KV label="NPK" value={data.npk} />
            <KV label="Shelf Life" value={String(data.shelfLife ?? "—")} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Aggregate Results</Text>
          <KV label="Avg Germination %" value={data.avgGermination} />
          <KV label="Avg Growth (cm)" value={data.avgGrowth} />
          <KV label="Avg Production" value={data.avgProduction} />
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Follow-up Timeline</Text>
          {data.followups.length === 0 ? (
            <Text style={s.tlBody}>No follow-ups recorded yet.</Text>
          ) : (
            data.followups.map((f, i) => (
              <View key={i} style={s.tlItem}>
                <Text style={s.tlHead}>
                  {f.date} · {f.nursery}
                </Text>
                <Text style={s.tlBody}>
                  Germination {f.germination}% · Growth {f.growth} · Production {f.production}
                </Text>
                {f.notes ? <Text style={s.tlBody}>{f.notes}</Text> : null}
              </View>
            ))
          )}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Decision</Text>
          <KV label="Status" value={data.stateLabel} />
          <KV label="Decided By" value={data.decidedBy ?? "—"} />
          <KV label="Decision Date" value={data.decisionDate ?? "—"} />
          {data.rejectionReason ? (
            <KV label="Rejection Reason" value={data.rejectionReason} />
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
