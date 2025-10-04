import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

export interface WorldMapProps {
  placed: Set<string>;
  wrongISO: string | null;
  selectedISO: string | null;
  onCountryClick: (isoA3: string) => void;
}

const WORLD_GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson" as const;

export const WorldMap: React.FC<WorldMapProps> = ({ placed, wrongISO, selectedISO, onCountryClick }) => {
  return (
    <div className="w-full h-[520px] md:h-[620px]">
      <ComposableMap projectionConfig={{ scale: 150 }} className="w-full h-full">
        <ZoomableGroup zoom={1} center={[10, 20]}>
          <Geographies geography={WORLD_GEO_URL}>
            {({ geographies }: { geographies: any[] }) => {
              console.log('Total geographies loaded:', geographies.length);
              if (geographies.length > 0) {
                console.log('First geography properties:', geographies[0]?.properties);
                console.log(geographies[0]?.properties?.name + " : "  + geographies[0]?.id);
              }
              return geographies.map((geo: any) => {
                const iso = String(geo?.id || geo?.properties?.ISO_A3 || geo?.properties?.iso_a3 || geo?.properties?.ISO_A3_EH || geo?.properties?.ADM0_A3 || geo?.properties?.ISO_A2 || "");
                const isPlaced = placed.has(iso);
                const isWrong = wrongISO === iso;
                const isSelectedTarget = selectedISO === iso;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onCountryClick(iso)}
                    style={{
                      default: {
                        fill: isPlaced
                          ? "#22c55e"
                          : isWrong
                          ? "#ef4444"
                          : "#e5e7eb",
                        stroke: "#94a3b8",
                        strokeWidth: 0.6,
                        outline: "none",
                        transition: "fill 120ms ease-out, stroke 120ms ease-out",
                        cursor: "pointer",
                      },
                      hover: {
                        fill: isPlaced ? "#22c55e" : "#cbd5e1",
                        outline: "none",
                      },
                      pressed: {
                        fill: isPlaced ? "#16a34a" : "#94a3b8",
                        outline: "none",
                      },
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};
