import React, { useState } from 'react';
import SupplementCard from './SupplementCard';

function App() {
  // Aktuelles Datum für den Header (Deutsch formatiert)
  const displayDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
  }); // Ergebnis: "Mittwoch, 24.12.2025"

  // Simulierter State (später kommt das aus Firebase!)
  const [supplements, setSupplements] = useState([
    { 
      id: 1, 
      name: "Vitamin D3", 
      type: "tropfen", 
      dosage: "1 Tropfen (10.000 IE)", 
      history: ["2025-12-23"] // Gestern genommen, heute noch nicht
    },
    { 
      id: 2, 
      name: "Omega 3", 
      type: "kapsel", 
      dosage: "3 Kapseln", 
      history: ["2025-12-23", new Date().toISOString().split('T')[0]] // Heute schon genommen
    }
  ]);

  // Funktion zum Umschalten (Hinzufügen/Entfernen des Datums)
  const toggleSupplement = (id) => {
    const today = new Date().toISOString().split('T')[0];
    
    setSupplements(prev => prev.map(supp => {
      if (supp.id === id) {
        const isTakenToday = supp.history.includes(today);
        let newHistory;
        
        if (isTakenToday) {
          // Entfernen (falls man aus Versehen geklickt hat)
          newHistory = supp.history.filter(d => d !== today);
        } else {
          // Hinzufügen
          newHistory = [...supp.history, today];
        }
        return { ...supp, history: newHistory };
      }
      return supp;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <header className="mb-8">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Dein Plan</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            {displayDate}
          </h1>
        </header>

        {/* Liste der Supplements */}
        <div className="space-y-4">
          {supplements.map(supp => (
            <SupplementCard 
              key={supp.id} 
              supplement={supp} 
              onToggle={toggleSupplement} 
            />
          ))}
        </div>

        {/* Button zum Hinzufügen (Platzhalter) */}
        <button className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:bg-slate-100 transition-colors">
          + Neues Supplement
        </button>

      </div>
    </div>
  );
}

export default App;