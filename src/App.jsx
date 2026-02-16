import React, { useState, useEffect } from 'react';
// Importiere alle 3 Views
import SupplementView from './SupplementView';
import WorkoutView from './WorkoutView'; 
import RoutineView from './RoutineView'; // <--- NEU

// Icons
import { Pill, Dumbbell, ListTodo } from 'lucide-react'; // <--- ListTodo importieren

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Tab State: 'supps', 'workout', 'routine'
  const [activeTab, setActiveTab] = useState('supps');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans">
      
      {/* INHALT BEREICH */}
      <main className="pb-24">
        {activeTab === 'supps' && (
          <SupplementView darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}
        
        {activeTab === 'workout' && (
          <WorkoutView darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}

        {/* NEUER TAB */}
        {activeTab === 'routine' && (
          <RoutineView darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}
      </main>

      {/* FOOTER NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          
          {/* 1. SUPPS (Blau) */}
          <button 
            onClick={() => setActiveTab('supps')}
            className={`flex flex-col items-center gap-1 transition-all w-20
              ${activeTab === 'supps' 
                ? 'text-blue-500 dark:text-blue-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
          >
            <Pill className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Supps</span>
          </button>

          {/* 2. ROUTINE (Lila - NEU in der Mitte oder rechts, wie du magst) */}
          <button 
            onClick={() => setActiveTab('routine')}
            className={`flex flex-col items-center gap-1 transition-all w-20
              ${activeTab === 'routine' 
                ? 'text-purple-500 dark:text-purple-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
          >
            <ListTodo className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Routine</span>
          </button>

          {/* 3. TRAINING (Orange) */}
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center gap-1 transition-all w-20
              ${activeTab === 'workout' 
                ? 'text-orange-500 dark:text-orange-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Gym</span>
          </button>

        </div>
        <div className="h-4 w-full"></div> 
      </div>

    </div>
  );
}

export default App;