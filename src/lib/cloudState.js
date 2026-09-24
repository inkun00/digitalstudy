export const CHAT_SESSION_PREFIX = "heart_chat_session_v1:";
export const WALLET_STORAGE_KEY = "heart_shop_wallet_v1";
export const WALLET_DIRTY_KEY = "heart_cloud_wallet_dirty";
export const CLOUD_SESSION_EVENT = "heart-cloud-session-change";
export const ACTIVE_UID_KEY = "heart_cloud_active_uid";

export function chatStorageKey(scenarioId) {
  return `${CHAT_SESSION_PREFIX}${scenarioId}`;
}

export function chatDirtyKey(scenarioId) {
  return `heart_cloud_chat_dirty:${scenarioId}`;
}

export function chooseStoredValue(localValue, cloudValue, dirty) {
  if (dirty && localValue !== null) return { value: localValue, needsUpload: true };
  if (cloudValue !== null) return { value: cloudValue, needsUpload: false };
  return { value: localValue, needsUpload: localValue !== null };
}

export function accountCacheBoundary(previousUid, previousTabUid, nextUid) {
  const clearLocal = Boolean(previousUid && previousUid !== nextUid);
  return { clearLocal, clearTab: clearLocal || Boolean(previousTabUid && previousTabUid !== nextUid) };
}
