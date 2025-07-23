import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Home, CheckSquare, FileText, Settings, Lock, User, Sun, Moon, LogOut, PlusSquare, 
    Trash2, BookOpen, AlarmClock, X, Folder, Wallet, ArrowUpCircle, ArrowDownCircle, 
    AlertTriangle, UploadCloud, File as FileIcon, Image as ImageIcon, Download, Cloud, 
    CloudOff, KeyRound, Fingerprint, Shield, MoreVertical, Edit, Move, FolderPlus, 
    FilePlus, ChevronRight, Lightbulb, Copy, Archive, ChevronsLeft, Bell, Gift, 
    Heart, Star, List, Grid, Share2, FolderOpen, Plus, Upload, MoreHorizontal
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// --- YOUR FIREBASE CONFIGURATION ---
// IMPORTANT: For production, use environment variables to store this information.
const firebaseConfig = {
  apiKey: "AIzaSyDe98BYnCw5a7zA4q3SdDqeuk1t_4yQrYo",
  authDomain: "onlyme-app.firebaseapp.com",
  projectId: "onlyme-app",
  storageBucket: "onlyme-app.firebasestorage.app",
  messagingSenderId: "1006677834276",
  appId: "1:1006677834276:web:85011270650a83b7b876b1"
};
// --- END OF FIREBASE CONFIG ---


// --- FAKE CRYPTO-JS LIBRARY (FOR DEMO PURPOSES) ---
// CRITICAL: For a real application, you MUST replace this with the actual 'crypto-js' library.
// This implementation is NOT secure and does NOT provide real encryption.
const CryptoJS = {
  AES: {
    encrypt: (data, key) => `encrypted_${JSON.stringify(data)}_with_${key}`,
    decrypt: (ciphertext, key) => {
      try {
        if (!ciphertext.startsWith('encrypted_')) throw new Error("Invalid ciphertext");
        const parts = ciphertext.replace('encrypted_', '').split('_with_');
        if (parts.length < 2 || parts[1] !== key) throw new Error("Invalid key or malformed data");
        return {
          toString: (enc) => JSON.parse(parts[0])
        };
      } catch (e) {
        console.error("Decryption failed:", e.message);
        throw new Error("Decryption failed. The password may be incorrect or the data corrupted.");
      }
    },
  },
  enc: {
    Utf8: 'utf8'
  },
  PBKDF2: (password, salt, options) => {
    const str = `derived_key_from_${password}_and_${salt}`;
    return {
      toString: () => str
    };
  },
  lib: { WordArray: { random: (len) => `salt_${Math.random()}` } }
};
// --- END OF FAKE LIBRARY ---


// --- Initialize Firebase ---
const isFirebaseConfigured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
let app, auth, db;
if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}


// --- UI COMPONENTS ---

const Icon = ({ name, ...props }) => {
  const LucideIcon = { 
      home: Home, checksquare: CheckSquare, filetext: FileText, settings: Settings, 
      user: User, sun: Sun, moon: Moon, logout: LogOut, plussquare: PlusSquare, 
      trash2: Trash2, bookopen: BookOpen, alarmclock: AlarmClock, x: X, folder: Folder, 
      wallet: Wallet, arrowupcircle: ArrowUpCircle, arrowdowncircle: ArrowDownCircle, 
      alerttriangle: AlertTriangle, uploadcloud: UploadCloud, file: FileIcon, 
      image: ImageIcon, download: Download, cloud: Cloud, cloudoff: CloudOff, 
      keyround: KeyRound, fingerprint: Fingerprint, shield: Shield, morevertical: MoreVertical, 
      edit: Edit, move: Move, folderplus: FolderPlus, fileplus: FilePlus, 
      chevronright: ChevronRight, lightbulb: Lightbulb, copy: Copy, archive: Archive, 
      chevronsleft: ChevronsLeft, bell: Bell, gift: Gift, heart: Heart, star: Star,
      list: List, grid: Grid, share2: Share2, folderopen: FolderOpen, plus: Plus,
      upload: Upload, morehorizontal: MoreHorizontal
  }[name.toLowerCase()];
  if (!LucideIcon) return null;
  return <LucideIcon {...props} />;
};

