import React, { useState, useEffect } from 'react';
import SupplementCard from './SupplementCard';
// Wir importieren die Datenbank-Funktionen
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

function App() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datum formatieren
  const displayDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  // 1. DATEN LADEN (Echtzeit-Synchronisation)
  useEffect(() => {
    // Wir lauschen auf die Collection "supplements"
    const unsubscribe = onSnapshot(collection(db, "supplements"), (snapshot) => {
      // Wenn sich in der Datenbank was ändert, passiert das hier automatisch:
      const suppsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupplements(suppsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FUNKTION ZUM ABHAKEN (Schreibt in die Datenbank)
  const toggleSupplement = async (id, currentHistory) => {
    const today = new Date().toISOString().split('T')[0];
    const suppDocRef = doc(db, "supplements", id);
    
    let newHistory;
    if (currentHistory.includes(today)) {
      // Wenn schon genommen -> Entfernen
      newHistory = currentHistory.filter(d => d !== today);
    } else {
      // Wenn noch nicht -> Hinzufügen
      newHistory = [...currentHistory, today];
    }

    // Update in Firebase senden (die App aktualisiert sich dann automatisch)
    await updateDoc(suppDocRef, {
      history: newHistory
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="mb-8">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Dein Plan</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            {displayDate}
          </h1>
        </header>

        {loading ? (
          <p className="text-center text-slate-400">Lade Daten...</p>
        ) : (
          <div className="space-y-4">
            {supplements.map(supp => (
              <SupplementCard 
                key={supp.id} 
                supplement={supp} 
                // Wir übergeben jetzt auch die aktuelle History, damit wir sie ändern können
                onToggle={() => toggleSupplement(supp.id, supp.history || [])} 
              />
            ))}
            
            {supplements.length === 0 && (
              <div className="text-center p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">Noch keine Supplements angelegt.</p>
                <p className="text-slate-400 text-sm mt-2">Geh in die Firebase Console und erstelle dein erstes Dokument in der Collection "supplements"!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;