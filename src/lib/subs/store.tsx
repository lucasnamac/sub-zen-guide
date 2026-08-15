import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Settings, Subscription } from "./types";
import { BASE_CATEGORIES } from "./types";
import { defaultSettings, seedSubscriptions } from "./seed";

const KEY_SUBS = "assinaturas:subs:v1";
const KEY_SET = "assinaturas:settings:v1";

type Store = {
  subs: Subscription[];
  settings: Settings;
  categories: string[];
  ready: boolean;
  addSub: (s: Subscription) => void;
  updateSub: (id: string, patch: Partial<Subscription>) => void;
  removeSub: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

export function SubsProvider({ children }: { children: ReactNode }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const rawSubs = localStorage.getItem(KEY_SUBS);
      const rawSet = localStorage.getItem(KEY_SET);
      setSubs(rawSubs ? JSON.parse(rawSubs) : seedSubscriptions());
      if (rawSet) setSettingsState({ ...defaultSettings, ...JSON.parse(rawSet) });
    } catch {
      setSubs(seedSubscriptions());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY_SUBS, JSON.stringify(subs));
  }, [subs, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY_SET, JSON.stringify(settings));
  }, [settings, ready]);

  const value = useMemo<Store>(
    () => ({
      subs,
      settings,
      ready,
      categories: [...BASE_CATEGORIES, ...settings.customCategories],
      addSub: (s) => setSubs((prev) => [s, ...prev]),
      updateSub: (id, patch) =>
        setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      removeSub: (id) => setSubs((prev) => prev.filter((s) => s.id !== id)),
      setSettings: (patch) => setSettingsState((prev) => ({ ...prev, ...patch })),
      addCategory: (name) =>
        setSettingsState((prev) =>
          prev.customCategories.includes(name) || !name
            ? prev
            : { ...prev, customCategories: [...prev.customCategories, name] },
        ),
      removeCategory: (name) =>
        setSettingsState((prev) => ({
          ...prev,
          customCategories: prev.customCategories.filter((c) => c !== name),
        })),
      reset: () => {
        setSubs(seedSubscriptions());
        setSettingsState(defaultSettings);
      },
    }),
    [subs, settings, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSubs deve ser usado dentro de SubsProvider");
  return ctx;
}
