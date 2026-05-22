import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { supabase } from "@shared/infrastructure/supabase/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ContactsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error', e);
    }
    setUser(null);
    setLoading(false);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar} />

      <View style={styles.container}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCard}>
            <Image
              source={{ uri: user?.avatarUrl ?? 'https://via.placeholder.com/300x300.png?text=User' }}
              style={styles.avatar}
            />
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.85}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.kicker}>Nombre</Text>
            <Text style={styles.title}>{user?.username ?? 'Sin nombre'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.kicker}>Correo</Text>
            <Text style={styles.subtitle}>{user?.email ?? 'Sin correo'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loading} activeOpacity={0.9}>
            <Text style={styles.logoutText}>{loading ? 'Saliendo...' : 'Cerrar Sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/(app)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Calls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.85}>
          <Text style={styles.navIcon}>📒</Text>
          <Text style={styles.navLabel}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8ff' },
  topBar: { height: 20 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  avatarWrap: { alignItems: 'center', marginTop: 12 },
  avatarCard: { width: 128, height: 128, borderRadius: 999, overflow: 'hidden', borderWidth: 4, borderColor: 'rgba(67,56,202,0.1)', backgroundColor: '#4338ca' },
  avatar: { width: '100%', height: '100%' },
  editBtn: { position: 'absolute', right: 28, bottom: 8, backgroundColor: '#2a14b4', padding: 8, borderRadius: 24 },
  editIcon: { color: '#fff', fontWeight: '700' },
  info: { marginTop: 24, alignItems: 'center' },
  infoRow: { marginBottom: 18, alignItems: 'center' },
  kicker: { color: '#2a14b4', fontWeight: '700', letterSpacing: 1, fontSize: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#131b2e', marginTop: 6 },
  subtitle: { fontSize: 18, color: '#464554', marginTop: 6 },
  footer: { marginTop: 'auto', paddingBottom: 40 },
  logoutBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(186,26,26,0.2)', alignItems: 'center', backgroundColor: 'transparent' },
  logoutText: { color: '#ba1a1a', fontWeight: '700' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: 'rgba(250,248,255,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 12 },
  navItem: { alignItems: 'center' },
  navItemActive: { backgroundColor: '#e8e7ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 12, color: '#5b5f65', marginTop: 4 },
});
