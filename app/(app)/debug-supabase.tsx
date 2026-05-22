import { supabase } from '@shared/infrastructure/supabase/client';
import React, { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DebugSupabase() {
  const [logs, setLogs] = useState<string[]>([]);
  const append = (line: string) => setLogs((s) => [...s, line]);

  const runChecks = async () => {
    setLogs([]);
    append('Starting Supabase diagnostics...');
    try {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      append(`ENV: EXPO_PUBLIC_SUPABASE_URL=${!!url}, EXPO_PUBLIC_SUPABASE_ANON_KEY=${!!key}`);

      if (!url) append('WARNING: EXPO_PUBLIC_SUPABASE_URL is not set');

      // Basic fetch to REST endpoint
      try {
        const ping = await fetch((url ?? '') + '/rest/v1/', { method: 'GET', headers: { apikey: key ?? '' } });
        append(`Ping REST /rest/v1 status: ${ping.status} ok=${ping.ok}`);
      } catch (e) {
        append('Ping REST failed: ' + String(e));
      }

      // Check session
      try {
        const sres: any = await supabase.auth.getSession?.();
        const session = sres?.data?.session ?? sres?.session ?? null;
        append('Session: ' + (session ? `user=${session.user?.id}` : 'no session'));
      } catch (e) {
        append('Session read failed: ' + String(e));
      }

      // Try listing bucket objects (Imagenes)
      try {
        const list = await supabase.storage.from('Imagenes').list('', { limit: 1 });
        append('Storage list response: ' + JSON.stringify(list?.error ? { error: list.error } : { data: (list as any).data ?? null }));
      } catch (e) {
        append('Storage list failed: ' + String(e));
      }

      append('Diagnostics finished.');
    } catch (e) {
      append('Unexpected error: ' + String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Diagnostics</Text>
        <Button title="Run Checks" onPress={runChecks} />
      </View>
      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 12 }}>
        {logs.map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8ff' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#131b2e' },
  logBox: { flex: 1, backgroundColor: '#fff', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  logLine: { fontSize: 13, color: '#333', marginBottom: 8 },
});
