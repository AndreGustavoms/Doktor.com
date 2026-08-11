import "server-only";
import { z } from "zod";

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Digite a senha atual."),
  newPassword: z.string().min(12, "A nova senha precisa ter pelo menos 12 caracteres."),
});