const Sidebar = ({ currentPage, setCurrentPage, onLogout, syncStatus, isGuest }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'tasks', label: 'To-Do List', icon: 'checksquare' },
    { id: 'reminders', label: 'Reminders', icon: 'bell' },
    { id: 'notes', label: 'Notes', icon: 'filetext' },
    { id: 'diary', label: 'Diary', icon: 'bookopen' },
    { id: 'ideas', label: 'Ideas', icon: 'lightbulb' },
    { id: 'alarms', label: 'Alarms', icon: 'alarmclock' },
    { id: 'files', label: 'Files', icon: 'folder' },
    { id: 'expenses', label: 'Expense Tracker', icon: 'wallet' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="w-16 md:w-64 bg-gray-900 text-white flex flex-col transition-all duration-300">
      <div className="h-20 flex-shrink-0 flex items-center justify-center md:justify-start md:pl-6 border-b border-gray-700">
        <Lock className="h-8 w-8 text-indigo-400" />
        <span className="hidden md:block ml-3 text-2xl font-bold tracking-wider">OnlyMe</span>
      </div>
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul>
          {navItems.map(item => (
            <li key={item.id} className="px-2 md:px-4">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }} className={`flex items-center justify-center md:justify-start p-3 my-1 rounded-lg transition-colors ${currentPage === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                <Icon name={item.icon} className="h-6 w-6" />
                <span className="hidden md:block ml-4">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-2 md:p-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center md:justify-start p-3 text-sm text-gray-500">
              {isGuest ? (
                  <>
                    <User className="h-5 w-5 mr-2 text-amber-400" />
                    <span className="hidden md:block">Guest Mode</span>
                  </>
              ) : (
                  <>
                    <Icon name={syncStatus === 'synced' ? 'cloud' : 'cloudoff'} className={`h-5 w-5 mr-2 ${syncStatus === 'synced' ? 'text-green-400' : 'text-yellow-400'}`} />
                    <span className="hidden md:block">Status: {syncStatus}</span>
                  </>
              )}
          </div>
        <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="flex items-center justify-center md:justify-start p-3 rounded-lg transition-colors text-gray-400 hover:bg-red-600 hover:text-white">
          <Icon name="logout" className="h-6 w-6" />
          <span className="hidden md:block ml-4">Lock App</span>
        </a>
      </div>
    </aside>
  );
};

const Header = ({ title, userName, onThemeToggle, theme }) => (
  <header className="h-20 bg-gray-800 text-white flex items-center justify-between px-6 border-b border-gray-700">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <div className="flex items-center space-x-4">
      <button onClick={onThemeToggle} className="p-2 rounded-full hover:bg-gray-700">
        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>
      <div className="flex items-center">
        <span className="hidden sm:block mr-3">Welcome, {userName}</span>
        <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
          {userName ? userName.charAt(0).toUpperCase() : '?'}
        </div>
      </div>
    </div>
  </header>
);

// --- PAGE COMPONENTS ---

function DashboardPage({ data }) {
    const taskCount = data.tasks?.length || 0;
    const { totalBalance } = useMemo(() => { const transactions = data.transactions || []; const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); return { totalBalance: income - expense }; }, [data.transactions]);
    const today = new Date();
    
    const upcomingReminders = useMemo(() => {
        return (data.reminders || []).filter(r => {
            const [month, day] = r.date.split('-').map(Number);
            let reminderDate = new Date(today.getFullYear(), month - 1, day);
            if (reminderDate < today) {
                reminderDate.setFullYear(today.getFullYear() + 1);
            }
            const diff = (reminderDate - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 30;
        }).length;
    }, [data.reminders]);

    return (<div className="p-6"><h2 className="text-3xl font-bold mb-6">Your Personal Dashboard</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-xl font-semibold text-indigo-400 mb-2">Tasks</h3><p className="text-4xl font-bold">{taskCount}</p><p className="text-gray-400">tasks pending</p></div><div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-xl font-semibold text-indigo-400 mb-2">Upcoming Reminders</h3><p className="text-4xl font-bold">{upcomingReminders}</p><p className="text-gray-400">in next 30 days</p></div><div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-xl font-semibold text-indigo-400 mb-2">Total Balance</h3><p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${totalBalance.toFixed(2)}</p><p className="text-gray-400">across all accounts</p></div></div></div>);
}

function TasksPage({ data, setData }) {
    const [newTask, setNewTask] = useState('');
    const handleAddTask = (e) => { e.preventDefault(); if (newTask.trim() === '') return; const newTaskObject = { id: Date.now(), text: newTask.trim(), completed: false }; setData({ ...data, tasks: [...(data.tasks || []), newTaskObject] }); setNewTask(''); };
    const toggleTask = (id) => { const updatedTasks = data.tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task); setData({ ...data, tasks: updatedTasks }); };
    const deleteTask = (id) => { setData({ ...data, tasks: data.tasks.filter(task => task.id !== id) }); };
    return (<div className="p-6"><h2 className="text-3xl font-bold mb-6">To-Do List</h2><div className="bg-gray-800 p-6 rounded-lg"><form onSubmit={handleAddTask} className="flex items-center mb-6"><input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task..." className="flex-grow bg-gray-700 border-2 border-gray-600 rounded-l-lg p-3 focus:outline-none focus:border-indigo-500" /><button type="submit" className="bg-indigo-600 text-white p-3 rounded-r-lg hover:bg-indigo-700">Add Task</button></form><ul className="space-y-3">{data.tasks && data.tasks.map(task => (<li key={task.id} className="flex items-center bg-gray-700 p-3 rounded-lg"><input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-6 w-6 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600" /><span className={`flex-grow ml-4 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.text}</span><button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">Delete</button></li>))}{(!data.tasks || data.tasks.length === 0) && <p className="text-center text-gray-500 mt-4">No tasks yet. Add one above!</p>}</ul></div></div>);
}

function NotesPage({ data, setData }) {
    const [activeNoteId, setActiveNoteId] = useState(null);
    useEffect(() => { if (!activeNoteId && data.notes && data.notes.length > 0) { setActiveNoteId(data.notes[0].id); } }, [data.notes, activeNoteId]);
    const activeNote = useMemo(() => data.notes?.find(note => note.id === activeNoteId), [data.notes, activeNoteId]);
    const handleAddNote = () => { const newNote = { id: Date.now(), title: "New Note", content: "", createdAt: new Date().toISOString() }; const updatedNotes = [newNote, ...(data.notes || [])]; setData({ ...data, notes: updatedNotes }); setActiveNoteId(newNote.id); };
    const handleDeleteNote = (idToDelete) => { const updatedNotes = data.notes.filter(note => note.id !== idToDelete); setData({ ...data, notes: updatedNotes }); if (activeNoteId === idToDelete) { setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null); } };
    const handleUpdateNote = (field, value) => { const updatedNotes = data.notes.map(note => note.id === activeNoteId ? { ...note, [field]: value } : note); setData({ ...data, notes: updatedNotes }); };
    return (<div className="flex h-full"><div className="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col"><div className="p-4 border-b border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold">All Notes</h2><button onClick={handleAddNote} className="p-2 text-indigo-400 hover:bg-gray-700 rounded-lg"><PlusSquare size={24} /></button></div><div className="flex-1 overflow-y-auto">{data.notes && data.notes.map(note => (<div key={note.id} onClick={() => setActiveNoteId(note.id)} className={`p-4 cursor-pointer border-l-4 ${activeNoteId === note.id ? 'bg-gray-700 border-indigo-500' : 'border-transparent hover:bg-gray-700/50'}`}><h3 className="font-semibold truncate">{note.title}</h3><p className="text-sm text-gray-400 truncate">{note.content || "No content"}</p></div>))}{(!data.notes || data.notes.length === 0) && (<p className="text-center text-gray-500 p-6">No notes yet. Create one!</p>)}</div></div><div className="w-2/3 flex flex-col">{activeNote ? (<><div className="p-4 border-b border-gray-700 flex justify-between items-center"><input type="text" value={activeNote.title} onChange={(e) => handleUpdateNote('title', e.target.value)} className="text-2xl font-bold bg-transparent w-full focus:outline-none" placeholder="Note Title" /><button onClick={() => handleDeleteNote(activeNote.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 size={20} /></button></div><textarea value={activeNote.content} onChange={(e) => handleUpdateNote('content', e.target.value)} className="flex-1 p-6 bg-gray-800/50 text-lg focus:outline-none resize-none" placeholder="Start writing your note here..." /></>) : (<div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a note to view or create a new one.</p></div>)}</div></div>);
}

function DiaryPage({ data, setData }) {
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const moods = ['😊', '😄', '😐', '😢', '😠', '😎', '🔥'];
    const sortedEntries = useMemo(() => (data.diary || []).sort((a, b) => new Date(b.date) - new Date(a.date)), [data.diary]);
    const selectedEntry = useMemo(() => sortedEntries.find(entry => entry.id === selectedEntryId), [sortedEntries, selectedEntryId]);
    const handleAddEntry = () => { const today = new Date().toISOString().split('T')[0]; if (sortedEntries.find(e => e.date === today)) { console.warn("An entry for today already exists."); return; } const newEntry = { id: Date.now(), date: today, title: "Today's Entry", content: "", mood: '😊' }; setData({ ...data, diary: [newEntry, ...(data.diary || [])] }); setSelectedEntryId(newEntry.id); };
    const handleUpdateEntry = (field, value) => { const updatedEntries = data.diary.map(entry => entry.id === selectedEntryId ? { ...entry, [field]: value } : entry); setData({ ...data, diary: updatedEntries }); };
    const handleDeleteEntry = (idToDelete) => { const updatedEntries = data.diary.filter(entry => entry.id !== idToDelete); setData({ ...data, diary: updatedEntries }); if (selectedEntryId === idToDelete) { setSelectedEntryId(null); } };
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    return (<div className="flex h-full"><div className="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col"><div className="p-4 border-b border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold">My Diary</h2><button onClick={handleAddEntry} className="p-2 text-indigo-400 hover:bg-gray-700 rounded-lg" title="Add Today's Entry"><PlusSquare size={24} /></button></div><div className="flex-1 overflow-y-auto">{sortedEntries.map(entry => (<div key={entry.id} onClick={() => setSelectedEntryId(entry.id)} className={`p-4 cursor-pointer border-l-4 flex justify-between items-center ${selectedEntryId === entry.id ? 'bg-gray-700 border-indigo-500' : 'border-transparent hover:bg-gray-700/50'}`}><div><h3 className="font-semibold">{formatDate(entry.date)}</h3><p className="text-sm text-gray-400 truncate">{entry.title}</p></div><span className="text-2xl">{entry.mood}</span></div>))}{sortedEntries.length === 0 && <p className="text-center text-gray-500 p-6">No diary entries yet.</p>}</div></div><div className="w-2/3 flex flex-col">{selectedEntry ? (<><div className="p-4 border-b border-gray-700"><div className="flex justify-between items-start"><div><p className="text-lg font-semibold text-indigo-400">{formatDate(selectedEntry.date)}</p><input type="text" value={selectedEntry.title} onChange={(e) => handleUpdateEntry('title', e.target.value)} className="text-2xl font-bold bg-transparent w-full focus:outline-none mt-1" placeholder="Entry Title" /></div><button onClick={() => handleDeleteEntry(selectedEntry.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-lg flex-shrink-0 ml-4"><Trash2 size={20} /></button></div><div className="mt-4"><p className="text-sm text-gray-400 mb-2">How are you feeling?</p><div className="flex space-x-2">{moods.map(mood => (<button key={mood} onClick={() => handleUpdateEntry('mood', mood)} className={`p-2 rounded-full text-2xl transition-transform duration-200 ${selectedEntry.mood === mood ? 'bg-indigo-600 scale-110' : 'hover:bg-gray-700'}`}>{mood}</button>))}</div></div></div><textarea value={selectedEntry.content} onChange={(e) => handleUpdateEntry('content', e.target.value)} className="flex-1 p-6 bg-gray-800/50 text-lg focus:outline-none resize-none" placeholder="Write about your day..." /></>) : (<div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a diary entry to view or create a new one.</p></div>)}</div></div>);
}

function AlarmsPage({ data, setData }) {
    const [newAlarmTime, setNewAlarmTime] = useState('08:00');
    const [newAlarmLabel, setNewAlarmLabel] = useState('');
    const handleAddAlarm = (e) => { e.preventDefault(); if (!newAlarmTime) return; const newAlarm = { id: Date.now(), time: newAlarmTime, label: newAlarmLabel || 'Alarm', isEnabled: true }; setData({ ...data, alarms: [...(data.alarms || []), newAlarm] }); setNewAlarmLabel(''); };
    const toggleAlarm = (id) => { const updatedAlarms = data.alarms.map(alarm => alarm.id === id ? { ...alarm, isEnabled: !alarm.isEnabled } : alarm); setData({ ...data, alarms: updatedAlarms }); };
    const deleteAlarm = (id) => { setData({ ...data, alarms: data.alarms.filter(alarm => alarm.id !== id) }); };
    const formatTime = (time24) => { if (!time24) return ''; const [hours, minutes] = time24.split(':'); const h = parseInt(hours, 10); const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`; };
    return (<div className="p-6"><h2 className="text-3xl font-bold mb-6">Alarms</h2><div className="bg-gray-800 p-6 rounded-lg mb-6"><form onSubmit={handleAddAlarm} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div><label className="block text-sm font-medium text-gray-400 mb-1">Time</label><input type="time" value={newAlarmTime} onChange={(e) => setNewAlarmTime(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500" /></div><div><label className="block text-sm font-medium text-gray-400 mb-1">Label</label><input type="text" value={newAlarmLabel} onChange={(e) => setNewAlarmLabel(e.target.value)} placeholder="e.g., Wake up" className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500" /></div><button type="submit" className="bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700 h-full">Add Alarm</button></form></div><div className="space-y-4">{(data.alarms || []).map(alarm => (<div key={alarm.id} className="flex items-center bg-gray-800 p-4 rounded-lg"><div className="flex-grow"><p className={`text-3xl font-bold ${alarm.isEnabled ? 'text-white' : 'text-gray-500'}`}>{formatTime(alarm.time)}</p><p className={`text-sm ${alarm.isEnabled ? 'text-gray-300' : 'text-gray-600'}`}>{alarm.label}</p></div><div className="flex items-center space-x-4"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={alarm.isEnabled} onChange={() => toggleAlarm(alarm.id)} className="sr-only peer" /><div className="w-14 h-8 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div></label><button onClick={() => deleteAlarm(alarm.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 size={20} /></button></div></div>))}{(!data.alarms || data.alarms.length === 0) && <p className="text-center text-gray-500 mt-4">No alarms set.</p>}</div></div>);
}

function ExpenseTrackerPage({ data, setData }) {
    const [formState, setFormState] = useState({ description: '', amount: '', type: 'expense', source: 'online', category: '' });
    const [filter, setFilter] = useState('all');
    const { onlineBalance, walletBalance, totalBalance } = useMemo(() => { const transactions = data.transactions || []; let online = 0, wallet = 0; transactions.forEach(t => { if (t.type === 'income') { if (t.source === 'online') online += t.amount; else wallet += t.amount; } else { if (t.source === 'online') online -= t.amount; else wallet -= t.amount; } }); return { onlineBalance: online, walletBalance: wallet, totalBalance: online + wallet }; }, [data.transactions]);
    const filteredTransactions = useMemo(() => { const sorted = (data.transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date)); if (filter === 'all') return sorted; return sorted.filter(t => t.source === filter); }, [data.transactions, filter]);
    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleAddTransaction = (e) => { 
        e.preventDefault(); 
        const numAmount = parseFloat(formState.amount); 
        if (formState.description.trim() === '' || isNaN(numAmount) || numAmount <= 0) return; 
        const newTransaction = { 
            id: Date.now(), 
            description: formState.description.trim(), 
            amount: numAmount, 
            type: formState.type, 
            source: formState.source, 
            category: formState.category.trim() || 'General', 
            date: new Date().toISOString(), 
        }; 
        setData({ ...data, transactions: [newTransaction, ...(data.transactions || [])] }); 
        setFormState({ description: '', amount: '', type: 'expense', source: 'online', category: '' }); 
    };
    const deleteTransaction = (id) => { setData({ ...data, transactions: data.transactions.filter(t => t.id !== id) }); };
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
    return (<div className="p-6"><h2 className="text-3xl font-bold mb-6">Expense Tracker</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-cyan-400">Online Balance</h3><p className="text-2xl font-semibold">${onlineBalance.toFixed(2)}</p></div><div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-amber-400 flex items-center">Wallet Balance {walletBalance < 50 && <AlertTriangle size={16} className="ml-2 text-red-400" title="Wallet is low!" />}</h3><p className="text-2xl font-semibold">${walletBalance.toFixed(2)}</p></div><div className="bg-gray-800 p-4 rounded-lg border-2 border-indigo-500"><h3 className="text-sm font-medium text-indigo-400">Total Balance</h3><p className={`text-2xl font-semibold ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>${totalBalance.toFixed(2)}</p></div></div><div className="bg-gray-800 p-6 rounded-lg mb-6"><h3 className="text-xl font-bold mb-4">Add New Transaction</h3><form onSubmit={handleAddTransaction} className="space-y-4"><div className="flex space-x-4"><button type="button" onClick={() => setFormState(s => ({...s, type: 'expense'}))} className={`flex-1 p-3 rounded-lg font-bold ${formState.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-700'}`}>Expense</button><button type="button" onClick={() => setFormState(s => ({...s, type: 'income'}))} className={`flex-1 p-3 rounded-lg font-bold ${formState.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}>Income</button></div><div><label className="block text-sm font-medium text-gray-400 mb-1">Description</label><input type="text" name="description" value={formState.description} onChange={handleInputChange} placeholder={formState.type === 'expense' ? "e.g., Dinner with friends" : "e.g., Monthly salary"} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label><input type="number" name="amount" value={formState.amount} onChange={handleInputChange} placeholder="0.00" required min="0.01" step="0.01" className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" /></div><div><label className="block text-sm font-medium text-gray-400 mb-1">{formState.type === 'expense' ? 'Pay From' : 'Add To'}</label><select name="source" value={formState.source} onChange={handleInputChange} className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500 h-[44px]"><option value="online">Online</option><option value="wallet">Wallet</option></select></div></div><div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                <input 
                    type="text" 
                    name="category" 
                    value={formState.category} 
                    onChange={handleInputChange} 
                    placeholder="e.g., Food, Salary, Shopping" 
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                />
            </div></div><button type="submit" className="w-full bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700 transition-colors">Add Transaction</button></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg-col-span-2"><h3 className="text-xl font-bold mb-4">Transaction History</h3><div className="flex space-x-2 mb-4"><button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>All</button><button onClick={() => setFilter('online')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'online' ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>Online</button><button onClick={() => setFilter('wallet')} className={`px-4 py-2 rounded-lg text-sm ${filter === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>Wallet</button></div><div className="space-y-3">{filteredTransactions.map(t => (<div key={t.id} className="flex items-center bg-gray-800 p-3 rounded-lg"><div className={`mr-3 p-2 rounded-full ${t.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>{t.type === 'income' ? <ArrowUpCircle className="text-green-400" /> : <ArrowDownCircle className="text-red-400" />}</div><div className="flex-grow"><p className="font-semibold">{t.description}</p><p className="text-sm text-gray-400">{formatDate(t.date)} - <span className={t.source === 'online' ? 'text-cyan-400' : 'text-amber-400'}>{t.source}</span></p></div><p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</p><button onClick={() => deleteTransaction(t.id)} className="ml-4 p-2 text-gray-500 hover:text-red-400 rounded-lg"><Trash2 size={18} /></button></div>))}{filteredTransactions.length === 0 && <p className="text-center text-gray-500 mt-4">No transactions for this filter.</p>}</div></div><div className="space-y-6"><div><h3 className="text-xl font-bold mb-4">Monthly Breakdown</h3><div className="bg-gray-800 p-6 rounded-lg text-center text-gray-500">Chart coming soon</div></div><div><h3 className="text-xl font-bold mb-4">Spending by Category</h3><div className="bg-gray-800 p-6 rounded-lg text-center text-gray-500">Breakdown coming soon</div></div></div></div></div>);
}

// --- IdeasPage and its sub-components ---
function IdeaEditor({ idea, updateIdeaPage, goBack }) {
    const [newItemText, setNewItemText] = useState('');

    const handleChecklistChange = (itemId, field, value) => {
        const updatedChecklist = idea.checklist.map(item => item.id === itemId ? { ...item, [field]: value } : item);
        updateIdeaPage('checklist', updatedChecklist);
    };
    const addChecklistItem = () => {
        if (newItemText.trim() === '') return;
        const newItem = { id: Date.now(), text: newItemText.trim(), completed: false };
        updateIdeaPage('checklist', [...idea.checklist, newItem]);
        setNewItemText('');
    };
    const deleteChecklistItem = (itemId) => {
        updateIdeaPage('checklist', idea.checklist.filter(item => item.id !== itemId));
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center mb-4">
                <button onClick={goBack} className="p-2 mr-2 rounded-full hover:bg-gray-700"><ChevronsLeft /></button>
                <input type="text" value={idea.name} onChange={(e) => updateIdeaPage('name', e.target.value)} className="text-3xl font-bold bg-transparent w-full focus:outline-none" />
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg h-full flex flex-col">
                         <h3 className="text-lg font-semibold mb-2 text-indigo-400">Notes</h3>
                         <textarea value={idea.content} onChange={e => updateIdeaPage('content', e.target.value)} placeholder="Jot down your ideas..." className="w-full flex-1 bg-transparent resize-none focus:outline-none"></textarea>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-indigo-400">Action Steps</h3>
                        <div className="space-y-2">
                            {idea.checklist.map(item => (
                                <div key={item.id} className="flex items-center">
                                    <input type="checkbox" checked={item.completed} onChange={e => handleChecklistChange(item.id, 'completed', e.target.checked)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600" />
                                    <input type="text" value={item.text} onChange={e => handleChecklistChange(item.id, 'text', e.target.value)} className={`flex-1 ml-3 bg-transparent focus:outline-none ${item.completed ? 'line-through text-gray-500' : ''}`} />
                                    <button onClick={() => deleteChecklistItem(item.id)}><Trash2 size={16} className="text-gray-500 hover:text-red-400" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex mt-2">
                            <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChecklistItem()} placeholder="New action step..." className="flex-1 bg-gray-700 p-1 rounded-l text-sm" />
                            <button onClick={addChecklistItem} className="bg-indigo-600 p-1 rounded-r text-sm">Add</button>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-indigo-400">Attachments</h3>
                        <p className="text-sm text-center text-gray-500">Attachment feature coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
function AddItemModal({ type, onAdd, onCancel }) {
    const [name, setName] = useState('');
    const title = type === 'addFolder' ? 'New Folder' : 'New Idea Page';
    const placeholder = type === 'addFolder' ? 'Folder Name' : 'Idea Name';
    const handleSubmit = (e) => { e.preventDefault(); if(name.trim()) onAdd(name.trim()); };
    return (<form onSubmit={handleSubmit}> <h3 className="text-xl font-bold mb-4">{title}</h3> <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} className="w-full bg-gray-700 p-2 rounded" autoFocus /> <div className="flex justify-end space-x-2 mt-4"><button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-600">Cancel</button><button type="submit" className="px-4 py-2 rounded bg-indigo-600">Create</button></div> </form>);
}
function RenameModal({ item, onRename, onCancel }) {
    const [name, setName] = useState(item.name);
    const handleSubmit = (e) => { e.preventDefault(); if(name.trim()) onRename(item.id, name.trim()); };
    return (<form onSubmit={handleSubmit}> <h3 className="text-xl font-bold mb-4">Rename {item.type}</h3> <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 p-2 rounded" autoFocus /> <div className="flex justify-end space-x-2 mt-4"><button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-600">Cancel</button><button type="submit" className="px-4 py-2 rounded bg-indigo-600">Save</button></div> </form>);
}
function MoveModal({ item, allItems, onMove, onCancel }) {
    const [targetId, setTargetId] = useState(item.parentId || 'root');
    const renderFolders = (parentId, depth = 0) => {
        return allItems
            .filter(f => f.parentId === parentId && f.type === 'folder' && f.id !== item.id)
            .map(folder => (
                <React.Fragment key={folder.id}>
                    <option value={folder.id} style={{ paddingLeft: `${depth * 20}px` }}>{folder.name}</option>
                    {renderFolders(folder.id, depth + 1)}
                </React.Fragment>
            ));
    };
    return (<> <h3 className="text-xl font-bold mb-4">Move '{item.name}'</h3> <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-gray-700 p-2 rounded"> <option value="root">Ideas Home</option> {renderFolders('root')} </select> <div className="flex justify-end space-x-2 mt-4"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-600">Cancel</button><button onClick={() => onMove(item.id, targetId)} className="px-4 py-2 rounded bg-indigo-600">Move</button></div> </>);
}
function IdeasPage({ data, setData }) {
    const [view, setView] = useState({ type: 'list', id: 'root' }); // type: 'list' or 'editor', id: folderId or ideaId
    const [draggedItem, setDraggedItem] = useState(null);
    const [actionMenu, setActionMenu] = useState(null);
    const [modal, setModal] = useState(null);
    const [fabOpen, setFabOpen] = useState(false);

    const { currentItems, breadcrumbs, allIdeas } = useMemo(() => {
        const ideas = data.ideas || [];
        const currentFolderId = view.type === 'list' ? view.id : ideas.find(i => i.id === view.id)?.parentId || 'root';
        const currentItems = ideas.filter(item => item.parentId === currentFolderId && !item.isArchived);
        
        let path = [];
        let currentId = currentFolderId;
        while (currentId !== 'root') {
            const folder = ideas.find(f => f.id === currentId);
            if (folder) { path.unshift(folder); currentId = folder.parentId; } 
            else break;
        }
        path.unshift({ id: 'root', name: 'Ideas Home' });

        return { currentItems, breadcrumbs: path, allIdeas: ideas };
    }, [data.ideas, view]);
    
    const currentIdea = useMemo(() => {
        if (view.type !== 'editor') return null;
        return allIdeas.find(i => i.id === view.id);
    }, [allIdeas, view]);

    const updateAllIdeas = (newIdeas) => {
        setData(prev => ({ ...prev, ideas: newIdeas }));
    };

    const handleItemDrop = (e, targetFolderId) => {
        e.preventDefault(); e.stopPropagation();
        if (!draggedItem || draggedItem.id === targetFolderId) return;
        const updatedIdeas = allIdeas.map(item => item.id === draggedItem.id ? { ...item, parentId: targetFolderId } : item);
        updateAllIdeas(updatedIdeas);
        setDraggedItem(null);
    };

    const handleAddFolder = (name) => {
        const newFolder = { id: Date.now(), name, type: 'folder', parentId: view.id, dateAdded: new Date().toISOString() };
        updateAllIdeas([...allIdeas, newFolder]);
        setModal(null);
    };

    const handleAddIdea = (name) => {
        const newIdea = { id: Date.now(), name, type: 'idea', parentId: view.id, dateAdded: new Date().toISOString(), content: '', checklist: [], attachments: [] };
        updateAllIdeas([...allIdeas, newIdea]);
        setView({ type: 'editor', id: newIdea.id });
        setModal(null);
    };
    
    const handleDelete = (itemId) => {
        const itemsToDelete = new Set([itemId]);
        const findChildren = (parentId) => {
            allIdeas.forEach(item => {
                if (item.parentId === parentId) {
                    itemsToDelete.add(item.id);
                    if (item.type === 'folder') findChildren(item.id);
                }
            });
        };
        findChildren(itemId);
        updateAllIdeas(allIdeas.filter(item => !itemsToDelete.has(item.id)));
        setActionMenu(null);
    };

    const handleRename = (itemId, newName) => {
        updateAllIdeas(allIdeas.map(item => item.id === itemId ? { ...item, name: newName } : item));
        setModal(null); setActionMenu(null);
    };
    
    const handleMove = (itemId, newParentId) => {
        updateAllIdeas(allIdeas.map(item => item.id === itemId ? { ...item, parentId: newParentId } : item));
        setModal(null); setActionMenu(null);
    };

    const handleArchive = (itemId) => {
        updateAllIdeas(allIdeas.map(item => item.id === itemId ? { ...item, isArchived: true } : item));
        setActionMenu(null);
    };

    const handleDuplicate = (itemToDup) => {
        const newItem = { ...itemToDup, id: Date.now(), name: `${itemToDup.name} (Copy)`};
        updateAllIdeas([...allIdeas, newItem]);
        setActionMenu(null);
    };

    const updateIdeaPage = (field, value) => {
        if (!currentIdea) return;
        updateAllIdeas(allIdeas.map(i => i.id === currentIdea.id ? { ...i, [field]: value } : i));
    };

    if (view.type === 'editor' && currentIdea) {
        return <IdeaEditor idea={currentIdea} updateIdeaPage={updateIdeaPage} goBack={() => setView({ type: 'list', id: currentIdea.parentId || 'root' })} />;
    }

    return (
        <div className="p-6 h-full flex flex-col relative" onClick={() => setActionMenu(null)}>
            <div className="flex items-center text-gray-400 mb-4 flex-wrap">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        <button onClick={() => setView({ type: 'list', id: crumb.id })} className="hover:text-white hover:underline whitespace-nowrap">{crumb.name}</button>
                        {index < breadcrumbs.length - 1 && <ChevronRight size={20} className="mx-1 flex-shrink-0" />}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto" onDrop={(e) => handleItemDrop(e, view.id)} onDragOver={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentItems.map(item => (
                        <div key={item.id} draggable onDragStart={() => setDraggedItem(item)} onDrop={(e) => item.type === 'folder' && handleItemDrop(e, item.id)} onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }} onDoubleClick={() => setView({ type: item.type === 'folder' ? 'list' : 'editor', id: item.id })} className="relative group flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                            <Icon name={item.type === 'folder' ? 'folder' : 'filetext'} className="h-16 w-16 text-indigo-400" />
                            <p className="text-sm text-center mt-2 truncate w-full">{item.name}</p>
                            <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === item.id ? null : item.id) }} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-600"><MoreVertical size={20} /></button>
                            {actionMenu === item.id && (
                                <div className="absolute top-10 right-2 bg-gray-900 rounded-lg shadow-lg z-10 w-36 text-sm">
                                    <button onClick={() => setModal({ type: 'rename', item })} className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"><Edit size={14} className="mr-2"/> Rename</button>
                                    <button onClick={() => setModal({ type: 'move', item })} className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"><Move size={14} className="mr-2"/> Move</button>
                                    <button onClick={() => handleDuplicate(item)} className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"><Copy size={14} className="mr-2"/> Duplicate</button>
                                    <button onClick={() => handleArchive(item.id)} className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"><Archive size={14} className="mr-2"/> Archive</button>
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button onClick={() => handleDelete(item.id)} className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 flex items-center"><Trash2 size={14} className="mr-2"/> Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                 {currentItems.length === 0 && <div className="text-center py-20 text-gray-500">This folder is empty.</div>}
            </div>
            <div className="absolute bottom-6 right-6 z-10">
                <div className={`flex flex-col items-center space-y-2 mb-2 transition-all duration-300 ${fabOpen ? 'opacity-100' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                    <button onClick={() => { setModal({type: 'addIdea'}); setFabOpen(false); }} className="bg-indigo-500 p-3 rounded-full shadow-lg hover:bg-indigo-600 flex items-center text-sm"><FilePlus size={20} className="mr-0 md:mr-2" /><span className="hidden md:block">Add Idea</span></button>
                    <button onClick={() => { setModal({type: 'addFolder'}); setFabOpen(false); }} className="bg-indigo-500 p-3 rounded-full shadow-lg hover:bg-indigo-600 flex items-center text-sm"><FolderPlus size={20} className="mr-0 md:mr-2" /><span className="hidden md:block">Add Folder</span></button>
                </div>
                <button onClick={() => setFabOpen(!fabOpen)} className={`bg-indigo-600 p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`}><Plus /></button>
            </div>
            {modal && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20" onClick={() => setModal(null)}>
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        {(modal.type === 'addFolder' || modal.type === 'addIdea') && <AddItemModal type={modal.type} onAdd={modal.type === 'addFolder' ? handleAddFolder : handleAddIdea} onCancel={() => setModal(null)} />}
                        {modal.type === 'rename' && <RenameModal item={modal.item} onRename={handleRename} onCancel={() => setModal(null)} />}
                        {modal.type === 'move' && <MoveModal item={modal.item} allItems={allIdeas} onMove={handleMove} onCancel={() => setModal(null)} />}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- FilesPage and its sub-components ---
// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Corrected the syntax error here
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
function FilesPage({ data, setData }) {
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [draggedItem, setDraggedItem] = useState(null);
  const [actionMenu, setActionMenu] = useState({id: null, x: 0, y: 0});
  const [modal, setModal] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const { currentItems, breadcrumbs } = useMemo(() => {
    const files = data.files || [];
    const currentItems = files.filter(item => (item.parentId || 'root') === currentFolderId && !item.isTrash);
    
    let path = [];
    let currentId = currentFolderId;
    while (currentId !== 'root') {
      const folder = files.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId || 'root';
      } else break;
    }
    path.unshift({ id: 'root', name: 'Files' });

    return { currentItems, breadcrumbs: path };
  }, [data.files, currentFolderId]);

  const updateFiles = (newFiles) => {
    setData(prev => ({ ...prev, files: newFiles }));
  };

  const handleItemDrop = (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === targetFolderId) return;
    
    const updatedFiles = (data.files || []).map(item => 
      item.id === draggedItem.id ? { ...item, parentId: targetFolderId } : item
    );
    updateFiles(updatedFiles);
    setDraggedItem(null);
  };

  const handleAddFolder = (name) => {
    const newFolder = { 
      id: Date.now(), 
      name, 
      type: 'folder', 
      parentId: currentFolderId, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateFiles([...(data.files || []), newFolder]);
    setModal(null);
  };

  const handleFileUpload = (file) => {
    const newFile = {
      id: Date.now(),
      name: file.name,
      type: 'file',
      fileType: file.type.startsWith('image/') ? 'image' : 'document',
      parentId: currentFolderId,
      size: file.size,
      url: URL.createObjectURL(file), // In real app, this would be a cloud URL
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateFiles([...(data.files || []), newFile]);
    setModal(null);
  };

  const handleDelete = (itemId) => {
    const updatedFiles = (data.files || []).map(item => 
      item.id === itemId ? { ...item, isTrash: true, parentId: 'trash' } : item
    );
    updateFiles(updatedFiles);
    setActionMenu({id: null, x: 0, y: 0});
    setSelectedFiles(selectedFiles.filter(id => id !== itemId));
  };
  
  const handleBulkDelete = () => {
      const updatedFiles = (data.files || []).map(item => 
        selectedFiles.includes(item.id) ? { ...item, isTrash: true, parentId: 'trash' } : item
      );
      updateFiles(updatedFiles);
      setSelectedFiles([]);
  };

  const handleRename = (itemId, newName) => {
    const updatedFiles = (data.files || []).map(item => 
      item.id === itemId ? { ...item, name: newName, updatedAt: new Date().toISOString() } : item
    );
    updateFiles(updatedFiles);
    setModal(null);
    setActionMenu({id: null, x: 0, y: 0});
  };

  const handleMove = (itemId, newParentId) => {
    const updatedFiles = (data.files || []).map(item => 
      item.id === itemId ? { ...item, parentId: newParentId, updatedAt: new Date().toISOString() } : item
    );
    updateFiles(updatedFiles);
    setModal(null);
    setActionMenu({id: null, x: 0, y: 0});
    setSelectedFiles(selectedFiles.filter(id => id !== itemId));
  };

  const handleShare = (itemId) => {
    setModal({ type: 'share', itemId });
    setActionMenu({id: null, x: 0, y: 0});
  };

  const toggleSelectFile = (itemId) => {
    setSelectedFiles(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const handleContextMenu = (e, item) => {
      e.preventDefault();
      setActionMenu({id: item.id, x: e.clientX, y: e.clientY});
  };
  
  const handleItemClick = (item) => {
      if (selectedFiles.length > 0) {
          toggleSelectFile(item.id);
      } else if (item.type === 'folder') {
          setCurrentFolderId(item.id);
      } else {
          // In a real app, you might open a file previewer here
          console.log("Opening file:", item.name);
      }
  };

  return (
    <div className="p-4 h-full flex flex-col relative" onClick={() => setActionMenu({id: null, x: 0, y: 0})}>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-4 flex-wrap gap-1">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <button 
              onClick={() => setCurrentFolderId(crumb.id)}
              className="hover:text-indigo-400 hover:underline flex items-center"
            >
              {crumb.id === 'root' ? <Folder size={16} className="mr-1" /> : null}
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && <ChevronRight size={16} className="mx-1 text-gray-500" />}
          </React.Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{breadcrumbs[breadcrumbs.length - 1]?.name}</h2>
        <div className="flex items-center space-x-2">
            {selectedFiles.length > 0 && (
                <span className="text-sm text-gray-400">{selectedFiles.length} selected</span>
            )}
            <button 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded hover:bg-gray-700"
                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
            {selectedFiles.length > 0 && (
                <button 
                    onClick={handleBulkDelete}
                    className="p-2 rounded hover:bg-gray-700 text-red-400"
                    title="Delete selected"
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>
      </div>

      {/* Files/Folders Display */}
      <div 
        className="flex-1 overflow-y-auto"
        onDrop={(e) => handleItemDrop(e, currentFolderId)}
        onDragOver={(e) => e.preventDefault()}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedItem(item)}
                onDrop={(e) => item.type === 'folder' && handleItemDrop(e, item.id)}
                onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
                className={`relative group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors
                  ${selectedFiles.includes(item.id) ? 'bg-indigo-900/30' : 'hover:bg-gray-700'}
                  ${actionMenu.id === item.id ? 'bg-gray-700' : ''}`}
              >
                {item.type === 'folder' ? (
                  <Folder size={48} className="text-indigo-400" />
                ) : item.fileType === 'image' ? (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <FileText size={48} className="text-gray-400" />
                )}
                <p className="text-sm text-center mt-2 truncate w-full">{item.name}</p>
                <div className="absolute top-1 right-1">
                  <input 
                    type="checkbox" 
                    checked={selectedFiles.includes(item.id)}
                    onChange={() => toggleSelectFile(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {currentItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedItem(item)}
                onDrop={(e) => item.type === 'folder' && handleItemDrop(e, item.id)}
                onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => item.type === 'folder' && setCurrentFolderId(item.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors
                  ${selectedFiles.includes(item.id) ? 'bg-indigo-900/30' : 'hover:bg-gray-700'}
                  ${actionMenu.id === item.id ? 'bg-gray-700' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedFiles.includes(item.id)}
                  onChange={() => toggleSelectFile(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 mr-3"
                />
                {item.type === 'folder' ? (
                  <Folder size={24} className="text-indigo-400 mr-3" />
                ) : item.fileType === 'image' ? (
                  <div className="w-8 h-8 flex-shrink-0 mr-3">
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <FileText size={24} className="text-gray-400 mr-3" />
                )}
                <div className="flex-grow min-w-0">
                  <p className="truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.type === 'file' ? formatFileSize(item.size) : ''}
                    {item.type === 'file' ? ' • ' : ''}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}
                  className="p-1 rounded-full hover:bg-gray-600 ml-2"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        {currentItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FolderOpen size={48} className="mb-4" />
            <p>This folder is empty</p>
          </div>
        )}
      </div>

      {/* Action Menu */}
      {actionMenu.id && (
        <div 
          className="absolute bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-2 w-48 z-20"
          style={{
            top: `${actionMenu.y}px`,
            left: `${actionMenu.x}px`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              const item = (data.files || []).find(f => f.id === actionMenu.id);
              if (item) setModal({ type: 'rename', item });
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"
          >
            <Edit size={16} className="mr-2" /> Rename
          </button>
          <button 
            onClick={() => {
              const item = (data.files || []).find(f => f.id === actionMenu.id);
              if (item) setModal({ type: 'move', item });
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"
          >
            <Move size={16} className="mr-2" /> Move
          </button>
          <button 
            onClick={() => handleShare(actionMenu.id)}
            className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center"
          >
            <Share2 size={16} className="mr-2" /> Share
          </button>
          <div className="border-t border-gray-700 my-1"></div>
          <button 
            onClick={() => handleDelete(actionMenu.id)}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 flex items-center"
          >
            <Trash2 size={16} className="mr-2" /> Delete
          </button>
        </div>
      )}

      {/* FABs */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className={`flex flex-col items-center space-y-2 mb-2 transition-all duration-300 ${fabOpen ? 'opacity-100' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={() => { setModal({ type: 'upload' }); setFabOpen(false); }} 
            className="bg-indigo-600 p-3 rounded-full shadow-lg hover:bg-indigo-700 flex items-center"
          >
            <Upload size={20} className="mr-0 md:mr-2" />
            <span className="hidden md:block">Upload File</span>
          </button>
          <button 
            onClick={() => { setModal({ type: 'addFolder' }); setFabOpen(false); }} 
            className="bg-indigo-600 p-3 rounded-full shadow-lg hover:bg-indigo-700 flex items-center"
          >
            <FolderPlus size={20} className="mr-0 md:mr-2" />
            <span className="hidden md:block">New Folder</span>
          </button>
        </div>
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`bg-indigo-700 p-4 rounded-full shadow-lg hover:bg-indigo-800 transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30" onClick={() => setModal(null)}>
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            {modal.type === 'addFolder' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddFolder(e.target.elements.folderName.value.trim()); }}>
                <h3 className="text-xl font-bold mb-4">Create New Folder</h3>
                <input 
                  type="text" 
                  name="folderName"
                  placeholder="Folder name" 
                  autoFocus
                  className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Create</button>
                </div>
              </form>
            )}

            {modal.type === 'upload' && (
              <>
                <h3 className="text-xl font-bold mb-4">Upload File</h3>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4">
                  <UploadCloud size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="mb-4">Drag & drop files here or click to browse</p>
                  <input 
                    type="file" 
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => { if (e.target.files.length > 0) handleFileUpload(e.target.files[0]); }}
                  />
                  <label htmlFor="file-upload" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 cursor-pointer">Select File</label>
                </div>
              </>
            )}

            {modal.type === 'rename' && (
              <form onSubmit={(e) => { e.preventDefault(); handleRename(modal.item.id, e.target.elements.itemName.value.trim()); }}>
                <h3 className="text-xl font-bold mb-4">Rename</h3>
                <input 
                  type="text" 
                  name="itemName"
                  defaultValue={modal.item.name}
                  autoFocus
                  className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Rename</button>
                </div>
              </form>
            )}

            {modal.type === 'move' && (
              <MoveModal 
                item={modal.item} 
                allItems={data.files || []} 
                onMove={handleMove} 
                onCancel={() => setModal(null)} 
              />
            )}

            {modal.type === 'share' && (
              <>
                <h3 className="text-xl font-bold mb-4">Share File</h3>
                <div className="bg-gray-700 p-4 rounded mb-4">
                  <p className="text-sm mb-2">Shareable link:</p>
                  <div className="flex">
                    <input 
                      type="text" 
                      readOnly
                      value={`https://onlyme.app/share/${modal.itemId}`}
                      className="flex-grow bg-gray-600 border border-gray-500 rounded-l p-2 text-sm"
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(`https://onlyme.app/share/${modal.itemId}`); }}
                      className="bg-gray-500 px-3 rounded-r text-sm hover:bg-gray-400"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setModal(null)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- RemindersPage ---
function RemindersPage({ data, setData }) {
  const [newReminder, setNewReminder] = useState({ title: '', date: '', category: 'birthday', customCategory: '', notifyDayBefore: true, notifyOnDay: false });
  const [editingId, setEditingId] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const categories = [
    { id: 'birthday', name: 'Birthday', icon: <Gift size={16} className="mr-2" />, color: 'text-pink-500' },
    { id: 'anniversary', name: 'Anniversary', icon: <Heart size={16} className="mr-2" />, color: 'text-red-500' },
    { id: 'holiday', name: 'Holiday', icon: <Sun size={16} className="mr-2" />, color: 'text-yellow-500' },
    { id: 'other', name: 'Other', icon: <Star size={16} className="mr-2" />, color: 'text-indigo-500' }
  ];

  // Corrected logic for handling reminders across year boundaries
  const reminders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentYear = now.getFullYear();
    
    return (data.reminders || []).map(reminder => {
      const [month, day] = reminder.date.split('-').map(Number);
      let reminderDate = new Date(currentYear, month - 1, day);

      if (reminderDate < today) {
        reminderDate.setFullYear(currentYear + 1);
      }
      
      const daysUntil = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...reminder,
        daysUntil: daysUntil,
        isPast: daysUntil < 0,
        monthName: reminderDate.toLocaleString('default', { month: 'short' }),
        day
      };
    }).filter(r => showPast || r.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.reminders, showPast]);

  const groupedReminders = useMemo(() => {
    const groups = {};
    reminders.forEach(reminder => {
      const status = reminder.isPast ? 'Past' : 
                     reminder.daysUntil === 0 ? 'Today' : 
                     reminder.daysUntil === 1 ? 'Tomorrow' : 
                     reminder.daysUntil <= 7 ? 'This Week' : 
                     reminder.daysUntil <= 30 ? 'This Month' : 'Later';
      
      if (!groups[status]) groups[status] = [];
      groups[status].push(reminder);
    });
    return groups;
  }, [reminders]);

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.date) return;
    // Ensure date is always MM-DD
    let date = newReminder.date;
    if (date.startsWith('2024-')) date = date.slice(5);
    const reminder = {
      id: editingId || Date.now(),
      title: newReminder.title,
      date: date,
      category: newReminder.category,
      customLabel: newReminder.category === 'other' ? newReminder.customCategory : '',
      notifyDayBefore: newReminder.notifyDayBefore,
      notifyOnDay: newReminder.notifyOnDay
    };

    const updatedReminders = editingId 
      ? (data.reminders || []).map(r => r.id === editingId ? reminder : r)
      : [...(data.reminders || []), reminder];

    setData({ ...data, reminders: updatedReminders });
    setNewReminder({ title: '', date: '', category: 'birthday', customCategory: '', notifyDayBefore: true, notifyOnDay: false });
    setEditingId(null);
  };

  const handleEdit = (reminder) => {
    setNewReminder({
      title: reminder.title,
      date: reminder.date,
      category: reminder.category,
      customCategory: reminder.customLabel || '',
      notifyDayBefore: reminder.notifyDayBefore,
      notifyOnDay: reminder.notifyOnDay
    });
    setEditingId(reminder.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setData({ ...data, reminders: (data.reminders || []).filter(r => r.id !== id) });
  };

  const getCategoryDetails = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories.find(c => c.id === 'other');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Reminders</h2>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Reminder' : 'Add New Reminder'}</h3>
        <form onSubmit={handleAddReminder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input type="text" value={newReminder.title} onChange={(e) => setNewReminder({...newReminder, title: e.target.value})} placeholder="e.g., Mom's Birthday" required className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-indigo-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={newReminder.date ? `2024-${newReminder.date}` : ''}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-');
                  if(month && day) setNewReminder({...newReminder, date: `${month}-${day}`});
                }}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select value={newReminder.category} onChange={(e) => setNewReminder({...newReminder, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-indigo-500">
                {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
              </select>
            </div>
          </div>
          
          {newReminder.category === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Custom Label</label>
              <input type="text" value={newReminder.customCategory} onChange={(e) => setNewReminder({...newReminder, customCategory: e.target.value})} placeholder="e.g., Pet's Adoption Day" className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-indigo-500" />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Notifications</label>
            <div className="flex items-center">
              <input type="checkbox" id="notifyDayBefore" checked={newReminder.notifyDayBefore} onChange={(e) => setNewReminder({...newReminder, notifyDayBefore: e.target.checked})} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="notifyDayBefore" className="ml-2 text-sm">Remind me 1 day before at 9 AM</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="notifyOnDay" checked={newReminder.notifyOnDay} onChange={(e) => setNewReminder({...newReminder, notifyOnDay: e.target.checked})} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="notifyOnDay" className="ml-2 text-sm">Remind me on the day at 9 AM</label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            {editingId && (
              <button type="button" onClick={() => { setNewReminder({ title: '', date: '', category: 'birthday', customCategory: '', notifyDayBefore: true, notifyOnDay: false }); setEditingId(null); }} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
            )}
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">{editingId ? 'Update Reminder' : 'Add Reminder'}</button>
          </div>
        </form>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Reminders</h3>
        <div className="flex items-center">
          <span className="text-sm mr-2">Show past reminders</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={showPast} onChange={() => setShowPast(!showPast)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
      
      {Object.keys(groupedReminders).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedReminders).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-md font-semibold mb-2 text-indigo-400">{group}</h4>
              <div className="space-y-2">
                {items.map(reminder => {
                  const category = getCategoryDetails(reminder.category);
                  return (
                    <div key={reminder.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${category.color} bg-opacity-20 mr-3`}>{category.icon}</div>
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-gray-400">{reminder.monthName} {reminder.day} • {reminder.category === 'other' && reminder.customLabel ? ` ${reminder.customLabel}` : ` ${category.name}`}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(reminder)} className="p-2 text-gray-400 hover:text-indigo-400" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Bell size={48} className="mx-auto mb-4 text-gray-600" />
          <p>No reminders yet. Add one above!</p>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ data, setData, encryptionKey }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const getEncryptionKey = (pwd, salt) => CryptoJS.PBKDF2(pwd, salt, { keySize: 256 / 32, iterations: 1000 }).toString();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'New passwords do not match.' }); return; }
        if (newPassword.length < 6) { setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' }); return; }
        const user = auth.currentUser;
        if (!user) { setMessage({ type: 'error', text: 'No user is signed in.' }); return; }
        const keyGuess = getEncryptionKey(currentPassword, user.uid);
        if (keyGuess !== encryptionKey) { setMessage({ type: 'error', text: 'Current password is incorrect.' }); return; }
        try {
            await updatePassword(user, newPassword);
            const newKey = getEncryptionKey(newPassword, user.uid);
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), newKey).toString();
            await setDoc(doc(db, "users", user.uid), { encryptedData });
            setMessage({ type: 'success', text: 'Password updated successfully! Please log in again with your new password.' });
            setTimeout(() => signOut(auth), 3000);
        } catch (error) { console.error("Password change error:", error); setMessage({ type: 'error', text: `Failed to change password: ${error.message}` }); }
    };

    return (<div className="p-6"><h2 className="text-3xl font-bold mb-6">Settings</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-xl font-bold mb-4 flex items-center"><Shield className="mr-2 text-indigo-400"/> Security</h3><form onSubmit={handleChangePassword} className="space-y-4"><h4 className="font-semibold text-lg">Change Password</h4><div><label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" /></div><div><label className="block text-sm font-medium text-gray-400 mb-1">New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" /></div><div><label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-2 focus:outline-none focus:border-indigo-500" /></div><button type="submit" className="w-full bg-indigo-600 text-white font-bold p-2 rounded-lg hover:bg-indigo-700">Update Password</button>{message.text && <p className={`text-sm text-center ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message.text}</p>}</form><div className="border-t border-gray-700 my-6"></div><div><h4 className="font-semibold text-lg mb-2 flex items-center"><KeyRound className="mr-2"/> Recovery Key</h4><p className="text-sm text-gray-400 mb-4">If you forget your password, a recovery key is the ONLY way to regain access to your encrypted data.</p><button className="w-full bg-amber-600 text-white font-bold p-2 rounded-lg hover:bg-amber-700">Generate & Save Key</button></div><div className="border-t border-gray-700 my-6"></div><div><h4 className="font-semibold text-lg mb-2 flex items-center"><Fingerprint className="mr-2"/> Biometric Unlock</h4><p className="text-sm text-gray-400 mb-4">Enable unlocking the app with your device's fingerprint or face recognition for quick access.</p><button className="w-full bg-gray-600 text-white font-bold p-2 rounded-lg hover:bg-gray-500">Enable Biometrics</button></div></div><div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-xl font-bold mb-4">General</h3></div></div></div>);
}


// --- LOCK SCREEN COMPONENT ---

const LockScreen = ({ setAppIsLocked, setEncryptionKey, setUserData, setIsGuest }) => {
  const [isSigningUp, setIsSigningUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isFirebaseConfigured) {
    return (<div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4"><div className="w-full max-w-md text-center"><AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" /><h1 className="text-3xl font-bold">Firebase Not Configured</h1><p className="text-gray-400 mt-2">To enable cloud sync, you need to set up a Firebase project and paste your configuration details into the code.</p></div></div>);
  }

  const getEncryptionKey = (pwd, salt) => CryptoJS.PBKDF2(pwd, salt, { keySize: 256 / 32, iterations: 1000 }).toString();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        if (isSigningUp) {
            if (name.trim() === '') throw new Error("Please enter your name.");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const key = getEncryptionKey(password, user.uid);
            setEncryptionKey(key);
            const initialData = { profile: { name: name, email: user.email }, tasks: [], notes: [], diary: [], alarms: [], files: [], transactions: [], ideas: [], reminders: [], settings: { theme: 'dark' } };
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(initialData), key).toString();
            await setDoc(doc(db, "users", user.uid), { encryptedData });
            setUserData(initialData);
            setIsGuest(false);
            setAppIsLocked(false);
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const key = getEncryptionKey(password, user.uid);
            setEncryptionKey(key);
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const encryptedData = docSnap.data().encryptedData;
                try {
                  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
                  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                  setUserData(decryptedData);
                  setSyncStatus('synced');
                } catch (e) {
                  console.error("Decryption error on sync, locking app:", e);
                  signOut(auth);
                }
            } else {
                console.log("No data document found for user, creating one...");
                const defaultName = user.email.split('@')[0];
                const initialData = { profile: { name: defaultName, email: user.email }, tasks: [], notes: [], diary: [], alarms: [], files: [], transactions: [], ideas: [], reminders: [], settings: { theme: 'dark' } };
                const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(initialData), key).toString();
                await setDoc(userDocRef, { encryptedData });
                setUserData(initialData);
                setIsGuest(false);
                setAppIsLocked(false);
            }
        }
    } catch (err) {
        if (err.code === 'auth/configuration-not-found') { setError('Auth not configured. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.');
        } else { setError(err.message.replace('Firebase: ', '')); }
        console.error("Auth error:", err);
    } finally {
        setLoading(false);
    }
  };
  
  const handleGuestMode = () => {
      const guestData = { profile: { name: "Guest" }, tasks: [], notes: [], diary: [], alarms: [], files: [], transactions: [], ideas: [], reminders: [], settings: { theme: 'dark' } };
      setUserData(guestData);
      setIsGuest(true);
      setAppIsLocked(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><Lock className="h-16 w-16 text-indigo-400 mx-auto mb-4" /><h1 className="text-4xl font-bold">OnlyMe</h1><p className="text-gray-400 mt-2">Your private, synced, encrypted life dashboard.</p></div>
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-6">{isSigningUp ? 'Create Your Account' : 'Unlock Your Data'}</h2>
          <form onSubmit={handleAuth}>
            {isSigningUp && (<div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="name">Name</label><input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500" /></div>)}
            <div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500" /></div>
            <div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg p-3 focus:outline-none focus:border-indigo-500" /></div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">{loading ? 'Working...' : (isSigningUp ? 'Create & Encrypt' : 'Unlock')}</button>
          </form>
           <div className="my-4 flex items-center"><div className="flex-grow border-t border-gray-600"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-600"></div></div>
            <button onClick={handleGuestMode} disabled={loading} className="w-full bg-gray-600 text-white font-bold p-3 rounded-lg hover:bg-gray-700 transition-colors">Continue as Guest</button>
          <div className="text-center text-sm text-gray-400 mt-6">
            {!isSigningUp && <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-400 hover:underline">Forgot Password?</a>}
            <span className="mx-2">|</span>
            <button onClick={() => setIsSigningUp(!isSigningUp)} className="text-indigo-400 hover:underline">{isSigningUp ? 'Log In' : 'Sign Up'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [userData, setUserData] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const [syncStatus, setSyncStatus] = useState('offline'); // offline, syncing, synced

  // Handles auth state changes and sets up the real-time listener
  useEffect(() => {
    if (!isFirebaseConfigured || isGuest) {
        setSyncStatus(isGuest ? 'Guest Mode' : 'offline');
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !encryptionKey) {
        setIsLocked(true); setUserData(null); setEncryptionKey(null);
        return;
      }
      const docRef = doc(db, "users", user.uid);
      const unsubSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
              const encryptedData = docSnap.data().encryptedData;
              try {
                  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
                  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                  setUserData(decryptedData);
                  setSyncStatus('synced');
              } catch (e) {
                  console.error("Decryption error on sync, locking app:", e);
                  signOut(auth);
              }
          }
      });
      return () => unsubSnapshot();
    });
    return () => unsubscribe();
  }, [encryptionKey, isGuest]);

  // Writes data back to Firestore when it changes
  useEffect(() => {
    if (isLocked || isGuest || !userData || !encryptionKey || !auth.currentUser) return;
    const timer = setTimeout(async () => {
        setSyncStatus('syncing');
        try {
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(userData), encryptionKey).toString();
            await setDoc(doc(db, "users", auth.currentUser.uid), { encryptedData });
            setSyncStatus('synced');
        } catch (e) {
            console.error("Failed to save data to Firestore:", e);
            setSyncStatus('error');
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [userData, encryptionKey, isLocked, isGuest]);

  // Theme management
  useEffect(() => { const root = window.document.documentElement; root.classList.toggle('dark', theme === 'dark'); }, [theme]);
  
  // Alarm checker
  useEffect(() => { if (isLocked || !userData?.alarms) return; const checkAlarms = () => { const now = new Date(); const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; const activeAlarms = userData.alarms.filter(a => a.isEnabled && a.time === currentTime); if (activeAlarms.length > 0 && !ringingAlarm) { setRingingAlarm(activeAlarms[0]); } }; const interval = setInterval(checkAlarms, 10000); return () => clearInterval(interval); }, [isLocked, userData, ringingAlarm]);

  const handleLogout = useCallback(() => { 
      if(isFirebaseConfigured && !isGuest) { 
        signOut(auth); 
      }
      setIsGuest(false);
      setIsLocked(true);
      setUserData(null);
  }, [isGuest]);
  
  const handleThemeToggle = () => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); if(userData) { setUserData(prevData => ({ ...prevData, settings: { ...prevData.settings, theme: newTheme } })); } };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage data={userData} />;
      case 'tasks': return <TasksPage data={userData} setData={setUserData} />;
      case 'notes': return <NotesPage data={userData} setData={setUserData} />;
      case 'diary': return <DiaryPage data={userData} setData={setUserData} />;
      case 'ideas': return <IdeasPage data={userData} setData={setUserData} />;
      case 'alarms': return <AlarmsPage data={userData} setData={setUserData} />;
      case 'files': return <FilesPage data={userData} setData={setUserData} />;
      case 'expenses': return <ExpenseTrackerPage data={userData} setData={setUserData} />;
      case 'reminders': return <RemindersPage data={userData} setData={setUserData} />;
      case 'settings': return <SettingsPage data={userData} setData={setUserData} encryptionKey={encryptionKey} isGuest={isGuest} />;
      default: return <DashboardPage data={userData} />;
    }
  };

  if (isLocked) { return <LockScreen setAppIsLocked={setIsLocked} setEncryptionKey={setEncryptionKey} setUserData={setUserData} setIsGuest={setIsGuest} />; }

  return (
    <div className={`flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      {ringingAlarm && (<div className="absolute top-0 left-0 right-0 z-50 bg-indigo-600 text-white p-4 flex justify-between items-center shadow-lg animate-pulse"><div className="flex items-center"><AlarmClock size={24} className="mr-3" /><p className="font-bold">{ringingAlarm.label}</p></div><button onClick={() => setRingingAlarm(null)} className="p-1 rounded-full hover:bg-indigo-500"><X size={20} /></button></div>)}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} syncStatus={syncStatus} isGuest={isGuest} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/s$/, 's ')} userName={userData?.profile?.name} onThemeToggle={handleThemeToggle} theme={theme} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 relative">{renderPage()}</main>
      </div>
    </div>
  );
}

