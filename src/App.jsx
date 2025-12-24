import React, { useState, useEffect } from 'react';
import SupplementCard from './SupplementCard';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Plus, X } from 'lucide-react'; // Neue Icons importieren

function App() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Zustand für das Popup-Fenster (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Zustand für das neue Formular
  const [newSupp, setNewSupp] = useState({
    name: '',
    dosage: '',
    type: 'kapsel' // Standardwert
  });

  const displayDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  // 1. DATEN LADEN
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplements"), (snapshot) => {
      const suppsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupplements(suppsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. ABHAKEN
  const toggleSupplement = async (id, currentHistory) => {
    const today = new Date().toISOString().split('T')[0];
    const suppDocRef = doc(db, "supplements", id);
    
    let newHistory;
    if (currentHistory.includes(today)) {
      newHistory = currentHistory.filter(d => d !== today);
    } else {
      newHistory = [...currentHistory, today];
    }
    await updateDoc(suppDocRef, { history: newHistory });
  };

  // 3. NEUES SUPPLEMENT SPEICHERN
  const handleAddSupplement = async (e) => {
    e.preventDefault(); // Verhindert Seite-Neuladen
    if (!newSupp.name || !newSupp.dosage) return; // Leere Eingaben verhindern

    await addDoc(collection(db, "supplements"), {
      name: newSupp.name,
      dosage: newSupp.dosage,
      type: newSupp.type,
      history: [] // Startet leer
    });

    // Reset und Schließen
    setNewSupp({ name: '', dosage: '', type: 'kapsel' });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans pb-24"> {/* pb-24 damit Button nichts verdeckt */}
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
                onToggle={() => toggleSupplement(supp.id, supp.history || [])} 
              />
            ))}
          </div>
        )}

        {/* --- DER GRÜNE FLOATING BUTTON --- */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-200 transition-all hover:scale-110 active:scale-95 z-40"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* --- DAS MODAL (POPUP) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              
              {/* Schließen Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-xl font-bold text-slate-800 mb-4">Neues Supplement</h2>
              
              <form onSubmit={handleAddSupplement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                  <input 
                    type="text" 
                    placeholder="z.B. Magnesium"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 transition-colors"
                    value={newSupp.name}
                    onChange={(e) => setNewSupp({...newSupp, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Dosierung</label>
                  <input 
                    type="text" 
                    placeholder="z.B. 2 Tabletten abends"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 transition-colors"
                    value={newSupp.dosage}
                    onChange={(e) => setNewSupp({...newSupp, dosage: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Typ</label>
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 transition-colors"
                    value={newSupp.type}
                    onChange={(e) => setNewSupp({...newSupp, type: e.target.value})}
                  >
                    <option value="kapsel">Kapsel / Tablette</option>
                    <option value="tropfen">Tropfen / Flüssig</option>
                    <option value="pulver">Pulver</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl mt-2 transition-colors"
                >
                  Speichern
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;