import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Message } from "@features/chat/domain/entities/Message";
import { useChat } from "@features/chat/presentation/hooks/useChat";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, isSending, retrySend } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !imageUri) return;
    console.log('[ChatScreen] sending', input.trim());
    sendMessage({ content: input.trim(), imageUri });
    setInput("");
    setImageUri(null);
    console.log('[ChatScreen] input cleared');
  }, [imageUri, input, sendMessage]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos permiso para acceder a tus imágenes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setIsUploadingImage(true);
      setImageUri(result.assets[0].uri);
      setIsUploadingImage(false);
    }
  }, []);

  const renderMsg = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        <View style={[styles.bubbleBase, isOwn ? styles.own : styles.other]}>
          {!isOwn && (
            <Text style={styles.author}>{item.authorUsername ?? item.userId.slice(0, 6)}</Text>
          )}
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
          ) : null}
          {item.content.trim() ? (
            <Text style={[styles.text, isOwn && styles.textOwn]}>{item.content}</Text>
          ) : item.imageUrl ? (
            <Text style={[styles.text, isOwn && styles.textOwn]}>Imagen</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={styles.time}>
              {item.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {item.failed ? (
              <TouchableOpacity onPress={() => retrySend(item.id)} style={{ marginLeft: 8 }}>
                <Text style={{ color: '#ff3b30', fontWeight: '800' }}>Reintentar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.iconButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {messages.find((message) => message.authorUsername)?.authorUsername?.slice(0, 1).toUpperCase() ?? "C"}
                </Text>
              </View>
              <View style={styles.statusDot} />
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Chat</Text>
              <Text style={styles.headerSubtitle}>Active Now</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
            <Text style={styles.iconButtonText}>i</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={messages.length === 0 ? styles.emptyContent : styles.chatContent}
          ListHeaderComponent={
            <View style={styles.datePillWrap}>
              <Text style={styles.datePill}>Today</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyText}>Write the first message in this room.</Text>
            </View>
          }
        />

        <View style={styles.footerShell}>
          {imageUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.previewRemove} onPress={() => setImageUri(null)}>
                <Text style={styles.previewRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton} activeOpacity={0.85} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={20} color="#2a14b4" />
            </TouchableOpacity>

            <View style={styles.inputShell}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="#777586"
                multiline
                maxLength={500}
                blurOnSubmit={false}
                onSubmitEditing={() => {}}
                returnKeyType="default"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, (isUploadingImage || isSending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              activeOpacity={0.9}
              disabled={isUploadingImage || isSending}
            >
              <Text style={styles.sendIcon}>{isUploadingImage ? "..." : "➤"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(42, 20, 180, 0.08)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    left: -120,
    bottom: -140,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(226, 231, 255, 0.55)",
  },
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(250,248,255,0.88)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },
  iconButtonText: {
    color: "#131b2e",
    fontSize: 16,
    fontWeight: "800",
  },
  avatarWrap: {
    width: 48,
    height: 48,
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#4338ca",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerCopy: {
    justifyContent: "center",
  },
  headerTitle: {
    color: "#131b2e",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#2a14b4",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  datePillWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  datePill: {
    backgroundColor: "#f2f3ff",
    color: "#61656b",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    overflow: "hidden",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#131b2e",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: "#61656b",
    fontSize: 15,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: 14,
    maxWidth: "85%",
  },
  rowOwn: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  bubbleBase: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  own: {
    backgroundColor: "#4338ca",
    borderColor: "rgba(67,56,202,0.15)",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  other: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e7ff",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  author: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2a14b4",
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: "#131b2e",
  },
  textOwn: {
    color: "#ffffff",
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "#e2e7ff",
  },
  time: {
    fontSize: 10,
    color: "#777586",
    marginTop: 6,
    alignSelf: "flex-end",
    fontWeight: "700",
  },
  timeOwn: {
    color: "#61656b",
  },
  footerShell: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "rgba(250,248,255,0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.7)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewCard: {
    alignSelf: "flex-start",
    width: 110,
    height: 110,
    borderRadius: 18,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#e2e7ff",
    borderWidth: 1,
    borderColor: "rgba(226,231,255,0.9)",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(19,27,46,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRemoveText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
  },
  attachButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e7ff",
  },
  attachIcon: {
    fontSize: 18,
    color: "#2a14b4",
    fontWeight: "800",
  },
  inputShell: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#f2f3ff",
    borderWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  input: {
    color: "#131b2e",
    fontSize: 15,
    maxHeight: 110,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4338ca",
    shadowColor: "#4338ca",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});
