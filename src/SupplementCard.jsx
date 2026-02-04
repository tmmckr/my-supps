import React from 'react';
import { Check, Pill, Droplets, Circle, AlertTriangle, Trash2, Pencil } from 'lucide-react';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const SupplementCard = ({ supplement, onToggle, onDelete, onEdit }) => {
  const today = getTodayISO();
  const isTaken = supplement.history.includes(today);

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
          ? "border-green-500 bg-green-50/50 dark:bg-green-900/20 opacity-70 scale-95" 
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md scale-100"
        }
        ${(!isTaken && isEmpty) ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : ""}
      `}
    >
      {/* BUTTONS */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(supplement); }}
          className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-all"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm(`Möchtest du "${supplement.name}" wirklich löschen?`)) onDelete(supplement.id); }}
          className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full 
            ${isTaken 
              ? 'bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400'
            }`}>
            {getIcon()}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isTaken ? 'text-green-800 dark:text-green-400 line-through' : 'text-slate-800 dark:text-white'}`}>
              {supplement.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {supplement.dosage}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              {isEmpty ? (
                <span className="text-xs font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> LEER - Nachfüllen!
                </span>
              ) : (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full 
                  ${isLowStock 
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                  Noch {stock} ({daysLeft} Tage)
                </span>
              )}
            </div>

          </div>
        </div>

        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
          ${isTaken 
            ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600' 
            : 'border-slate-300 dark:border-slate-600'
          }
        `}>
          {isTaken && <Check className="text-white w-5 h-5" />}
        </div>
      </div>
    </div>
  );
};

export default SupplementCard;