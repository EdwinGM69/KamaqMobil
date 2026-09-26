import { ReactNode } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../ui/Header";

interface ScreenContainerProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerRight?: ReactNode;
  scrollable?: boolean;
  style?: object;
  contentStyle?: object;
}

export function ScreenContainer({
  children,
  headerTitle,
  headerSubtitle,
  headerRight,
  scrollable = true,
  style,
  contentStyle,
}: ScreenContainerProps) {
  const content = (
    <View style={[styles.container, style]}>
      {(headerTitle || headerRight) && (
        <Header title={headerTitle} subtitle={headerSubtitle} right={headerRight} />
      )}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
      )}
    </View>
  );

  return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  flex: {
    flex: 1,
  },
});
