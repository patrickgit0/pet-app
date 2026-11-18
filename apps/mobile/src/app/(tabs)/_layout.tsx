import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type AccessibilityState, type ColorValue, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from '@/lib/ui';

type IconProps = { color: ColorValue | null };
const Search = ({ color }: IconProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={String(color)} strokeWidth={2} strokeLinecap="round"><Circle cx={11} cy={11} r={7} /><Path d="M20 20l-3.5-3.5" /></Svg>
);
const Heart = ({ color }: IconProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={String(color)} strokeWidth={2}><Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
);
const Chat = ({ color }: IconProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={String(color)} strokeWidth={2} strokeLinejoin="round"><Path d="M4 5h16v11H9l-5 4z" /></Svg>
);
const User = ({ color }: IconProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={String(color)} strokeWidth={2}><Circle cx={12} cy={8} r={4} /><Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg>
);

// Botão de aba próprio: no web o padrão envolve um <Link> que não aceita lista de estilos (expo-router SDK 58).
function TabButton({ style, onPress, onLongPress, children, accessibilityState, accessibilityLabel, testID }: {
  style?: StyleProp<ViewStyle>; onPress?: (e: GestureResponderEvent) => void; onLongPress?: ((e: GestureResponderEvent) => void) | null;
  children?: ReactNode; accessibilityState?: AccessibilityState; accessibilityLabel?: string; testID?: string;
}) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={accessibilityState} accessibilityLabel={accessibilityLabel} testID={testID}
      onPress={onPress} onLongPress={onLongPress ?? undefined} style={StyleSheet.flatten(style)}>
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => <TabButton {...(props as Parameters<typeof TabButton>[0])} />,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerTitleStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: C.ground },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Buscar', headerShown: false, tabBarIcon: Search }} />
      <Tabs.Screen name="favoritos" options={{ title: 'Favoritos', tabBarIcon: Heart }} />
      <Tabs.Screen name="mensagens" options={{ title: 'Mensagens', tabBarIcon: Chat }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: User }} />
    </Tabs>
  );
}
