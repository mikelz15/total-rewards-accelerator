import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CleanResult } from "./api";

const CLEAN_KEY = "tra.cleanResult";

export async function saveCleanResult(data: CleanResult): Promise<void> {
  await AsyncStorage.setItem(CLEAN_KEY, JSON.stringify(data));
}

export async function loadCleanResult(): Promise<CleanResult | null> {
  const raw = await AsyncStorage.getItem(CLEAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CleanResult;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(CLEAN_KEY);
}
