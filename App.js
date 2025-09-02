// App.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import dayjs from "dayjs";

import { db } from "./firebase";
import {
  collection, doc, onSnapshot, orderBy, query, limit
} from "firebase/firestore";

const Stack = createNativeStackNavigator();

function DevicesScreen({ navigation }) {
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "devices"), orderBy("updated_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDevices(rows);
      setLoading(false);
    }, (err) => {
      console.error("Devices onSnapshot error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <Center><ActivityIndicator /></Center>;
  if (!devices || devices.length === 0) return <Center><Text>No devices yet</Text></Center>;

  return (
    <FlatList
      contentContainerStyle={{ padding: 12 }}
      data={devices}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => {
        const temp = numToFixed(item.temperature_c, 1, "—");
        const rh = item.humidity_pct ?? "—";
        const batt = item.battery_pct ?? "—";
        const when = item.ts_iso || "—";
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Detail", { deviceId: item.id })}
          >
            <Text style={styles.title}>{item.id}</Text>
            <Text style={styles.sub}>
              T: {temp} °C   RH: {rh} %   Batt: {batt} %
            </Text>
            <Text style={styles.time}>{when}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function DetailScreen({ route }) {
  const { deviceId } = route.params;
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const unsubLive = onSnapshot(doc(db, "devices", deviceId), (snap) => {
      setLive(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, (err) => console.error("Live onSnapshot error:", err));

    const qHist = query(
      collection(db, "devices", deviceId, "history"),
      orderBy("updated_at", "desc"),
      limit(50)
    );
    const unsubHist = onSnapshot(qHist, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("History onSnapshot error:", err));

    return () => {
      unsubLive();
      unsubHist();
    };
  }, [deviceId]);

  return (
    <FlatList
      ListHeaderComponent={
        <View style={[styles.card, { margin: 12 }]}>
          <Text style={styles.title}>{deviceId}</Text>
          {live ? (
            <>
              <Row label="Temperature" value={`${numToFixed(live.temperature_c, 1, "—")} °C`} />
              <Row label="Humidity" value={`${safe(live.humidity_pct, "—")} %`} />
              <Row label="Battery" value={`${safe(live.battery_pct, "—")} %`} />
              <Row label="Firmware" value={safe(live.firmware, "—")} />
              <Row label="RSSI / SNR" value={`${safe(live.rssi, "—")} / ${safe(live.snr, "—")}`} />
              <Row label="Updated" value={formatWhen(live.ts_iso, live.updated_at)} />
            </>
          ) : (
            <Text style={styles.sub}>Waiting for live data…</Text>
          )}
          <Text style={[styles.title, { marginTop: 16 }]}>Recent History</Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 24 }}
      data={history || []}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <View style={[styles.card, { marginHorizontal: 12 }]}>
          <Text style={styles.sub}>
            {formatWhen(item.ts_iso, item.updated_at)}
          </Text>
          <Text style={styles.sub}>
            T: {numToFixed(item.temperature_c, 1, "—")} °C   RH: {safe(item.humidity_pct, "—")} %   Batt: {safe(item.battery_pct, "—")} %
          </Text>
        </View>
      )}
      ListEmptyComponent={<Center><Text>No history yet</Text></Center>}
    />
  );
}

// Helpers
function Center({ children }) {
  return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>{children}</View>;
}
function Row({ label, value }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{value}</Text>
    </View>
  );
}
function numToFixed(n, d, fallback) {
  return typeof n === "number" ? n.toFixed(d) : fallback;
}
function safe(v, fb) {
  return (v === 0 || !!v) ? String(v) : fb;
}
function formatWhen(ts_iso, updated_at) {
  if (ts_iso) return ts_iso;
  try {
    if (updated_at && updated_at.toDate) {
      return dayjs(updated_at.toDate()).format("YYYY-MM-DD HH:mm:ss");
    }
  } catch (_) {}
  return "—";
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 1.5 },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 14, color: "#333", marginTop: 4 },
  label: { fontSize: 12, color: "#666" },
  time: { fontSize: 12, color: "#666", marginTop: 2 },
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Devices" component={DevicesScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: "Device" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

