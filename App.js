// App.js
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { db } from "./firebase";
import { collection, doc, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import dayjs from "dayjs";
import LcdPanel from "./components/LcdPanel";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Comfort thresholds (edit to taste) */
const DRY_MAX = 35;       // ≤ 35% => DRY
const COMFORT_MAX = 65;   // 36–65% => COMFORT ; > 65% => WET

/** Choose color palette for zones */
function zoneFromHumidity(h) {
  if (typeof h !== "number") return { key: "NA", label: "—", bg: "#E9EFF7", fg: "#223142", border: "#D5DFEB" };
  if (h <= DRY_MAX)       return { key: "DRY",     label: "DRY",     bg: "#FCE7E7", fg: "#8A2B2B", border: "#F2C7C7" };
  if (h <= COMFORT_MAX)   return { key: "COMFORT", label: "COMFORT", bg: "#E7F6EA", fg: "#1F5E2B", border: "#C9E8D1" };
  return                    { key: "WET",     label: "WET",     bg: "#E6F0FF", fg: "#1E4EA8", border: "#C8DBFF" };
}

const DEVICE_ID = "my-temp-pro-monitor"; // ← set to your Firestore doc id

export default function App() {
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState("");

  // Live doc
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "devices", DEVICE_ID),
      (snap) => setLive(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (e) => setErr(String(e))
    );
    return () => unsub();
  }, []);

  // Last two history docs
  useEffect(() => {
    const qHist = query(
      collection(db, "devices", DEVICE_ID, "history"),
      orderBy("updated_at", "desc"),
      limit(2)
    );
    const unsub = onSnapshot(
      qHist,
      (snap) => setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setErr(String(e))
    );
    return () => unsub();
  }, []);

  if (err) return <Center><Text style={{ color: "red" }}>{err}</Text></Center>;
  if (!live && !history) return <Center><ActivityIndicator /></Center>;

  // Pretty time for LCD
  const prettyTime =
    live?.ts_iso
      ? dayjs(live.ts_iso).format("YYYY-MM-DD HH:mm:ss")
      : live?.updated_at?.toDate
      ? dayjs(live.updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss")
      : "";

  // Avoid duplicating the latest (live) in the chip
  const sameStamp = (a, b) => {
    if (!a || !b) return false;
    if (a.ts_iso && b.ts_iso) return a.ts_iso === b.ts_iso;
    const ad = a.updated_at?.toDate?.(); const bd = b.updated_at?.toDate?.();
    return ad && bd ? ad.getTime() === bd.getTime() : false;
  };
  const prev1 = (history || []).find((h) => !sameStamp(h, live)) || null;

  // Chip text + colors
  const prevTemp = typeof prev1?.temperature_c === "number" ? prev1.temperature_c.toFixed(1) : "—";
  const prevHum  = typeof prev1?.humidity_pct   === "number" ? Math.round(prev1.humidity_pct).toString() : "—";
  const prevTime = prev1
    ? (prev1.ts_iso
        ? dayjs(prev1.ts_iso).format("YYYY-MM-DD HH:mm:ss")
        : (prev1.updated_at?.toDate ? dayjs(prev1.updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss") : "—"))
    : null;

  const zone = zoneFromHumidity(typeof prev1?.humidity_pct === "number" ? prev1.humidity_pct : undefined);

  return (
    <View style={{ padding: 12 }}>
      {/* Main LCD card */}
      <LcdPanel
        temperature={typeof live?.temperature_c === "number" ? live.temperature_c : null}
        humidity={typeof live?.humidity_pct === "number" ? live.humidity_pct : null}
        updated={prettyTime}
      />

      {/* Previous reading 1 chip (with comfort coloring + icons) */}
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Previous reading</Text>
      {prev1 ? (
        <View style={[styles.chip, { backgroundColor: zone.bg, borderColor: zone.border }]}>
          <View style={styles.chipRow}>
            <MaterialCommunityIcons name="thermometer" size={16} color={zone.fg} />
            <Text style={[styles.chipText, { color: zone.fg }]}>  {prevTemp} °C</Text>

            <View style={{ width: 12 }} />
            <MaterialCommunityIcons name="water-percent" size={16} color={zone.fg} />
            <Text style={[styles.chipText, { color: zone.fg }]}>  {prevHum} %</Text>

            <View style={{ width: 12 }} />
            <Text style={[styles.zoneBadge, { color: zone.fg }]}>{zone.label}</Text>
          </View>

          <Text style={[styles.chipTime, { color: zone.fg }]}>{prevTime}</Text>
        </View>
      ) : (
        <Text style={styles.noPrev}>No previous reading yet</Text>
      )}
    </View>
  );
}

/* helpers */
function Center({ children }) { return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>{children}</View>; }

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#3A3D45", marginLeft: 2 },
  chip: {
    alignSelf: "stretch",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  chipRow: { flexDirection: "row", alignItems: "center" },
  chipText: { fontSize: 14, fontWeight: "600" },
  zoneBadge: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  chipTime: { fontSize: 12, marginTop: 4 },
  noPrev: { fontSize: 13, color: "#667080", marginTop: 8, marginLeft: 2 },
});
