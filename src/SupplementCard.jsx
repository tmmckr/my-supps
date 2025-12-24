import React from 'react';
import { Check, Pill, Droplets, Circle } from 'lucide-react'; // Icons für modernen Look

// Hilfsfunktion: Gibt das heutige Datum als String (YYYY-MM-DD) zurück
// Das brauchen wir, um zu prüfen, ob "heute" in der History steht.
const getTodayISO = () => new Date().toISOString().split('T')[0];

const SupplementCard = ({ supplement, onToggle }) => {
  const today = getTodayISO();
  
  // Prüfen: Ist heute schon erledigt?
  const isTaken = supplement.history.includes(today);

  // Icon-Auswahl basierend auf dem Typ (optional)
  const getIcon = () => {
    if (supplement.type === 'tropfen') return <Droplets className="w-6 h-6" />;
    if (supplement.type === 'kapsel') return <Pill className="w-6 h-6" />;
    return <Circle className="w-6 h-6" />;
  };

  return (
    <div 
      onClick={() => onToggle(supplement.id)}
      className={`
        relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer shadow-sm
        ${isTaken 
          ? "border-green-500 bg-green-50/50 opacity-70 scale-95" // Style wenn genommen (dezent)
          : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md scale-100" // Style wenn offen (auffällig)
        }
      `}
    >
      <div className="flex justify-between items-center">
        {/* Linke Seite: Infos */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isTaken ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isTaken ? 'text-green-800 line-through' : 'text-slate-800'}`}>
              {supplement.name}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {supplement.dosage}
            </p>
          </div>
        </div>

        {/* Rechte Seite: Checkbox-Visualisierung */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
          ${isTaken ? 'bg-green-500 border-green-500' : 'border-slate-300'}
        `}>
          {isTaken && <Check className="text-white w-5 h-5" />}
        </div>
      </div>

      {/* Status Text (nur wenn noch offen, um Dringlichkeit zu zeigen) */}
      {!isTaken && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>Noch offen</span>
          <span className="text-blue-600 font-bold uppercase tracking-wider">Jetzt nehmen</span>
        </div>
      )}
    </div>
  );
};

export default SupplementCard;