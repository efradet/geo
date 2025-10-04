import React, { useMemo, useState, useEffect } from "react";
import type { CountryConfig } from "./types";
import { DEFAULT_COUNTRIES } from "./data/defaultCountries";
import { CountryList } from "./components/CountryList";
import { WorldMap } from "./components/WorldMap";

const MAX_TRIES = 3;
const showList = false;

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
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [wrongISO, setWrongISO] = useState<string | null>(null);

  const total = useMemo<number>(() => pool.length + placed.size, [pool, placed]);

  // Initialize tries for current pool
  useEffect(() => {
    setTries((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const c of pool) {
        if (next[c.isoA3] == null) next[c.isoA3] = 0;
      }
      return next;
    });
  }, [pool]);

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
      setFailed(new Set());
      setTries(Object.fromEntries(withoutDup.map(c => [c.isoA3, 0])));
      setSelectedISO(null);
      setWrongISO(null);
      setErrorMsg("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "JSON invalide";
      setErrorMsg(msg);
    }
  }

  function handleReset(): void {
    const shuffled = shuffle(DEFAULT_COUNTRIES);
    setPool(shuffled);
    setPlaced(new Set());
    setFailed(new Set());
    setTries(Object.fromEntries(shuffled.map(c => [c.isoA3, 0])));
    setJsonText(JSON.stringify(DEFAULT_COUNTRIES, null, 2));
    setSelectedISO(null);
    setWrongISO(null);
    setErrorMsg("");
  }

  function onCountryClick(targetISO: string): void {
    if (!selectedISO) return; // rien de sélectionné
    const isInPool = pool.some((p) => p.isoA3 === selectedISO);
    if (!isInPool) return;

    if (selectedISO === targetISO) {
      const nextPlaced = new Set(placed);
      nextPlaced.add(targetISO);
      setPlaced(nextPlaced);
      setPool((old) => old.filter((c) => c.isoA3 !== targetISO));
      setSelectedISO(null);
    } else {
      // increment tries for selected country
      setTries((prev) => {
        const current = prev[selectedISO] ?? 0;
        const nextCount = current + 1;
        const next = { ...prev, [selectedISO]: nextCount };
        // If reached MAX_TRIES, mark as failed and remove from pool
        if (nextCount >= MAX_TRIES) {
          setFailed((old) => new Set(old).add(selectedISO));
          //setPool((old) => old.filter((c) => c.isoA3 !== selectedISO));
          setSelectedISO(null);
        }
        return next;
      });
      setWrongISO(targetISO);
      window.setTimeout(() => setWrongISO(null), 450);
    }
  }

  const allDone = pool.length === 0 && (placed.size > 0 || failed.size > 0);
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
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          Jeu : sélectionner un pays, puis cliquer sur la carte
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-4">
          Chaque pays dispose de <b>{MAX_TRIES}</b> essais maximum. Au 3e échec, il est retiré de la liste (en orange sur la carte).
        </p>

        {showCongrats && (
          <div className="mb-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 shadow">
            🎉 Terminé — placés: {placed.size} • ratés: {failed.size}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
          <span>À placer: <b>{pool.length}</b></span>
          <span>Placés: <b>{placed.size}</b></span>
          <span>Ratés: <b>{failed.size}</b></span>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/5 w-full">
              {showList && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                      <h2 className="font-medium">Configuration de la liste (JSON)</h2>
                      <div className="text-sm text-gray-500">{placed.size + failed.size}/{total}</div>
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
              )}

            <CountryList
              pool={pool}
              tries={tries}
              maxTries={MAX_TRIES}
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
              failed={failed}
              wrongISO={wrongISO}
              selectedISO={selectedISO}
              onCountryClick={onCountryClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
