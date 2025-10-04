import React, { useMemo, useState, useEffect } from "react";
import type { CountryConfig } from "./types";
import { DEFAULT_COUNTRIES } from "./data/defaultCountries";
import { CountryList } from "./components/CountryList";
import { WorldMap } from "./components/WorldMap";

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const App: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(DEFAULT_COUNTRIES, null, 2)
  );
  const [pool, setPool] = useState<CountryConfig[]>(DEFAULT_COUNTRIES);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [wrongISO, setWrongISO] = useState<string | null>(null);

  const total = useMemo<number>(() => pool.length + placed.size, [pool, placed]);

  function applyJSON(): void {
    try {
      const raw = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(raw)) throw new Error("Le JSON doit être un tableau");
      const cleaned: CountryConfig[] = raw.map((d: any, idx: number) => {
        if (d == null || typeof d !== "object") {
          throw new Error(
            `Élément #${idx + 1} invalide (attendu objet { name, isoA3 })`
          );
        }
        const name = String(d.name ?? "").trim();
        const isoA3 = String(d.isoA3 ?? "").trim().toUpperCase();
        if (!name || !isoA3)
          throw new Error(
            `Élément #${idx + 1} incomplet : champs requis "name" et "isoA3"`
          );
        if (isoA3.length !== 3)
          throw new Error(
            `Élément #${idx + 1} : isoA3 doit contenir 3 lettres (ex: FRA, CHE, DEU)`
          );
        return { name, isoA3 };
      });

      const seen = new Set<string>();
      const withoutDup = cleaned.filter((c) => {
        if (seen.has(c.isoA3)) return false;
        seen.add(c.isoA3);
        return true;
      });

      setPool(shuffle(withoutDup));
      setPlaced(new Set());
      setSelectedISO(null);
      setWrongISO(null);
      setErrorMsg("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "JSON invalide";
      setErrorMsg(msg);
    }
  }

  function handleReset(): void {
    setPool(shuffle(DEFAULT_COUNTRIES));
    setPlaced(new Set());
    setJsonText(JSON.stringify(DEFAULT_COUNTRIES, null, 2));
    setSelectedISO(null);
    setWrongISO(null);
    setErrorMsg("");
  }

  function onCountryClick(targetISO: string): void {
    if (!selectedISO) return; // rien de sélectionné
    const isInPool = pool.some((p) => p.isoA3 === selectedISO);
    if (selectedISO === targetISO && isInPool) {
      const nextPlaced = new Set(placed);
      nextPlaced.add(targetISO);
      setPlaced(nextPlaced);
      setPool((old) => old.filter((c) => c.isoA3 !== targetISO));
      setSelectedISO(null);
    } else {
      setWrongISO(targetISO);
      window.setTimeout(() => setWrongISO(null), 450);
    }
  }

  const allDone = pool.length === 0 && placed.size > 0;
  const [showCongrats, setShowCongrats] = useState<boolean>(false);
  useEffect(() => {
    if (allDone) {
      setShowCongrats(true);
      const t = window.setTimeout(() => setShowCongrats(false), 2200);
      return () => window.clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
          Jeu : sélectionner un pays, puis cliquer sur la carte
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-6">
          1) Sélectionnez un pays dans la liste (à gauche). 2) Cliquez sur le pays correspondant sur la carte (à droite).
        </p>

        {showCongrats && (
          <div className="mb-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 shadow">
            🎉 Bravo — tous les pays de la liste ont été placés !
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/5 w-full">
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Configuration de la liste (JSON)</h2>
                <div className="text-sm text-gray-500">{placed.size}/{total}</div>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-48 md:h-40 rounded-xl border border-gray-200 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                spellCheck={false}
              />
              {errorMsg && (
                <div className="mt-2 text-sm text-red-600">⚠️ {errorMsg}</div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={applyJSON}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 active:scale-[.99]"
                >
                  Charger la liste
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm hover:bg-gray-200 active:scale-[.99]"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            <CountryList
              pool={pool}
              selectedISO={selectedISO}
              onSelect={(iso) => setSelectedISO(iso)}
              onClear={() => setSelectedISO(null)}
            />
          </div>

          <div className="md:w-3/5 w-full bg-white rounded-2xl shadow p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Carte du monde</h2>
              <div className="text-xs text-gray-500">Cliquez sur le pays correspondant</div>
            </div>

            <WorldMap
              placed={placed}
              wrongISO={wrongISO}
              selectedISO={selectedISO}
              onCountryClick={onCountryClick}
            />

            <div className="mt-3 text-sm text-gray-600">
              Astuce : le JSON accepte les codes ISO A3 (ex. FRA, CHE, DEU).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
