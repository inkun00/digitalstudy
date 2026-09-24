export const PROFILE_STORAGE_KEY = "heart_counselor_profile";
export const PROFILE_CHANGE_EVENT = "heart-profile-change";

const GENDERS = new Set(["female", "male", "other", "undisclosed"]);

export const GENDER_LABELS = {
  female: "여성",
  male: "남성",
  other: "기타",
  undisclosed: "응답하지 않음",
};

export function normalizeUserProfile(value) {
  const name = typeof value?.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
  const age = Number(value?.age);
  if (!name || name.length > 20 || !/^[\p{L}\p{M} .'-]+$/u.test(name) || !/\p{L}/u.test(name)) return null;
  if (!GENDERS.has(value?.gender)) return null;
  if (!Number.isInteger(age) || age < 6 || age > 120) return null;
  return { name, gender: value.gender, age };
}

export function getStoredProfile() {
  if (typeof window === "undefined") return null;
  try {
    return normalizeUserProfile(JSON.parse(sessionStorage.getItem(PROFILE_STORAGE_KEY) || "null"));
  } catch {
    return null;
  }
}

export function storeProfile(profile) {
  const normalized = normalizeUserProfile(profile);
  if (!normalized || typeof window === "undefined") return false;
  sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
  return true;
}

export function clearStoredProfile() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROFILE_STORAGE_KEY);
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
}
