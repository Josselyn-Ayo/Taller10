import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandIcon}>✦</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.headerBlock}>
              <Text style={styles.kicker}>Connect</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Regístrate para empezar a chatear con tu equipo.
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputShell}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu_usuario"
                  placeholderTextColor="#8b93a7"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputShell}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="alex@example.com"
                  placeholderTextColor="#8b93a7"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordRow}>
                <Text style={styles.label}>Password</Text>
                <Pressable>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </Pressable>
              </View>
              <View style={styles.inputShell}>
                <Text style={styles.inputIcon}>⌂</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#8b93a7"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                <Pressable
                  onPress={() => setShowPassword((current) => !current)}
                  hitSlop={10}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>{showPassword ? "◉" : "◌"}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !isLoading ? styles.buttonPressed : null,
                isLoading ? styles.buttonDisabled : null,
              ]}
              onPress={() => register({ email, password, username })}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Register</Text>
                  <Text style={styles.buttonArrow}>➜</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" style={styles.link}>
                Login
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(77, 68, 227, 0.10)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    left: -120,
    bottom: -140,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(208, 225, 251, 0.35)",
  },
  brandRow: {
    alignItems: "center",
    marginBottom: 18,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#3525cd",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3525cd",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  brandIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f7",
    shadowColor: "#111c2d",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  headerBlock: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3525cd",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#111c2d",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5a6477",
  },
  error: {
    color: "#ba1a1a",
    backgroundColor: "#ffdad6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: "600",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111c2d",
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    color: "#3525cd",
    fontSize: 12,
    fontWeight: "700",
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d8e3fb",
    backgroundColor: "#f9f9ff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  inputIcon: {
    width: 22,
    textAlign: "center",
    marginRight: 10,
    color: "#777587",
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    height: 56,
    color: "#111c2d",
    fontSize: 15,
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  eyeText: {
    fontSize: 16,
    color: "#777587",
    fontWeight: "700",
  },
  button: {
    marginTop: 6,
    minHeight: 56,
    backgroundColor: "#3525cd",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3525cd",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  buttonArrow: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: "#5a6477",
    fontSize: 14,
  },
  link: {
    color: "#3525cd",
    fontSize: 14,
    fontWeight: "800",
  },
});
