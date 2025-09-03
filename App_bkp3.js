// App.js
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { db } from "./firebase";
import { collection, doc, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import dayjs from "dayjs";
import LcdPanel from "./components/LcdPanel";

const DEVICE_ID = "my-temp-pro-monitor"; // change to your actual doc id

export default function App() {
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "devices", DEVICE_ID),
      (snap) => setLive(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (e) => setErr(String(e))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const qHist = query(
      collection(db, "devices", DEVICE_ID, "history"),
      orderBy("updated_at", "desc"),
      limit(50)
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

  const prettyTime = live?.ts_iso
    ? dayjs(live.ts_iso).format("YYYY-MM-DD HH:mm:ss")
    : live?.updated_at?.toDate
    ? dayjs(live.updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss")
    : "";

  return (
    <FlatList
      ListHeaderComponent={
        <View style={{ padding: 12 }}>
          <LcdPanel
            temperature={typeof live?.temperature_c === "number" ? live.temperature_c : null}
            humidity={typeof live?.humidity_pct === "number" ? live.humidity_pct : null}
            updated={prettyTime}
          />
          <Text style={[styles.title, { marginTop: 14 }]}>Recent Points</Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 24 }}
      data={history || []}
      keyExtractor={(it) => it.id}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <View style={styles.rowCard}>
          <Text style={styles.rowText}>
            {fmt(item.temperature_c, 1, "—")} °C   •   {fmt(item.humidity_pct, 0, "—")} %
          </Text>
          <Text style={styles.rowSub}>
            {item.ts_iso
              ? dayjs(item.ts_iso).format("YYYY-MM-DD HH:mm:ss")
              : item.updated_at?.toDate
              ? dayjs(item.updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss")
              : "—"}
          </Text>
        </View>
      )}
      ListEmptyComponent={<Center><Text>No history yet</Text></Center>}
    />
  );
}

function fmt(n, dp, fb) { return typeof n === "number" ? n.toFixed(dp) : fb; }
function Center({ children }) { return <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>{children}</View>; }

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "700", marginHorizontal: 12 },
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    elevation: 1.5,
  },
  rowText: { fontSize: 14, color: "#111" },
  rowSub: { fontSize: 12, color: "#666", marginTop: 4 },
});
