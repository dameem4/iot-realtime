// components/DualMetricCard.js
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const W = Dimensions.get("window").width;
const CARD_PAD = 14;

export default function DualMetricCard({
  titleLeft = "",    // big number left (e.g., "23.92 °C")
  titleRight = "",   // big number right (e.g., "52.28 %")
  labelLeft = "Temperature",   // legend text for line 1
  labelRight = "Humidity",   // legend text for line 2
  xLabels = [],      // optional labels (we’ll hide them)
  series1 = [],      // temperature series (numbers)
  series2 = [],      // humidity series (numbers)
  height = 190,
}) {
  return (
    <View style={styles.card}>
      {/* header numbers */}
      <View style={styles.headerRow}>
        <Text style={styles.big}>{titleLeft}</Text>
        <Text style={styles.big}>{titleRight}</Text>
      </View>

      {/* tiny legend */}
      <View style={styles.legendRow}>
        <Dot color="#FF7A45" />
        <Text style={styles.legend}>{labelLeft}</Text>
        <View style={{ width: 16 }} />
        <Dot color="#3BA0FF" />
        <Text style={styles.legend}>{labelRight}</Text>
      </View>

      {/* chart */}
      <LineChart
        data={{
          labels: xLabels.length ? xLabels : ["", "", "", "", "", ""],
          datasets: [
            {
              data: series1.length ? series1 : [0, 0, 0, 0, 0, 0],
              strokeWidth: 2,
              color: (o = 1) => `rgba(255, 122, 69, ${o})`, // orange
            },
            {
              data: series2.length ? series2 : [0, 0, 0, 0, 0, 0],
              strokeWidth: 2,
              color: (o = 1) => `rgba(59, 160, 255, ${o})`, // blue
            },
          ],
          legend: [], // we render our own legend above
        }}
        width={W - (CARD_PAD * 2) - 12}  // card padding + small inner margin
        height={height}
        withDots={false}
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        bezier
        chartConfig={{
          backgroundGradientFrom: "transparent",
          backgroundGradientTo: "transparent",
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          decimalPlaces: 2,
          color: () => "#fff",      // axis/label color (we hide labels anyway)
          labelColor: () => "#fff",
          propsForBackgroundLines: { stroke: "transparent" },
        }}
        style={{ marginTop: 6, marginRight: 6, backgroundColor: "transparent" }}
      />
    </View>
  );
}

function Dot({ color }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F222A",
    borderRadius: 16,
    padding: CARD_PAD,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  big: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legend: {
    color: "#C8CDD5",
    fontSize: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
