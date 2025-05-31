import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import treeIcon from "@/assets/images/tree.png";

const HEADER_MAX_HEIGHT = 240; // 최대 헤더 높이
const HEADER_MIN_HEIGHT = 80; // 최소 헤더 높이
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function CollapsingHeaderExample() {
  const scrollY = useRef(new Animated.Value(0)).current;

  // 헤더 높이 애니메이션
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  // 헤더 내 아이콘 크기 애니메이션
  const iconScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.2],
    extrapolate: "clamp",
  });

  // 포인트 텍스트 위치 애니메이션
  const pointTextPositionX = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 80],
    extrapolate: "clamp",
  });

  // 부가 정보 투명도 애니메이션
  const additionalInfoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.7],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 스크롤 뷰 */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* 스크롤 콘텐츠 */}
        <View style={styles.scrollContent}>
          {/* 검색 바 */}
          <View style={styles.searchBar}>
            <Text style={styles.searchText}>
              검색하면 용기는 어떻게 버릴까요?
            </Text>
          </View>
          {/* 퀴즈 포인트 카드 */}
          <View style={styles.menuCard}>
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>퀴즈 풀고</Text>
              <Text style={styles.menuCardTitle}>포인트 얻기</Text>
              <View style={styles.menuCardIcon}>
                <Text style={styles.questionMark}>?</Text>
              </View>
            </View>
          </View>

          {/* 제로웨이스트 카드 */}
          <View style={styles.storeCard}>
            <Text style={styles.storeCardTitle}>가로수길에서</Text>
            <Text style={styles.storeCardTitle}>제로웨이스트를 외치다</Text>
            <View style={styles.storeCardOverlay} />
          </View>

          {/* 추가 콘텐츠 */}
          <View style={styles.dummyContent} />
        </View>
      </Animated.ScrollView>

      {/* 헤더 */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerContent}>
          {/* 나무 아이콘과 포인트 */}
          <Animated.View
            style={[
              styles.pointContainer,
              {
                transform: [
                  { scale: iconScale },
                  { translateX: pointTextPositionX },
                ],
              },
            ]}
          >
            <View style={styles.treeIconContainer}>
              <Image source={treeIcon} />
            </View>
           
          </Animated.View>
           {/* 추가 정보 (스크롤 시 사라짐) */}
            <Animated.View style={[styles.additionalInfo]}>
              <Text style={styles.pointText}>340 점</Text>
              <Animated.View style={{ opacity: additionalInfoOpacity }}>
                <Text style={styles.infoText}>이산화탄소 2.3kg</Text>
                <Text style={styles.infoText}>자동차 3km</Text>
                <Text style={styles.infoText}>나무 3그루</Text>
              </Animated.View>
            </Animated.View>
        </View>
      </Animated.View>

      {/* 하단 네비게이션 바 */}
      <View style={styles.navBar}>
        <View style={styles.navItem} />
        <View style={styles.navItem} />
        <View style={[styles.navItem, styles.navItemActive]} />
        <View style={styles.navItem} />
        <View style={styles.navItem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    overflow: "hidden",
    elevation: 1,
  },
  headerContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  pointContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  treeIconContainer: {
    marginRight: 8,
  },
  treeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#64D2AE",
  },
  pointText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  additionalInfo: {
    marginLeft: 48,
    marginTop: -8,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 10,
    marginTop: 16,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#777",
  },
  menuButtonContainer: {
    marginTop: 16,
  },
  menuButton: {
    backgroundColor: "#C7F0E3",
    borderRadius: 12,
    padding: 16,
    height: 100,
    justifyContent: "center",
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  menuButtonIcons: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  bottleIcon: {
    width: 24,
    height: 36,
    backgroundColor: "#2C9B69",
    borderRadius: 4,
  },
  menuCard: {
    backgroundColor: "#C7F0E3",
    borderRadius: 12,
    padding: 16,
    height: 120,
    marginBottom: 16,
  },
  menuCardContent: {
    flex: 1,
    justifyContent: "center",
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  menuCardIcon: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C9B69",
    justifyContent: "center",
    alignItems: "center",
  },
  questionMark: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  storeCard: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    height: 180,
    justifyContent: "flex-end",
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  storeCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  storeCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    zIndex: 1,
  },
  dummyContent: {
    height: 600,
    backgroundColor: "#f5f5f5",
  },
  navBar: {
    flexDirection: "row",
    height: 56,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  navItemActive: {
    backgroundColor: "#333",
  },
});
