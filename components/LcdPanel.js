// components/LcdPanel.js
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const DRY_MAX = 35;      // tweak as you like
const COMFORT_MAX = 65;  // >65 -> wet

export default function LcdPanel({
  temperature = null,  // number (°C)
  humidity = null,     // number (%)
  updated = "",        // string (ISO or pretty)
}) {
  // pointer position along the 0..100 bar
  const pointerLeft = useMemo(() => {
    const h = Math.min(100, Math.max(0, Number(humidity ?? 0)));
    return `${h}%`;
  }, [humidity]);

  // zone label colour
  const zone = useMemo(() => {
    const h = Number(humidity ?? -1);
    if (h < 0) return { label: "—", color: "#666" };
    if (h <= DRY_MAX) return { label: "DRY", color: "#D06666" };
    if (h <= COMFORT_MAX) return { label: "COMFORT", color: "#5AA56B" };
    return { label: "WET", color: "#4B82D8" };
  }, [humidity]);

  return (
    <View style={styles.card}>
      {/* top: temperature */}
      <View style={styles.row}>
        <MaterialCommunityIcons name="thermometer" size={22} color="#666" />
        <View style={{ width: 8 }} />
        <Text style={styles.tempBig}>
          {typeof temperature === "number" ? temperature.toFixed(1) : "—"}
        </Text>
        <Text style={styles.tempUnit}>°C</Text>
      </View>

      {/* comfort bar */}
      <View style={styles.barWrap}>
        <View style={styles.bar}>
          <View style={[styles.barSeg, { backgroundColor: "#C85A5A", flex: DRY_MAX }]} />
          <View style={[styles.barSeg, { backgroundColor: "#66B97A", flex: COMFORT_MAX - DRY_MAX }]} />
          <View style={[styles.barSeg, { backgroundColor: "#5B8DEF", flex: 100 - COMFORT_MAX }]} />
        </View>
        <View style={[styles.pointer, { left: pointerLeft }]} />
        <View style={styles.barLabels}>
          <Text style={[styles.zoneText, { color: "#C85A5A" }]}>DRY</Text>
          <Text style={[styles.zoneText, { color: "#2E7D32" }]}>COMFORT</Text>
          <Text style={[styles.zoneText, { color: "#2F66C8" }]}>WET</Text>
        </View>
      </View>

      {/* bottom: humidity */}
      <View style={[styles.row, { marginTop: 10 }]}>
        <MaterialCommunityIcons name="water-percent" size={22} color="#666" />
        <View style={{ width: 8 }} />
        <Text style={styles.humBig}>
          {typeof humidity === "number" ? Math.round(humidity).toString() : "—"}
        </Text>
        <Text style={styles.humUnit}>%</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.zoneBadge, { color: zone.color }]}>{zone.label}</Text>
        <Text style={styles.updated}>{updated || "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F6FB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E1E5EE",
  },
  row: { flexDirection: "row", alignItems: "flex-end" },
  tempBig: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: "700",
    color: "#3A3D45",
    letterSpacing: 1,
  },
  tempUnit: { fontSize: 20, color: "#3A3D45", marginLeft: 6, marginBottom: 6 },
  humBig: {
    fontSize: 72,
    lineHeight: 72,
    fontWeight: "700",
    color: "#3A3D45",
    letterSpacing: 2,
  },
  humUnit: { fontSize: 26, color: "#3A3D45", marginLeft: 6, marginBottom: 10 },
  barWrap: { marginTop: 10 },
  bar: {
    height: 14,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
  },
  barSeg: { height: "100%" },
  pointer: {
    position: "absolute",
    top: -6,
    marginLeft: -6,      // centers the pointer
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: "#3A3D45",
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  zoneText: { fontSize: 12, fontWeight: "700" },
  footerRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneBadge: { fontSize: 13, fontWeight: "700" },
  updated: { fontSize: 12, color: "#6B7280" },
});
