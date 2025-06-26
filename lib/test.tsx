import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
  VictoryLabel,
} from "victory-native";
import { Box } from "@/components/ui/box";

const VictoryChartExample = () => {
  // 데이터 구성
  const recoveryData = [
    { x: 1, y: 125, label: "월" },
    { x: 2, y: 185, label: "화" },
    { x: 3, y: 80, label: "수" },
    { x: 4, y: 200, label: "목" },
    { x: 5, y: 150, label: "금" },
    { x: 6, y: 250, label: "토" },
    { x: 7, y: 100, label: "일" },
  ];

  const dischargeData = [
    { x: 1, y: 5 },
    { x: 2, y: 10 },
    { x: 3, y: 2 },
    { x: 4, y: 8 },
    { x: 5, y: 5 },
    { x: 6, y: 10 },
    { x: 7, y: 3 },
  ];

  const days = ["", "월", "화", "수", "목", "금", "토", "일"];

  return (
    <Box className="bg-white rounded-xl py-5 shadow-drop">
      <VictoryChart
        theme={VictoryTheme.material}
        padding={{ left: 70, right: 70, top: 40, bottom: 40 }}
        height={300}
        domainPadding={20}
      >
        {/* Y축 */}
        <VictoryAxis
          dependentAxis
          tickFormat={(value) => `${value}`}
          fixLabelOverlap={false}
          style={{
            tickLabels: { fontSize: 12, fill: "#666" },
            grid: {
              stroke: "#e0e0e0",
              strokeWidth: 1,
              strokeDasharray: "3,3",
            },
          }}
        />

        {/* X축 */}
        <VictoryAxis
          tickFormat={(x) => days[x]}
          style={{
            tickLabels: { fontSize: 12, fill: "#666" },
          }}
        />

        {/* 회복 포인트 라인 */}
        <VictoryLine
          data={recoveryData}
          labelComponent={<VictoryLabel style={{ fill: "transparent" }} />}
          labels={() => null}
          style={{
            data: { stroke: "#FF6B6B", strokeWidth: 2 },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />

        {/* 회복 포인트 점 */}
        <VictoryScatter
          data={recoveryData}
          labelComponent={<VictoryLabel style={{ fill: "transparent" }} />}
          labels={() => null}
          size={4}
          style={{
            data: { fill: "#FF6B6B", stroke: "#fff", strokeWidth: 2 },
          }}
        />

        {/* 배출 건수 라인 */}
        <VictoryLine
          data={dischargeData}
          style={{
            data: { stroke: "#4ECDC4", strokeWidth: 2 },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />

        {/* 배출 건수 점 */}
        <VictoryScatter
          data={dischargeData}
          size={4}
          style={{
            data: { fill: "#4ECDC4", stroke: "#fff", strokeWidth: 2 },
          }}
        />
      </VictoryChart>
      {/* 커스텀 범례 */}
      <Box className="flex-row justify-center mt-5 gap-8">
        <Box className="flex-row items-center gap-2">
          <Box style={{ ...styles.legendLine, backgroundColor: "#4ECDC4" }} />

          <Text>배출 건수</Text>
        </Box>
        <Box className="flex-row items-center gap-2">
          <Box style={{ ...styles.legendLine, backgroundColor: "#FF6B6B" }} />
          <Text>회복 포인트</Text>
        </Box>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 30,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});

export default VictoryChartExample;
