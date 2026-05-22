import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { supabase } from "@shared/infrastructure/supabase/client";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const CHAT_NOTIFICATION_CHANNEL_ID = "chat-messages";

let messageNotificationsChannel: ReturnType<typeof supabase.channel> | null = null;
let subscribedUserId: string | null = null;
let setupPromise: Promise<void> | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationChannelAsync() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHAT_NOTIFICATION_CHANNEL_ID, {
    name: "Mensajes de chat",
    description: "Notificaciones de mensajes nuevos en salas de chat",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4338ca",
    showBadge: true,
  });
}

async function requestNotificationPermissionsAsync() {
  const currentPermissions = await Notifications.getPermissionsAsync();
  const granted =
    currentPermissions.granted ||
    currentPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (granted) return true;

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requestedPermissions.granted ||
    requestedPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function buildMessagePreview(content: string) {
  const trimmed = content.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
}

export function useMessageNotifications(activeRoomId: string | null) {
  const user = useAuthStore((state) => state.user);
  const activeRoomIdRef = useRef<string | null>(activeRoomId);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!user) return;

      if (setupPromise) {
        await setupPromise;
        return;
      }

      setupPromise = (async () => {
        try {
          const granted = await requestNotificationPermissionsAsync();
          if (!granted || cancelled) return;

          await ensureNotificationChannelAsync();

          if (subscribedUserId === user.id && messageNotificationsChannel) {
            return;
          }

          if (messageNotificationsChannel) {
            await supabase.removeChannel(messageNotificationsChannel);
            messageNotificationsChannel = null;
            subscribedUserId = null;
          }

          const channel = supabase.channel(`message-notifications:${user.id}`);

          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            async (payload) => {
              const message = payload.new as {
                id: string;
                room_id: string;
                user_id: string;
                content: string;
                image_url?: string | null;
                created_at: string;
              };

              if (!message || message.user_id === user.id) return;
              if (activeRoomIdRef.current && message.room_id === activeRoomIdRef.current) return;

              const [{ data: room }, { data: profile }] = await Promise.all([
                supabase.from("rooms").select("name").eq("id", message.room_id).single(),
                supabase.from("profiles").select("username").eq("id", message.user_id).single(),
              ]);

              const roomName = room?.name ?? "Chat";
              const authorName = profile?.username ?? "Alguien";
              const preview = buildMessagePreview(message.content || (message.image_url ? "Imagen" : "Nuevo mensaje"));

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Nuevo mensaje en ${roomName}`,
                  body: `${authorName}: ${preview}`,
                  data: {
                    roomId: message.room_id,
                    messageId: message.id,
                  },
                  sound: "default",
                  channelId: CHAT_NOTIFICATION_CHANNEL_ID,
                },
                trigger: null,
              });
            },
          );

          messageNotificationsChannel = channel.subscribe();
          subscribedUserId = user.id;
        } finally {
          setupPromise = null;
        }
      })();

      await setupPromise;
    };

    void start();

    return () => {
      cancelled = true;
      if (subscribedUserId === user?.id && messageNotificationsChannel) {
        void supabase.removeChannel(messageNotificationsChannel);
        messageNotificationsChannel = null;
        subscribedUserId = null;
      }
    };
  }, [user?.id]);
}
