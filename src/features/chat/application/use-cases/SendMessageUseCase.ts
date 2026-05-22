import { ChatError } from "../../../../shared/domain/errors/AppError";
import { Message } from "../../domain/entities/Message";
import { IChatRepository, SendMessageInput } from "../../domain/repositories/IChatRepository";

export class SendMessageUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}
  async execute(
    roomId: string,
    userId: string,
    input: SendMessageInput,
  ): Promise<Message> {
    const trimmedContent = input.content?.trim() ?? "";
    const hasImage = !!input.imageUri;
    if (!trimmedContent && !hasImage) {
      throw new ChatError("El mensaje no puede estar vacío");
    }
    if (trimmedContent.length > 500) throw new ChatError("Máximo 500 caracteres");
    return this.chatRepo.sendMessage(roomId, userId, {
      content: trimmedContent,
      imageUri: input.imageUri ?? null,
    });
  }
}