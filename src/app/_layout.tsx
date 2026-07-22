import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable style={styles.iconButton}>
          <Text style={styles.iconSymbol}>⚙️</Text>
        </Pressable>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>OWNSCAPE</Text>
        </View>
        <Pressable style={styles.iconButton}>
          <Text style={styles.iconSymbol}>🔔</Text>
        </Pressable>
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fffdf0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconButton: {
    padding: 8,
  },
  iconSymbol: {
    fontSize: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6347',
    marginRight: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
