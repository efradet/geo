import React from "react";
import type { CountryConfig } from "../types";

export interface CountryListProps {
  pool: CountryConfig[];
  selectedISO: string | null;
  onSelect: (isoA3: string) => void;
  onClear: () => void;
}

function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

export const CountryList: React.FC<CountryListProps> = ({
  pool,
  selectedISO,
  onSelect,
  onClear,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Pays à placer</h2>
        <div className="text-xs text-gray-500">{pool.length} restant(s)</div>
      </div>

      <div className="mb-3 flex gap-2 items-center">
        <button
          onClick={onClear}
          className="px-2 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs hover:bg-gray-200"
          disabled={!selectedISO}
        >
          Désélectionner
        </button>
        {selectedISO && (
          <span className="text-xs text-indigo-700">
            Sélection actuelle: <b>{selectedISO}</b>
          </span>
        )}
      </div>

      {pool.length === 0 ? (
        <div className="text-sm text-gray-500">Tous les pays ont été placés 🎯</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pool.map((c) => (
            <li key={c.isoA3}>
              <button
                onClick={() => onSelect(c.isoA3)}
                className={classNames(
                  "w-full text-left px-3 py-2 rounded-xl border text-sm",
                  "bg-gray-50 hover:bg-gray-100 border-gray-200",
                  selectedISO === c.isoA3 && "ring-2 ring-indigo-500 bg-indigo-50"
                )}
                title={`Code ISO caché : ${c.isoA3}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
