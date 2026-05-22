import { Message, Room } from "@features/chat/domain/entities/Message";
import { IChatRepository, SendMessageInput } from "@features/chat/domain/repositories/IChatRepository";
import { supabase } from "@shared/infrastructure/supabase/client";
// Use legacy API to avoid deprecation warnings in Expo SDK 54
const FileSystem: any = require('expo-file-system/legacy');
export class SupabaseChatRepository implements IChatRepository {
  // El nombre exacto del bucket en Supabase (sensible a mayúsculas):
  private readonly imagesBucket = "Imagenes";
 
  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapRoom);
  }
 
  async createRoom(name: string, userId: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms').insert({ name, created_by: userId })
      .select().single();
    if (error) throw error;
    return this.mapRoom(data);
  }
 
  async getMessages(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, room_id, user_id, content, image_url, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    const msgs = (data ?? []) as any[];
    // Obtener usernames de una sola vez
    const userIds = Array.from(new Set(msgs.map((m) => m.user_id)));
    let profilesMap: Record<string, string | undefined> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      profilesMap = (profiles ?? []).reduce((acc: any, p: any) => {
        acc[p.id] = p.username;
        return acc;
      }, {} as Record<string, string>);
    }
    const mapped = msgs.map((raw) => {
      const username = profilesMap[raw.user_id];
      const mappedMsg = this.mapMessage({ ...raw, profiles: { username } });
      console.log('[SupabaseChatRepository] mapped message', { id: mappedMsg.id, userId: mappedMsg.userId, authorUsername: mappedMsg.authorUsername });
      return mappedMsg;
    });
    return mapped;
  }
 
  async sendMessage(roomId: string, userId: string, input: SendMessageInput): Promise<Message> {
    const imageUrl = input.imageUri ? await this.uploadImage(roomId, userId, input.imageUri) : null;
    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: userId, content: input.content ?? "", image_url: imageUrl })
      .select('id, room_id, user_id, content, image_url, created_at')
      .single();
    if (error) throw error;
    const msg = data as any;
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    const mapped = this.mapMessage({ ...msg, profiles: { username: profile?.username } });
    console.log('[SupabaseChatRepository] sendMessage inserted', { id: mapped.id, userId: mapped.userId, authorUsername: mapped.authorUsername });
    return mapped;
  }
 
  subscribeToRoom(roomId: string, onMessage: (msg: Message) => void): () => void {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
          event: 'INSERT', schema: 'public',
          table: 'messages', filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('[SupabaseChatRepository] realtime payload', payload?.new?.id, payload?.new?.user_id);
          // El payload no incluye el username — se obtiene con una query extra
          const { data: profile } = await supabase
            .from('profiles').select('username')
            .eq('id', payload.new.user_id).single();
          console.log('[SupabaseChatRepository] realtime profile', { userId: payload.new.user_id, username: profile?.username });
          onMessage({
            id:             payload.new.id,
            roomId:         payload.new.room_id,
            userId:         payload.new.user_id,
            content:        payload.new.content,
            imageUrl:       payload.new.image_url,
            createdAt:      new Date(payload.new.created_at),
            authorUsername: profile?.username,
          });
        }
      ).subscribe();
 
    return () => { supabase.removeChannel(channel); };
  }
 
  private mapRoom = (raw: any): Room => ({
    id: raw.id, name: raw.name,
    createdBy: raw.created_by, createdAt: new Date(raw.created_at),
  });
 
  private mapMessage = (raw: any): Message => ({
    id: raw.id, roomId: raw.room_id, userId: raw.user_id,
    content: raw.content, imageUrl: raw.image_url ?? raw.imageUrl ?? null, createdAt: new Date(raw.created_at),
    authorUsername: raw.profiles?.username,
  });

  private async uploadImage(roomId: string, userId: string, imageUri: string): Promise<string> {
    const extension = this.getFileExtension(imageUri);
    const filePath = `${roomId}/${userId}/${Date.now()}.${extension}`;
    const contentType = `image/${extension}`;

    // 1) Native file upload via expo-file-system (avoids React Native Blob limitations)
    try {
      const sessionRes: any = await supabase.auth.getSession?.();
      const session = sessionRes?.data?.session ?? sessionRes?.session ?? null;
      const token = session?.access_token ?? null;
      if (!token) throw new Error('No session token available for upload');

      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${this.imagesBucket}/${filePath}`;

      console.log('[SupabaseChatRepository] uploading via native uploadAsync', { filePath, contentType });
      const result = await FileSystem.uploadAsync(uploadUrl, imageUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
        },
      });

      if (result.status >= 200 && result.status < 300) {
        const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${this.imagesBucket}/${filePath}`;
        console.log('[SupabaseChatRepository] uploaded image (native)', publicUrl);
        return publicUrl;
      }

      throw new Error(`Upload failed: ${result.status} ${result.body}`);
    } catch (nativeErr) {
      console.warn('[SupabaseChatRepository] native upload failed, trying base64 fallback', nativeErr);
    }

    // 2) Fallback: base64 -> Uint8Array -> direct PUT (no Blob)
    try {
      const sessionRes: any = await supabase.auth.getSession?.();
      const session = sessionRes?.data?.session ?? sessionRes?.session ?? null;
      const token = session?.access_token ?? null;
      if (!token) throw new Error('No session token available');

      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${this.imagesBucket}/${filePath}`;
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
        },
        body: bytes,
      });

      if (putRes.ok) {
        const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${this.imagesBucket}/${filePath}`;
        console.log('[SupabaseChatRepository] uploaded image (base64->Uint8Array)', publicUrl);
        return publicUrl;
      }

      const putText = await putRes.text().catch(() => '<no body>');
      throw new Error(`Upload failed: ${putRes.status} ${putRes.statusText} ${putText}`);
    } catch (fallbackErr) {
      console.error('[SupabaseChatRepository] all upload methods failed', fallbackErr);
      throw new Error('Failed to upload image: ' + ((fallbackErr as any)?.message ?? String(fallbackErr)));
    }
  }

  private getFileExtension(imageUri: string): string {
    const cleaned = imageUri.split('?')[0];
    const match = cleaned.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() ?? 'jpg';
  }
}
