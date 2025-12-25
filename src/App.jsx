import React, { useState, useEffect } from 'react';
import SupplementCard from './SupplementCard';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { Plus, X, Droplets, Minus, Trophy, Flame, Zap, Sun, Moon, Check, Activity } from 'lucide-react';

function App() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [waterStreak, setWaterStreak] = useState(0);
  const [suppStreak, setSuppStreak] = useState(0);
  const [waterAmount, setWaterAmount] = useState(0);
  const DAILY_GOAL = 3150;

  // --- NEU: State für die Stimmung (1-5) ---
  const [mood, setMood] = useState(null);

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

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };
  const last7Days = getLast7Days();

  // 1. SUPPLEMENTS LADEN
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
          const d = new Date(); d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const allDoneThatDay = suppsData.every(s => s.history && s.history.includes(dateStr));
          if (allDoneThatDay) currentStreak++; else break; 
        }
        setSuppStreak(currentStreak);
      }
    });
    return () => unsubscribe();
  }, [todayISO]);

  // 2. TÄGLICHE LOGS (WASSER & MOOD) LADEN
  useEffect(() => {
    const logDocRef = doc(db, "dailyLogs", todayISO);
    const unsubscribeLogs = onSnapshot(logDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWaterAmount(data.water || 0);
        // NEU: Mood laden (oder null wenn noch nichts gewählt)
        setMood(data.mood || null);
      } else {
        setWaterAmount(0);
        setMood(null);
      }
    });
    return () => unsubscribeLogs();
  }, [todayISO]);

  useEffect(() => {
    const calculateWaterStreak = async () => {
      const querySnapshot = await getDocs(collection(db, "dailyLogs"));
      const logs = {};
      querySnapshot.forEach((doc) => logs[doc.id] = doc.data().water || 0);
      let streakCount = 0;
      for (let i = 1; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if ((logs[dateStr] || 0) >= DAILY_GOAL) streakCount++; else break;
      }
      setWaterStreak(streakCount);
    };
    calculateWaterStreak();
  }, []);

  const displayWaterStreak = waterAmount >= DAILY_GOAL ? waterStreak + 1 : waterStreak;

  const updateWater = async (change) => {
    const newAmount = Math.max(0, waterAmount + change);
    const logDocRef = doc(db, "dailyLogs", todayISO);
    // merge: true lässt das Mood Feld in Ruhe, wenn wir Wasser ändern
    await setDoc(logDocRef, { water: newAmount }, { merge: true });
  };

  // --- NEU: MOOD UPDATE FUNKTION ---
  const updateMood = async (level) => {
    setMood(level); // Sofortiges visuelles Feedback
    const logDocRef = doc(db, "dailyLogs", todayISO);
    await setDoc(logDocRef, { mood: level }, { merge: true });
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

  const openEditModal = (supp) => {
    setNewSupp({
      name: supp.name,
      dosage: supp.dosage,
      type: supp.type,
      stock: supp.stock,
      perDay: supp.perDay,
      timeOfDay: supp.timeOfDay || 'morgens'
    });
    setEditingId(supp.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setNewSupp({ name: '', dosage: '', type: 'kapsel', stock: '', perDay: '1', timeOfDay: 'morgens' });
    setEditingId(null);
    setIsModalOpen(true);
  };

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
      const suppRef = doc(db, "supplements", editingId);
      await updateDoc(suppRef, dataToSave);
    } else {
      await addDoc(collection(db, "supplements"), { ...dataToSave, history: [] });
    }
    setNewSupp({ name: '', dosage: '', type: 'kapsel', stock: '', perDay: '1', timeOfDay: 'morgens' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const morningSupps = supplements.filter(s => s.timeOfDay === 'morgens' || !s.timeOfDay);
  const eveningSupps = supplements.filter(s => s.timeOfDay === 'abends');
  const progressPercent = Math.min(100, (waterAmount / DAILY_GOAL) * 100);
  const isGoalReached = waterAmount >= DAILY_GOAL;

  // Icons für Mood (Emojis)
  const moodOptions = [
    { level: 1, icon: '😫', label: 'Schlecht' },
    { level: 2, icon: '😕', label: 'Müde' },
    { level: 3, icon: '😐', label: 'OK' },
    { level: 4, icon: '🙂', label: 'Gut' },
    { level: 5, icon: '🤩', label: 'Top' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans pb-24">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="mb-2">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Dein Plan</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{displayDate}</h1>
        </header>

        {/* MINI KALENDER */}
        {!loading && (
          <div className="flex justify-between items-center mb-4 px-1">
            {last7Days.map((dateObj) => {
              const dateStr = dateObj.toISOString().split('T')[0];
              const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2);
              const isToday = dateStr === todayISO;
              const allDone = supplements.length > 0 && supplements.every(s => s.history && s.history.includes(dateStr));
              let bgColor = 'bg-slate-100';
              let borderColor = 'border-transparent';
              let textColor = 'text-slate-300';
              let icon = <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />;
              if (allDone) {
                bgColor = 'bg-green-500'; textColor = 'text-white'; icon = <Check className="w-4 h-4" strokeWidth={3} />;
              } else if (isToday) {
                bgColor = 'bg-white'; borderColor = 'border-slate-300 border-dashed'; textColor = 'text-slate-400'; icon = <div className="w-2 h-2 rounded-full bg-slate-200" />;
              } else {
                bgColor = 'bg-red-50'; textColor = 'text-red-300'; icon = <X className="w-4 h-4" />;
              }
              return (
                <div key={dateStr} className="flex flex-col items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-slate-800' : 'text-slate-400'}`}>{dayName}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bgColor} ${borderColor} ${textColor} ${allDone ? 'shadow-md shadow-green-200 scale-105' : ''}`}>
                    {icon}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STREAK ANZEIGE */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${displayWaterStreak > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}>
            <Flame className={`w-5 h-5 ${displayWaterStreak > 0 ? 'fill-blue-500 text-blue-500' : ''}`} />
            <div className="flex flex-col items-start leading-none"><span className="text-lg font-black">{displayWaterStreak}</span><span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Wasser Days</span></div>
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

        {/* --- NEU: STIMMUNGS TRACKER --- */}
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dein Energielevel</span>
          </div>
          <div className="flex justify-between gap-1">
            {moodOptions.map((option) => {
              const isActive = mood === option.level;
              return (
                <button
                  key={option.level}
                  onClick={() => updateMood(option.level)}
                  className={`flex-1 py-2 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1
                    ${isActive 
                      ? 'border-purple-500 bg-purple-50 scale-105 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50 grayscale hover:grayscale-0'
                    }
                  `}
                >
                  <span className="text-2xl">{option.icon}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* --- ENDE STIMMUNGS TRACKER --- */}

        {loading ? (
          <p className="text-center text-slate-400">Lade Daten...</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2"><Sun className="w-5 h-5 text-orange-400 fill-orange-400" /> Morgens</h3>
              <div className="space-y-4">
                {morningSupps.length > 0 ? morningSupps.map(supp => (
                  <SupplementCard key={supp.id} supplement={supp} onToggle={() => toggleSupplement(supp)} onDelete={handleDeleteSupplement} onEdit={openEditModal} />
                )) : <p className="text-sm text-slate-400 italic">Nichts für den Morgen geplant.</p>}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-400 fill-indigo-400" /> Abends</h3>
              <div className="space-y-4">
                {eveningSupps.length > 0 ? eveningSupps.map(supp => (
                  <SupplementCard key={supp.id} supplement={supp} onToggle={() => toggleSupplement(supp)} onDelete={handleDeleteSupplement} onEdit={openEditModal} />
                )) : <p className="text-sm text-slate-400 italic">Nichts für den Abend geplant.</p>}
              </div>
            </div>
          </div>
        )}

        <button onClick={openAddModal} className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-200 transition-all hover:scale-110 active:scale-95 z-40"><Plus className="w-8 h-8" /></button>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              <h2 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Supplement bearbeiten' : 'Neues Supplement'}</h2>
              <form onSubmit={handleSaveSupplement} className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Name</label><input type="text" placeholder="z.B. Magnesium" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.name} onChange={(e) => setNewSupp({...newSupp, name: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Dosierung (Text)</label><input type="text" placeholder="z.B. 2 Tabletten" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.dosage} onChange={(e) => setNewSupp({...newSupp, dosage: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Einnahmezeit</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setNewSupp({...newSupp, timeOfDay: 'morgens'})} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newSupp.timeOfDay === 'morgens' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><Sun className="w-4 h-4" /> Morgens</button><button type="button" onClick={() => setNewSupp({...newSupp, timeOfDay: 'abends'})} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newSupp.timeOfDay === 'abends' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}><Moon className="w-4 h-4" /> Abends</button></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-600 mb-1">Packungsinhalt</label><input type="number" placeholder="120" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.stock} onChange={(e) => setNewSupp({...newSupp, stock: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-600 mb-1">Verbrauch/Tag</label><input type="number" placeholder="1" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.perDay} onChange={(e) => setNewSupp({...newSupp, perDay: e.target.value})} /></div></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Typ</label><select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500" value={newSupp.type} onChange={(e) => setNewSupp({...newSupp, type: e.target.value})}><option value="kapsel">Kapsel / Tablette</option><option value="tropfen">Tropfen / Flüssig</option><option value="pulver">Pulver</option></select></div>
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl mt-2 transition-colors">{editingId ? 'Änderungen speichern' : 'Neu erstellen'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;