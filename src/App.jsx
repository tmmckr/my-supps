import React, { useState, useEffect } from 'react';
import SupplementCard from './SupplementCard';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { Plus, X, Droplets, Minus, Trophy, Flame, Zap, Sun, Moon } from 'lucide-react';

function App() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [waterStreak, setWaterStreak] = useState(0);
  const [suppStreak, setSuppStreak] = useState(0);
  const [waterAmount, setWaterAmount] = useState(0);
  const DAILY_GOAL = 3150;

  // --- NEU: State, um zu merken, ob wir gerade bearbeiten ---
  const [editingId, setEditingId] = useState(null);

  const [newSupp, setNewSupp] = useState({
    name: '',
    dosage: '',
    type: 'kapsel',
    stock: '',     
    perDay: '1',
    timeOfDay: 'morgens'
  });

  const todayISO = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "supplements"), (snapshot) => {
      const suppsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupplements(suppsData);
      setLoading(false);
      
      if (suppsData.length > 0) {
        let currentStreak = 0;
        const allDoneToday = suppsData.every(s => s.history && s.history.includes(todayISO));
        if (allDoneToday) currentStreak++;
        for (let i = 1; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const allDoneThatDay = suppsData.every(s => s.history && s.history.includes(dateStr));
          if (allDoneThatDay) currentStreak++; else break; 
        }
        setSuppStreak(currentStreak);
      }
    });
    return () => unsubscribe();
  }, [todayISO]);

  useEffect(() => {
    const waterDocRef = doc(db, "dailyLogs", todayISO);
    const unsubscribeWater = onSnapshot(waterDocRef, (docSnap) => setWaterAmount(docSnap.exists() ? docSnap.data().water || 0 : 0));
    return () => unsubscribeWater();
  }, [todayISO]);

  useEffect(() => {
    const calculateWaterStreak = async () => {
      const querySnapshot = await getDocs(collection(db, "dailyLogs"));
      const logs = {};
      querySnapshot.forEach((doc) => logs[doc.id] = doc.data().water || 0);
      let currentStreak = 0;
      if ((logs[todayISO] || 0) >= DAILY_GOAL) currentStreak++;
      for (let i = 1; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if ((logs[dateStr] || 0) >= DAILY_GOAL) currentStreak++; else break;
      }
      setWaterStreak(currentStreak);
    };
    calculateWaterStreak();
  }, [waterAmount, todayISO]);

  const updateWater = async (change) => {
    const newAmount = Math.max(0, waterAmount + change);
    const waterDocRef = doc(db, "dailyLogs", todayISO);
    await setDoc(waterDocRef, { water: newAmount }, { merge: true });
  };

  const toggleSupplement = async (supp) => {
    const suppDocRef = doc(db, "supplements", supp.id);
    const currentHistory = supp.history || [];
    const currentStock = parseInt(supp.stock) || 0;
    const usagePerDay = parseInt(supp.perDay) || 1;
    let newHistory; let newStock;
    if (currentHistory.includes(todayISO)) {
      newHistory = currentHistory.filter(d => d !== todayISO);
      newStock = currentStock + usagePerDay;
    } else {
      newHistory = [...currentHistory, todayISO];
      newStock = currentStock - usagePerDay;
    }
    await updateDoc(suppDocRef, { history: newHistory, stock: newStock });
  };

  const handleDeleteSupplement = async (id) => {
    await deleteDoc(doc(db, "supplements", id));
  };

  // --- NEU: FUNKTION UM BEARBEITEN MODUS ZU STARTEN ---
  const openEditModal = (supp) => {
    setNewSupp({
      name: supp.name,
      dosage: supp.dosage,
      type: supp.type,
      stock: supp.stock,
      perDay: supp.perDay,
      timeOfDay: supp.timeOfDay || 'morgens'
    });
    setEditingId(supp.id); // Wir merken uns die ID
    setIsModalOpen(true);
  };

  // --- NEU: FUNKTION UM NEU-MODUS ZU STARTEN ---
  const openAddModal = () => {
    setNewSupp({ name: '', dosage: '', type: 'kapsel', stock: '', perDay: '1', timeOfDay: 'morgens' });
    setEditingId(null); // Kein Bearbeitungs-Modus
    setIsModalOpen(true);
  };

  // --- NEU: ZENTRALE SPEICHER FUNKTION (Create OR Update) ---
  const handleSaveSupplement = async (e) => {
    e.preventDefault();
    if (!newSupp.name || !newSupp.dosage) return;

    const dataToSave = {
      name: newSupp.name,
      dosage: newSupp.dosage,
      type: newSupp.type,
      stock: parseInt(newSupp.stock) || 0,
      perDay: parseInt(newSupp.perDay) || 1,
      timeOfDay: newSupp.timeOfDay
    };

    if (editingId) {
      // FALL 1: UPDATE (Existierendes ändern)
      const suppRef = doc(db, "supplements", editingId);
      await updateDoc(suppRef, dataToSave); // history wird NICHT überschrieben, das ist gut!
    } else {
      // FALL 2: CREATE (Neues anlegen)
      await addDoc(collection(db, "supplements"), {
        ...dataToSave,
        history: [] // Nur bei neuem Eintrag History leer initialisieren
      });
    }

    setNewSupp({ name: '', dosage: '', type: 'kapsel', stock: '', perDay: '1', timeOfDay: 'morgens' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const morningSupps = supplements.filter(s => s.timeOfDay === 'morgens' || !s.timeOfDay);
  const eveningSupps = supplements.filter(s => s.timeOfDay === 'abends');
  const progressPercent = Math.min(100, (waterAmount / DAILY_GOAL) * 100);
  const isGoalReached = waterAmount >= DAILY_GOAL;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans pb-24">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="mb-2">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Dein Plan</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{displayDate}</h1>
        </header>

        {/* STREAK ANZEIGE */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${waterStreak > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}>
            <Flame className={`w-5 h-5 ${waterStreak > 0 ? 'fill-blue-500 text-blue-500' : ''}`} />
            <div className="flex flex-col items-start leading-none"><span className="text-lg font-black">{waterStreak}</span><span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Wasser Days</span></div>
          </div>
          <div className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${suppStreak > 0 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-100 text-slate-400'}`}>
            <Zap className={`w-5 h-5 ${suppStreak > 0 ? 'fill-orange-500 text-orange-500' : ''}`} />
            <div className="flex flex-col items-start leading-none"><span className="text-lg font-black">{suppStreak}</span><span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Supp Streak</span></div>
          </div>
        </div>

        {/* WASSER TRACKER */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border-2 shadow-sm transition-all ${isGoalReached ? 'bg-blue-500 border-blue-600' : 'bg-blue-50 border-blue-100'}`}>
          {!isGoalReached && <div className="absolute bottom-0 left-0 h-1.5 bg-blue-300 transition-all duration-500" style={{ width: `${progressPercent}%` }} />}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isGoalReached ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-600'}`}>
                {isGoalReached ? <Trophy className="w-6 h-6" /> : <Droplets className="w-6 h-6" />}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isGoalReached ? 'text-blue-100' : 'text-blue-500'}`}>{isGoalReached ? 'Ziel erreicht!' : 'Flüssigkeit'}</p>
                <h2 className={`text-2xl font-black ${isGoalReached ? 'text-white' : 'text-blue-900'}`}>{(waterAmount / 1000).toFixed(2).replace('.', ',')} <span className={`text-lg font-medium ml-1 ${isGoalReached ? 'text-blue-100' : 'text-blue-700'}`}>/ {(DAILY_GOAL / 1000).toFixed(2).replace('.', ',')} L</span></h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateWater(-250)} className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm active:scale-95 transition-all border ${isGoalReached ? 'bg-blue-600 text-blue-100 border-blue-500 hover:bg-blue-700' : 'bg-white text-blue-400 border-blue-100 hover:text-blue-600 hover:bg-blue-50'}`}><Minus className="w-5 h-5" /></button>
              <button onClick={() => updateWater(250)} className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-md active:scale-95 transition-all ${isGoalReached ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200'}`}><Plus className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-400">Lade Daten...</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2"><Sun className="w-5 h-5 text-orange-400 fill-orange-400" /> Morgens</h3>
              <div className="space-y-4">
                {morningSupps.length > 0 ? morningSupps.map(supp => (
                  <SupplementCard 
                    key={supp.id} 
                    supplement={supp} 
                    onToggle={() => toggleSupplement(supp)}
                    onDelete={handleDeleteSupplement}
                    onEdit={openEditModal} // NEU: Bearbeiten übergeben
                  />
                )) : <p className="text-sm text-slate-400 italic">Nichts für den Morgen geplant.</p>}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-400 fill-indigo-400" /> Abends</h3>
              <div className="space-y-4">
                {eveningSupps.length > 0 ? eveningSupps.map(supp => (
                  <SupplementCard 
                    key={supp.id} 
                    supplement={supp} 
                    onToggle={() => toggleSupplement(supp)}
                    onDelete={handleDeleteSupplement}
                    onEdit={openEditModal} // NEU: Bearbeiten übergeben
                  />
                )) : <p className="text-sm text-slate-400 italic">Nichts für den Abend geplant.</p>}
              </div>
            </div>
          </div>
        )}

        {/* BUTTON: Neuer Eintrag (ruft jetzt openAddModal auf) */}
        <button onClick={openAddModal} className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-200 transition-all hover:scale-110 active:scale-95 z-40"><Plus className="w-8 h-8" /></button>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              
              {/* Titel passt sich an: Neu oder Bearbeiten */}
              <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Supplement bearbeiten' : 'Neues Supplement'}</h2>
              
              <form onSubmit={handleSaveSupplement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                  <input type="text" placeholder="z.B. Magnesium" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.name} onChange={(e) => setNewSupp({...newSupp, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Dosierung (Text)</label>
                  <input type="text" placeholder="z.B. 2 Tabletten" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.dosage} onChange={(e) => setNewSupp({...newSupp, dosage: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Einnahmezeit</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setNewSupp({...newSupp, timeOfDay: 'morgens'})} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newSupp.timeOfDay === 'morgens' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><Sun className="w-4 h-4" /> Morgens</button>
                    <button type="button" onClick={() => setNewSupp({...newSupp, timeOfDay: 'abends'})} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newSupp.timeOfDay === 'abends' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><Moon className="w-4 h-4" /> Abends</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Packungsinhalt</label>
                    <input type="number" placeholder="120" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.stock} onChange={(e) => setNewSupp({...newSupp, stock: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Verbrauch/Tag</label>
                    <input type="number" placeholder="1" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.perDay} onChange={(e) => setNewSupp({...newSupp, perDay: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Typ</label>
                  <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.type} onChange={(e) => setNewSupp({...newSupp, type: e.target.value})}>
                    <option value="kapsel">Kapsel / Tablette</option>
                    <option value="tropfen">Tropfen / Flüssig</option>
                    <option value="pulver">Pulver</option>
                  </select>
                </div>
                
                {/* Button Text ändert sich je nach Modus */}
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
                  {editingId ? 'Änderungen speichern' : 'Neu erstellen'}
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