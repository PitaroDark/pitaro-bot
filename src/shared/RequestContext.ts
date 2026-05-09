import { AsyncLocalStorage } from "node:async_hooks";

interface InteractionContext {
  guildId: string;
  userId: string;
}

const storage = new AsyncLocalStorage<InteractionContext>();

export const RequestContext = {
  run<T>(ctx: InteractionContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },
  get guildId(): string {
    const store = storage.getStore();
    if (!store) throw new Error("RequestContext: no hay contexto de interacción activo");
    return store.guildId;
  },
  get userId(): string {
    const store = storage.getStore();
    if (!store) throw new Error("RequestContext: no hay contexto de interacción activo");
    return store.userId;
  },
};
