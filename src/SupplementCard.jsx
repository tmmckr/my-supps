import React from 'react';
import { Check, Pill, Droplets, Circle, AlertTriangle, Trash2 } from 'lucide-react';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const SupplementCard = ({ supplement, onToggle, onDelete }) => {
  const today = getTodayISO();
  const isTaken = supplement.history.includes(today);

  // Lagerbestand-Logik
  const stock = supplement.stock || 0;
  const perDay = supplement.perDay || 1;
  const daysLeft = Math.floor(stock / perDay);
  const isLowStock = daysLeft < 7 && stock > 0;
  const isEmpty = stock <= 0;

  const getIcon = () => {
    if (supplement.type === 'tropfen') return <Droplets className="w-6 h-6" />;
    if (supplement.type === 'kapsel') return <Pill className="w-6 h-6" />;
    return <Circle className="w-6 h-6" />;
  };

  return (
    <div 
      onClick={() => onToggle(supplement.id)}
      className={`
        relative overflow-hidden rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer shadow-sm group
        ${isTaken 
          ? "border-green-500 bg-green-50/50 opacity-70 scale-95" 
          : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md scale-100"
        }
        ${(!isTaken && isEmpty) ? "border-red-300 bg-red-50" : ""}
      `}
    >
      {/* --- NEU: Löschen-Button (erscheint nur bei Hover auf Desktop, oder ist immer da) --- */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // WICHTIG: Verhindert, dass die Karte beim Löschen "angeklickt" wird
          if (window.confirm(`Möchtest du "${supplement.name}" wirklich löschen?`)) {
            onDelete(supplement.id);
          }
        }}
        className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-10"
        title="Löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex justify-between items-center mt-2"> {/* mt-2 hinzugefügt für Platz oben */}
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
            
            <div className="flex items-center gap-2 mt-1">
              {isEmpty ? (
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> LEER - Nachfüllen!
                </span>
              ) : (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                  Noch {stock} ({daysLeft} Tage)
                </span>
              )}
            </div>

          </div>
        </div>

        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
          ${isTaken ? 'bg-green-500 border-green-500' : 'border-slate-300'}
        `}>
          {isTaken && <Check className="text-white w-5 h-5" />}
        </div>
      </div>
    </div>
  );
};

export default SupplementCard;