import React, { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { calculateBarbellPlates } from '../utils/storage';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  unit?: 'lbs' | 'kg';
  barWeight?: number;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeight = 225,
  unit = 'lbs',
  barWeight = 45,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);

  if (!isOpen) return null;

  const plates = calculateBarbellPlates(targetWeight, barWeight, unit);
  const totalPerSide = plates.reduce((acc, curr) => acc + curr.plate * curr.count, 0);

  // Plate color styling for standard Olympic color schemes
  const getPlateColor = (plate: number) => {
    if (unit === 'lbs') {
      if (plate === 45) return 'bg-blue-600 border-blue-400 text-white';
      if (plate === 35) return 'bg-yellow-500 border-yellow-300 text-black';
      if (plate === 25) return 'bg-emerald-600 border-emerald-400 text-white';
      if (plate === 10) return 'bg-white border-zinc-300 text-black';
      if (plate === 5) return 'bg-rose-600 border-rose-400 text-white';
      return 'bg-zinc-400 border-zinc-200 text-black'; // 2.5
    } else {
      if (plate === 25) return 'bg-rose-600 border-rose-400 text-white';
      if (plate === 20) return 'bg-blue-600 border-blue-400 text-white';
      if (plate === 15) return 'bg-yellow-500 border-yellow-300 text-black';
      if (plate === 10) return 'bg-emerald-600 border-emerald-400 text-white';
      if (plate === 5) return 'bg-white border-zinc-300 text-black';
      return 'bg-zinc-400 border-zinc-200 text-black';
    }
  };

  const getPlateHeight = (plate: number) => {
    if (unit === 'lbs') {
      if (plate === 45) return 'h-24';
      if (plate === 35) return 'h-20';
      if (plate === 25) return 'h-16';
      if (plate === 10) return 'h-12';
      if (plate === 5) return 'h-10';
      return 'h-8';
    } else {
      if (plate === 25) return 'h-24';
      if (plate === 20) return 'h-22';
      if (plate === 15) return 'h-18';
      if (plate === 10) return 'h-14';
      return 'h-10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t sm:border border-zinc-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Barbell Plate Calculator</h3>
            <p className="text-xs text-zinc-400">
              Based on standard {barWeight} {unit} Olympic barbell
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Weight Controls */}
        <div className="mt-4 flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <button
            onClick={() => setTargetWeight((w) => Math.max(barWeight, w - (unit === 'lbs' ? 5 : 2.5)))}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="text-2xl font-black font-mono-numbers text-white tracking-tight">
              {targetWeight} <span className="text-sm font-semibold text-emerald-400">{unit}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {totalPerSide} {unit} per side + {barWeight} {unit} bar
            </div>
          </div>

          <button
            onClick={() => setTargetWeight((w) => w + (unit === 'lbs' ? 5 : 2.5))}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick jump presets */}
        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
          {[135, 185, 225, 275, 315, 365, 405].map((preset) => (
            <button
              key={preset}
              onClick={() => setTargetWeight(preset)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono-numbers transition ${
                targetWeight === preset
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Visual Barbell Rack graphic */}
        <div className="mt-6 flex flex-col items-center justify-center bg-zinc-950/80 rounded-xl p-6 border border-zinc-800/70 min-h-[140px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Plates on Each Side:
          </div>

          {plates.length === 0 ? (
            <div className="text-xs text-zinc-400 italic">Empty Bar ({barWeight} {unit})</div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Collar */}
              <div className="h-10 w-3 rounded-xs bg-zinc-500 border border-zinc-400" />
              {/* Stacked Plates from inside to outside */}
              {plates.map(({ plate, count }) =>
                Array.from({ length: count }).map((_, i) => (
                  <div
                    key={`${plate}-${i}`}
                    className={`flex items-center justify-center w-5 sm:w-6 ${getPlateHeight(
                      plate
                    )} ${getPlateColor(plate)} rounded-xs border shadow-sm font-mono-numbers text-[10px] font-black tracking-tighter`}
                    title={`${plate} ${unit}`}
                  >
                    <span className="rotate-90">{plate}</span>
                  </div>
                ))
              )}
              {/* Bar Sleeve */}
              <div className="h-4 w-12 rounded-r bg-zinc-400 border border-zinc-300" />
            </div>
          )}
        </div>

        {/* Breakdown List */}
        <div className="mt-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Per-Side Summary:
          </div>
          {plates.length === 0 ? (
            <div className="text-xs text-zinc-400">No plates needed. Just lift the bar!</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {plates.map(({ plate, count }) => (
                <div
                  key={plate}
                  className="flex items-center justify-between bg-zinc-800/60 px-3 py-2 rounded-lg border border-zinc-700/50"
                >
                  <span className="text-xs font-bold text-white font-mono-numbers">
                    {plate} {unit} plate
                  </span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono-numbers">
                    × {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition"
        >
          Close Calculator
        </button>
      </div>
    </div>
  );
};
