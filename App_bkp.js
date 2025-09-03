// App.js
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { db } from "./firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function App() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const q = query(collection(db, "devices"), orderBy("updated_at", "desc"));
      const unsub = onSnapshot(q, snap => {
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, e => setErr(String(e)));
      return () => unsub();
    } catch (e) {
      setErr(String(e));
    }
  }, []);

  if (err) return <Center><Text style={{color:"red"}}>{err}</Text></Center>;
  if (!rows) return <Center><ActivityIndicator /></Center>;
  if (rows.length === 0) return <Center><Text>No devices yet</Text></Center>;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={rows}
      keyExtractor={(it) => it.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.id}</Text>
          <Text>
            T: {item.temperature_c ?? "—"} °C   RH: {item.humidity_pct ?? "—"} %   Batt: {item.battery_pct ?? "—"} %
          </Text>
          <Text style={styles.sub}>{item.ts_iso ?? "—"}</Text>
        </View>
      )}
    />
  );
}

function Center({ children }) { return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>{children}</View>; }
const styles = StyleSheet.create({
  card: { backgroundColor:"#fff", padding:12, borderRadius:10, marginBottom:10, elevation:1.5 },
  title: { fontSize:16, fontWeight:"700" },
  sub: { fontSize:12, color:"#666", marginTop:4 },
});
