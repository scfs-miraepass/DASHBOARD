import type { User } from "@/sdk";


export const useSession = () => useState<User | undefined>("session.user", () => undefined)