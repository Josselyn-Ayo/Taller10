import { Room } from "@features/chat/domain/entities/Message";
import { useRooms } from "@features/chat/presentation/hooks/useRooms";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RoomsScreen() {
  const { rooms, isLoading, createRoom, isCreating, createError } = useRooms();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [search, setSearch] = useState("");

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [rooms, search],
  );

  const handleCreate = () => {
    if (!roomName.trim() || isCreating) return;
    createRoom(roomName.trim(), {
      onSuccess: () => {
        setRoomName("");
        setModalVisible(false);
      },
    });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.roomAvatar}>
        <Text style={styles.roomAvatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.roomContent}>
        <View style={styles.roomTopRow}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.roomDate}>{item.createdAt.toLocaleDateString()}</Text>
        </View>
        <View style={styles.roomBottomRow}>
          <Text style={styles.roomPreview} numberOfLines={1}>
            Toca para abrir la sala y continuar la conversación.
          </Text>
          <View style={styles.roomPill}>
            <Text style={styles.roomPillText}>Open</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2a14b4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <FlatList
        data={filteredRooms}
        keyExtractor={(r) => r.id}
        renderItem={renderRoom}
        contentContainerStyle={
          filteredRooms.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                <Text style={styles.iconButtonText}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Messages</Text>
              <View style={styles.profileBubble}>
                <Text style={styles.profileBubbleText}>A</Text>
              </View>
            </View>

            <View style={styles.searchShell}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search chats and rooms..."
                placeholderTextColor="#777586"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Chats</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.empty}>Create your first room to start messaging.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItemActive} activeOpacity={0.85}>
            <Text style={styles.navIconActive}>◉</Text>
            <Text style={styles.navLabelActive}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.85}
            onPress={() => router.replace('/(app)/contacts')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.navIcon}>◌</Text>
            <Text style={styles.navLabel}>Contacts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.dialog}>
            <Text style={styles.dialogKicker}>Create room</Text>
            <Text style={styles.dialogTitle}>Nueva sala</Text>
            {createError && <Text style={styles.dialogError}>{createError}</Text>}
            <TextInput
              style={styles.dialogInput}
              placeholder="Nombre de la sala"
              value={roomName}
              onChangeText={setRoomName}
              autoFocus
              maxLength={50}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, isCreating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#faf8ff",
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -120,
    right: -150,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(42, 20, 180, 0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    left: -120,
    bottom: 120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(223, 226, 234, 0.55)",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
  },
  headerWrap: {
    marginBottom: 8,
  },
  topBar: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  iconButtonText: {
    color: "#2a14b4",
    fontSize: 16,
    fontWeight: "800",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#2a14b4",
  },
  profileBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4338ca",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBubbleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  searchShell: {
    height: 58,
    backgroundColor: "rgba(242,243,255,0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(199,196,215,0.8)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#131b2e",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  searchIcon: {
    color: "#777586",
    fontSize: 18,
    marginRight: 10,
    fontWeight: "800",
  },
  searchInput: {
    flex: 1,
    color: "#131b2e",
    fontSize: 15,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#61656b",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 90,
  },
  emptyIcon: {
    color: "#2a14b4",
    fontSize: 28,
    marginBottom: 10,
    fontWeight: "800",
  },
  emptyTitle: {
    color: "#131b2e",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  empty: {
    color: "#61656b",
    fontSize: 15,
    textAlign: "center",
    maxWidth: 260,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  roomItem: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.92)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#131b2e",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  roomAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#4338ca",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  roomAvatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  roomContent: {
    flex: 1,
  },
  roomTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
    gap: 10,
  },
  roomBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  roomName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#131b2e",
  },
  roomDate: {
    fontSize: 12,
    color: "#61656b",
    fontWeight: "700",
  },
  roomPreview: {
    flex: 1,
    color: "#464554",
    fontSize: 14,
  },
  roomPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(67, 56, 202, 0.1)",
  },
  roomPillText: {
    color: "#2a14b4",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 96,
    backgroundColor: "#2a14b4",
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#2a14b4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
  },
  fabText: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(250,248,255,0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(226,232,240,0.8)",
  },
  bottomNavInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  navItemActive: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4338ca",
    borderRadius: 16,
    paddingHorizontal: 34,
    paddingVertical: 10,
  },
  navItem: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 34,
    paddingVertical: 10,
  },
  navIconActive: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  navLabelActive: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "800",
  },
  navIcon: {
    color: "#61656b",
    fontSize: 16,
    fontWeight: "800",
  },
  navLabel: {
    color: "#61656b",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(19, 27, 46, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  dialogKicker: {
    color: "#2a14b4",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  dialogTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#131b2e",
    marginBottom: 12,
  },
  dialogError: {
    color: "#ba1a1a",
    backgroundColor: "#ffdad6",
    borderRadius: 14,
    fontSize: 13,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: "#d8e2fd",
    backgroundColor: "#faf8ff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    color: "#131b2e",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#eef0ff",
  },
  cancelText: { color: "#2a14b4", fontSize: 15, fontWeight: "700" },
  createBtn: {
    backgroundColor: "#2a14b4",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

