import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
// Neue Icons für die Tageszeiten
import { Sun, Moon, Check, Plus, Trash2, Flame, ListTodo, Sunrise, Sunset, Clock } from 'lucide-react';

const RoutineView = ({ darkMode, toggleDarkMode }) => {
  const [routines, setRoutines] = useState([]);
  const [newRoutine, setNewRoutine] = useState('');
  // State für die ausgewählte Zeit (Standard: morgens)
  const [newRoutineTime, setNewRoutineTime] = useState('morgens');
  const [loading, setLoading] = useState(true);

  const todayISO = new Date().toISOString().split('T')[0];

  // 1. Laden
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "routines"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutines(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Abhaken
  const toggleRoutine = async (item) => {
    const itemRef = doc(db, "routines", item.id);
    const currentHistory = item.history || [];
    let newHistory;

    if (currentHistory.includes(todayISO)) {
      newHistory = currentHistory.filter(d => d !== todayISO);
    } else {
      newHistory = [...currentHistory, todayISO];
    }
    await updateDoc(itemRef, { history: newHistory });
  };

  // 3. Hinzufügen (jetzt mit Zeit!)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoutine) return;
    await addDoc(collection(db, "routines"), {
      title: newRoutine,
      timeOfDay: newRoutineTime, // Speichern der Zeit
      history: []
    });
    setNewRoutine('');
    // Wir lassen die Zeit auf der letzten Auswahl oder resetten sie - Reset ist oft besser
    setNewRoutineTime('morgens');
  };

  // 4. Löschen
  const handleDelete = async (id) => {
    if (window.confirm("Routine löschen?")) {
      await deleteDoc(doc(db, "routines", id));
    }
  };

  const getStreak = (history) => {
    if (!history || history.length === 0) return 0;
    let streak = 0;
    const sorted = [...history].sort().reverse();
    let checkDate = new Date();
    if (sorted[0] !== todayISO) checkDate.setDate(checkDate.getDate() - 1);
    
    for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (history.includes(dateStr)) {
            streak++; checkDate.setDate(checkDate.getDate() - 1);
        } else { break; }
    }
    return streak;
  };

  // Hilfsfunktion: Routine-Karte rendern (damit wir den Code nicht 4x kopieren müssen)
  const renderRoutineItem = (item) => {
    const isDone = item.history?.includes(todayISO);
    const streak = getStreak(item.history);
    
    return (
        <div 
          key={item.id}
          onClick={() => toggleRoutine(item)}
          className={`
            flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group mb-3
            ${isDone 
                ? 'bg-purple-500 border-purple-500 shadow-sm dark:shadow-none' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-300'
            }
          `}
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                    ${isDone ? 'border-white bg-white text-purple-500' : 'border-slate-300 dark:border-slate-500'}
                `}>
                    {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className={`font-bold text-lg truncate ${isDone ? 'text-white line-through opacity-90' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.title}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {streak > 0 && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${isDone ? 'text-white/80' : 'text-orange-500'}`}>
                        <Flame className="w-4 h-4 fill-current" />
                        <span>{streak}</span>
                    </div>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className={`p-2 rounded-full transition-colors ${isDone ? 'text-purple-200 hover:text-white hover:bg-purple-600' : 'text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
  };

  // Listen filtern
  // Falls keine Zeit gesetzt ist (alte Items), packen wir sie zu "Flexibel"
  const morningList = routines.filter(r => r.timeOfDay === 'morgens');
  const noonList = routines.filter(r => r.timeOfDay === 'mittags');
  const eveningList = routines.filter(r => r.timeOfDay === 'abends');
  const flexibleList = routines.filter(r => r.timeOfDay === 'flexibel' || !r.timeOfDay);

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-32">
      {/* HEADER */}
      <header className="mb-2 flex justify-between items-end">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest font-semibold">Tägliche</p>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Routinen</h1>
        </div>
        <button onClick={toggleDarkMode} className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-yellow-400 shadow-sm border dark:border-slate-700">
          {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </header>

      {/* INPUT BEREICH */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleAdd}>
            <input 
              type="text" 
              placeholder="Neue Routine (z.B. Bett machen)" 
              className="w-full p-3 mb-3 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              value={newRoutine}
              onChange={(e) => setNewRoutine(e.target.value)}
            />
            
            {/* Zeit-Auswahl Buttons */}
            <div className="flex justify-between gap-2">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    <button type="button" onClick={() => setNewRoutineTime('morgens')} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${newRoutineTime === 'morgens' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <Sunrise className="w-3 h-3" /> Morgens
                    </button>
                    <button type="button" onClick={() => setNewRoutineTime('mittags')} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${newRoutineTime === 'mittags' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <Sun className="w-3 h-3" /> Mittags
                    </button>
                    <button type="button" onClick={() => setNewRoutineTime('abends')} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${newRoutineTime === 'abends' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <Moon className="w-3 h-3" /> Abends
                    </button>
                    <button type="button" onClick={() => setNewRoutineTime('flexibel')} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${newRoutineTime === 'flexibel' ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <Clock className="w-3 h-3" /> Egal
                    </button>
                </div>
                <button type="submit" className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 shrink-0">
                    <Plus className="w-5 h-5" />
                </button>
            </div>
          </form>
      </div>

      {/* LISTEN ANZEIGEN */}
      <div className="space-y-6">
        
        {/* Morgens */}
        {morningList.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-orange-400" /> Morgens
                </h3>
                {morningList.map(renderRoutineItem)}
            </div>
        )}

        {/* Mittags */}
        {noonList.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-yellow-500" /> Mittags
                </h3>
                {noonList.map(renderRoutineItem)}
            </div>
        )}

        {/* Abends */}
        {eveningList.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" /> Abends
                </h3>
                {eveningList.map(renderRoutineItem)}
            </div>
        )}

        {/* Flexibel */}
        {flexibleList.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-slate-400" /> Flexibel
                </h3>
                {flexibleList.map(renderRoutineItem)}
            </div>
        )}

        {!loading && routines.length === 0 && (
            <div className="text-center py-10 opacity-50">
                <ListTodo className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400">Keine Routinen angelegt</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RoutineView;