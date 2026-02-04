import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Sun, Moon, Dumbbell, Timer, Plus, ChevronLeft, Trash2, MoreHorizontal, Save } from 'lucide-react';

const WorkoutView = ({ darkMode, toggleDarkMode }) => {
  // --- STATE ---
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null); // Wenn null -> Übersicht, sonst -> Trainingsansicht
  const [loading, setLoading] = useState(true);
  
  // Timer
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [timerActive, setTimerActive] = useState(false);

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isExModalOpen, setIsExModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newExName, setNewExName] = useState('');

  // 1. Lade Pläne aus Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "workouts"), (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(plansData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- TIMER LOGIK ---
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startTimer = () => {
    setTimerSeconds(180); 
    setTimerActive(true);
  };
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- ACTIONS ---

  // Neuen Plan erstellen (z.B. "Push 1")
  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newPlanName) return;
    await addDoc(collection(db, "workouts"), {
      name: newPlanName,
      exercises: [] // Startet leer
    });
    setNewPlanName('');
    setIsPlanModalOpen(false);
  };

  // Plan löschen
  const handleDeletePlan = async (id) => {
    if(window.confirm("Plan wirklich löschen?")) {
      await deleteDoc(doc(db, "workouts", id));
      if (activePlan?.id === id) setActivePlan(null);
    }
  };

  // Übung hinzufügen
  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!newExName || !activePlan) return;

    const updatedExercises = [
      ...activePlan.exercises,
      {
        id: Date.now(), // Einfache ID
        name: newExName,
        sets: [
          { id: 1, weight: '', reps: '' }, // Startet mit 1 Satz
          { id: 2, weight: '', reps: '' }  // und 2. Satz als Vorschlag
        ]
      }
    ];

    // In Firebase speichern
    const planRef = doc(db, "workouts", activePlan.id);
    await updateDoc(planRef, { exercises: updatedExercises });
    
    // Lokalen State updaten (damit es sofort sichtbar ist ohne Flackern)
    setActivePlan({ ...activePlan, exercises: updatedExercises });
    setNewExName('');
    setIsExModalOpen(false);
  };

  // Satz Update (Gewicht/Wdh ändern)
  const handleUpdateSet = async (exIndex, setIndex, field, value) => {
    const updatedExercises = [...activePlan.exercises];
    updatedExercises[exIndex].sets[setIndex][field] = value;

    // Wir updaten den lokalen State sofort für Performance (Tippen ohne Lag)
    setActivePlan({ ...activePlan, exercises: updatedExercises });

    // Speichern in DB (Debouncing wäre hier pro, aber direkt geht auch)
    const planRef = doc(db, "workouts", activePlan.id);
    await updateDoc(planRef, { exercises: updatedExercises });
  };

  // Neuen Satz hinzufügen
  const handleAddSet = async (exIndex) => {
    const updatedExercises = [...activePlan.exercises];
    const currentSets = updatedExercises[exIndex].sets;
    // Kopiere Werte vom letzten Satz für Komfort
    const lastSet = currentSets[currentSets.length - 1];
    
    updatedExercises[exIndex].sets.push({
      id: Date.now(),
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : ''
    });

    setActivePlan({ ...activePlan, exercises: updatedExercises });
    const planRef = doc(db, "workouts", activePlan.id);
    await updateDoc(planRef, { exercises: updatedExercises });
  };

  // Satz löschen
  const handleDeleteSet = async (exIndex, setIndex) => {
    const updatedExercises = [...activePlan.exercises];
    updatedExercises[exIndex].sets.splice(setIndex, 1);
    
    setActivePlan({ ...activePlan, exercises: updatedExercises });
    const planRef = doc(db, "workouts", activePlan.id);
    await updateDoc(planRef, { exercises: updatedExercises });
  };
  
  // Übung löschen
  const handleDeleteExercise = async (exIndex) => {
     if(!window.confirm("Übung löschen?")) return;
     const updatedExercises = [...activePlan.exercises];
     updatedExercises.splice(exIndex, 1);

     setActivePlan({ ...activePlan, exercises: updatedExercises });
     const planRef = doc(db, "workouts", activePlan.id);
     await updateDoc(planRef, { exercises: updatedExercises });
  };


  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-32">
       {/* HEADER */}
       <header className="mb-2 flex justify-between items-end">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest font-semibold">Dein Gym</p>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {activePlan ? activePlan.name : 'Pläne'}
            </h1>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-yellow-400 shadow-sm border dark:border-slate-700"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </header>

        {/* --- TIMER (Immer sichtbar) --- */}
        <div className="fixed bottom-24 right-6 z-40">
           <button 
             onClick={startTimer}
             className={`flex items-center gap-2 px-6 py-4 rounded-full shadow-lg font-bold text-white transition-all active:scale-95
               ${timerActive 
                 ? 'bg-orange-500 animate-pulse ring-4 ring-orange-200' 
                 : 'bg-slate-800 dark:bg-slate-700'
               }`}
           >
             <Timer className="w-5 h-5" />
             {timerActive ? formatTime(timerSeconds) : '3:00'}
           </button>
        </div>

        {/* --- VIEW 1: ÜBERSICHT DER PLÄNE --- */}
        {!activePlan && (
          <div className="space-y-4">
            {plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => setActivePlan(plan)}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:border-orange-300 transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                   <h3 className="font-bold text-xl text-slate-800 dark:text-white">{plan.name}</h3>
                   <p className="text-slate-400 text-sm">{plan.exercises?.length || 0} Übungen</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                  className="p-2 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {/* Neuer Plan Button */}
            <button 
              onClick={() => setIsPlanModalOpen(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Neuer Trainingsplan
            </button>
          </div>
        )}

        {/* --- VIEW 2: AKTIVER PLAN (ÜBUNGEN) --- */}
        {activePlan && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setActivePlan(null)}
              className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Zurück zur Übersicht
            </button>

            {/* Übungs-Liste */}
            {activePlan.exercises?.map((ex, exIndex) => (
              // ÄNDERUNG 1: p-5 zu p-3 oder p-4 für mehr Platz auf Handys
              <div key={ex.id} className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-5 border shadow-sm dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-2">{ex.name}</h3>
                  <button onClick={() => handleDeleteExercise(exIndex)} className="text-slate-300 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                </div>

                {/* Header für Sätze - ÄNDERUNG 2: Spaltenbreiten optimiert und gap verkleinert */}
                <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wide text-center">
                  <span>#</span>
                  <span>kg</span>
                  <span>Wdh</span>
                  <span></span>
                </div>

                {/* Sätze */}
                <div className="space-y-2">
                  {ex.sets.map((set, setIndex) => (
                    // ÄNDERUNG 2: Spaltenbreiten hier ebenfalls angepasst (2rem statt 30px)
                    <div key={setIndex} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center">
                      {/* Satz Nummer */}
                      <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-700 w-8 h-8 rounded-full text-slate-500 text-sm font-bold shrink-0">
                        {setIndex + 1}
                      </div>
                      
                      {/* Gewicht Input */}
                      {/* ÄNDERUNG 3: w-full und min-w-0 hinzugefügt */}
                      <input 
                        type="text" 
                        placeholder="kg"
                        className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-lg p-2 text-center font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={set.weight}
                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value)}
                      />

                      {/* Wdh Input */}
                      {/* ÄNDERUNG 3: w-full und min-w-0 hinzugefügt */}
                      <input 
                        type="text" 
                        placeholder="10-12"
                        className="w-full min-w-0 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-lg p-2 text-center font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value)}
                      />

                      {/* Löschen */}
                      <button 
                        onClick={() => handleDeleteSet(exIndex, setIndex)}
                        className="flex justify-center text-slate-300 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Satz hinzufügen Button */}
                <button 
                  onClick={() => handleAddSet(exIndex)}
                  className="mt-4 w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-orange-500 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Satz hinzufügen
                </button>

              </div>
            ))}

            <button 
              onClick={() => setIsExModalOpen(true)}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 dark:shadow-none flex justify-center items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Neue Übung
            </button>
          </div>
        )}

        {/* --- MODAL: PLAN ERSTELLEN --- */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Neuer Trainingsplan</h3>
                <form onSubmit={handleAddPlan}>
                  <input 
                    autoFocus
                    placeholder="z.B. Push 1"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:text-white border dark:border-slate-700 rounded-xl mb-4 outline-none focus:border-orange-500"
                    value={newPlanName}
                    onChange={e => setNewPlanName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold">Abbrechen</button>
                    <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold">Erstellen</button>
                  </div>
                </form>
             </div>
          </div>
        )}

        {/* --- MODAL: ÜBUNG HINZUFÜGEN --- */}
        {isExModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Neue Übung hinzufügen</h3>
                <form onSubmit={handleAddExercise}>
                  <input 
                    autoFocus
                    placeholder="z.B. Bankdrücken"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 dark:text-white border dark:border-slate-700 rounded-xl mb-4 outline-none focus:border-orange-500"
                    value={newExName}
                    onChange={e => setNewExName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsExModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold">Abbrechen</button>
                    <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold">Hinzufügen</button>
                  </div>
                </form>
             </div>
          </div>
        )}

    </div>
  );    
};

// Kleines Hilfs-Icon für X (fehlte oben im Import manchmal)
const X = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
)

export default WorkoutView;