export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  localImageUri?: string | null; // local temp URI for images selected on device
  failed?: boolean; // mark message as failed to send
  sending?: boolean; // optimistic sending state
  createdAt: Date;
  authorUsername?: string;  //Desnormalizacion controlada para la UI

}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}