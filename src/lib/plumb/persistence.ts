/**
 * Asks the browser not to clear Plumb's storage under space pressure. Chrome decides on its own
 * (no prompt), usually granting it to an installed app. Resolves to whether storage is
 * persistent, or null where the browser has no such setting.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  const storage = typeof navigator === "undefined" ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return null;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return null;
  }
}
