// Tokens e componentes básicos, iguais ao protótipo e à web.
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

export const C = {
  brand: '#0F6E5C',
  brandDark: '#0A4F42',
  brandSoft: '#E6F2EE',
  accent: '#E8833A',
  accentSoft: '#FFF3E8',
  accentInk: '#8A4A12',
  ink: '#1B1F1D',
  ink2: '#3A413D',
  muted: '#5B635F',
  line: '#E4E7E3',
  line2: '#D5DAD5',
  ground: '#F6F7F5',
  field: '#F0F2EF',
  white: '#FFFFFF',
  danger: '#B42318',
};

const TINTS = ['#F6DCC4', '#D7E7F2', '#E9E3F4', '#DDEFD9', '#F4E4D8', '#E2E6EA'];
export function tintFor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: {
  title: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean; loading?: boolean; style?: ViewStyle;
}) {
  const v = variant === 'primary' ? s.btnPrimary : variant === 'outline' ? s.btnOutline : s.btnGhost;
  const t = variant === 'primary' ? s.btnPrimaryText : variant === 'outline' ? s.btnOutlineText : s.btnGhostText;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.btn, v, (pressed || disabled) && { opacity: 0.7 }, style]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? C.white : C.brand} /> : <Text style={[s.btnText, t]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={C.muted} accessibilityLabel={label} {...props} style={[s.input, props.style]} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}
      style={[s.chip, active ? { backgroundColor: C.brand } : { backgroundColor: C.white, borderWidth: 1, borderColor: C.line2 }]}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? C.white : C.ink }}>{label}</Text>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ground },
  h1: { fontSize: 26, fontWeight: '800', color: C.ink },
  h2: { fontSize: 16, fontWeight: '800', color: C.ink },
  body: { fontSize: 14, color: C.ink2, lineHeight: 21 },
  muted: { fontSize: 13, color: C.muted },
  label: { fontSize: 13, fontWeight: '700', color: C.ink },
  hint: { fontSize: 12, color: C.muted },
  error: { fontSize: 13, fontWeight: '600', color: C.danger },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: C.line2, paddingHorizontal: 14, fontSize: 15, backgroundColor: C.white, color: C.ink },
  card: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  btn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnText: { fontSize: 15, fontWeight: '800' },
  btnPrimary: { backgroundColor: C.brand },
  btnPrimaryText: { color: C.white },
  btnOutline: { borderWidth: 1.5, borderColor: C.brand },
  btnOutlineText: { color: C.brand },
  btnGhost: { borderWidth: 1.5, borderColor: C.line2 },
  btnGhostText: { color: C.ink },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tag: { fontSize: 11, fontWeight: '600', backgroundColor: C.brandSoft, color: C.brandDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
});
