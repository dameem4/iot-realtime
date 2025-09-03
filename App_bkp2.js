// App.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from "react-native";
import { db } from "./firebase";
import { collection, doc, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import dayjs from "dayjs";
import DualMetricCard from "./components/DualMetricCard";

const DEVICE_ID = "my-temp-pro-monitor"; // 👈 change if your doc id differs

export default function App() {
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState("");

  // live data subscription
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "devices", DEVICE_ID),
      (snap) => setLive(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (e) => setErr(String(e))
    );
    return () => unsub();
  }, []);

  // history subscription
  useEffect(() => {
    const qHist = query(
      collection(db, "devices", DEVICE_ID, "history"),
      orderBy("updated_at", "desc"),
      limit(300)
    );
    const unsub = onSnapshot(
      qHist,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistory(rows);
      },
      (e) => setErr(String(e))
    );
    return () => unsub();
  }, []);

  // build chart data
  const chart = useMemo(() => {
    if (!history || history.length === 0) return { labels: [], t: [], h: [] };
    const asc = [...history].reverse(); // oldest → newest
    const labels = [];
    const tVals = [];
    const hVals = [];
    const labelEvery = Math.max(1, Math.ceil(asc.length / 6));

    asc.forEach((r, idx) => {
      const t = r.ts_iso
        ? dayjs(r.ts_iso)
        : r.updated_at?.toDate
        ? dayjs(r.updated_at.toDate())
        : null;
      if (!t) return;
      labels.push(idx % labelEvery === 0 ? t.format("HH:mm") : "");
      tVals.push(
        typeof r.temperature_c === "number"
          ? Number(r.temperature_c.toFixed(2))
          : null
      );
      hVals.push(
        typeof r.humidity_pct === "number" ? Number(r.humidity_pct) : null
      );
    });

    const ffill = (arr) => {
      let last = 0;
      return arr.map((v) => (typeof v === "number" ? (last = v) : last));
    };

    return { labels, t: ffill(tVals), h: ffill(hVals) };
  }, [history]);

  if (err) return <Center><Text style={{ color: "red" }}>{err}</Text></Center>;
  if (!live && !history) return <Center><ActivityIndicator /></Center>;

  return (
    <FlatList
      ListHeaderComponent={
        <View>
          {/* fancy dual metric card */}
          <DualMetricCard
            titleLeft={
              typeof live?.temperature_c === "number"
                ? `${live.temperature_c.toFixed(2)} °C`
                : "—"
            }
            titleRight={
              typeof live?.humidity_pct === "number"
                ? `${Number(live.humidity_pct).toFixed(2)} %`
                : "—"
            }
            labelLeft="Temperatuur"
            labelRight="Õhuniiskus"
            xLabels={chart.labels}
            series1={chart.t}
            series2={chart.h}
          />

          <Text style={[styles.title, { marginHorizontal: 12, marginTop: 16 }]}>
            Recent Points
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 24 }}
      data={(history || []).slice(0, 50)}
      keyExtractor={(it) => it.id}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.sub}>
            {formatWhen(item.ts_iso, item.updated_at)}
          </Text>
          <Text style={styles.sub}>
            T: {fmt(item.temperature_c, 2, "—")} °C   RH:{" "}
            {fmt(item.humidity_pct, 2, "—")} %
          </Text>
        </Card>
      )}
      ListEmptyComponent={<Center><Text>No history yet</Text></Center>}
    />
  );
}

/* --- tiny helpers --- */
function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}
function Center({ children }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}
function fmt(n, d, fb) {
  return typeof n === "number" ? n.toFixed(d) : fb;
}
function formatWhen(ts_iso, updated_at) {
  try {
    if (ts_iso) return dayjs(ts_iso).format("YYYY-MM-DD HH:mm:ss");
    if (updated_at?.toDate)
      return dayjs(updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss");
  } catch (_) {}
  return "—";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    elevation: 1.5,
  },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 14, color: "#333" },
});