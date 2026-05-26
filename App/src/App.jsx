import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import LoginPage from './LoginPage';
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";

// ==========================================
// 1. DATASETS (Simple Labels and Guides)
// ==========================================
const SYLLABUS_DATA = {
  tier1: [
    {
      name: "General Aptitude",
      weight: "15 Marks",
      topics: ["Verbal Ability", "Quantitative Aptitude", "Analytical Aptitude", "Spatial Aptitude"]
    },
    {
      name: "Discrete Mathematics",
      weight: "12 Marks",
      topics: ["Mathematical Logic", "Set Theory & Relations", "Functions", "Group Theory", "Combinatorics", "Graph Theory"]
    },
    {
      name: "Programming & Data Structures",
      weight: "11 Marks",
      topics: ["C Programming", "Recursion", "Arrays & Matrices", "Stacks & Queues", "Linked Lists", "Trees & Binary Trees", "Binary Search Trees", "Binary Heaps", "Hashing"]
    },
    {
      name: "Design & Analysis of Algorithms",
      weight: "14 Marks",
      topics: ["Asymptotic Analysis", "Divide & Conquer", "Greedy Algorithms", "Dynamic Programming", "Graph Algorithms (BFS/DFS)", "Shortest Paths (Dijkstra/Bellman-Ford)", "Minimum Spanning Trees", "Complexity Theory (P/NP)"]
    }
  ],
  tier2: [
    {
      name: "Operating Systems",
      weight: "10 Marks",
      topics: ["Process Management & Threads", "CPU Scheduling", "Process Synchronization & Semaphores", "Deadlock Prevention & Detection", "Memory Management & Paging", "Virtual Memory & Page Replacement", "File Systems", "Disk Scheduling"]
    },
    {
      name: "Database Management Systems",
      weight: "8 Marks",
      topics: ["ER Model", "Relational Model & Relational Algebra", "SQL Queries", "Functional Dependencies", "Normalization (1NF-BCNF)", "Transactions & Concurrency Control", "Indexing (B/B+ Trees)"]
    },
    {
      name: "Computer Networks",
      weight: "10 Marks",
      topics: ["Layered Architecture (OSI/TCP-IP)", "Flow & Error Control", "IPv4 & IPv6 Addressing", "Routing Algorithms (RIP/OSPF/BGP)", "TCP & UDP Congestion Control", "Application Layer Protocols (DNS/HTTP/SMTP)"]
    },
    {
      name: "Theory of Computation",
      weight: "8 Marks",
      topics: ["Finite Automata (DFA/NFA)", "Regular Expressions & Languages", "Context-Free Grammars", "Pushdown Automata (PDA)", "Turing Machines", "Undecidability"]
    }
  ],
  tier3: [
    {
      name: "Computer Org. & Architecture",
      weight: "8 Marks",
      topics: ["Machine Instructions & Addressing Modes", "ALU & Data Path Control", "Instruction Pipelining", "Cache Memory & Mapping", "I/O Interface & DMA"]
    },
    {
      name: "Digital Logic",
      weight: "5 Marks",
      topics: ["Boolean Algebra & K-Maps", "Combinational Circuits (Mux/Adders)", "Sequential Circuits (Flip-Flops/Counters)", "Number Systems & Codes"]
    },
    {
      name: "Compiler Design",
      weight: "5 Marks",
      topics: ["Lexical Analysis", "Parsing (LL/LR)", "Syntax-Directed Translation", "Intermediate Code Generation", "Code Optimization"]
    },
    {
      name: "Engineering Mathematics",
      weight: "6 Marks",
      topics: ["Linear Algebra (Matrices, Eigenvalues)", "Calculus (Limits, Integration)", "Probability & Statistics (Bayes, Random Variables)"]
    }
  ]
};

const DEFAULT_PLANNER_ENTRIES = [
  {
    id: "d1",
    type: "study",
    title: "Algorithms - DP Practice",
    start: "16:00",
    end: "17:00",
    desc: "Solve simple DP problems.",
    completed: false
  },
  {
    id: "d2",
    type: "study",
    title: "Discrete Math - Practice Questions",
    start: "17:00",
    end: "17:45",
    desc: "Solve 15 past questions from previous years.",
    completed: false
  },
  {
    id: "d3",
    type: "note",
    title: "Note: DP Space Trick",
    start: "18:15",
    end: "19:00",
    desc: "Compare memory used in top-down vs bottom-up code.",
    completed: false
  },
  {
    id: "d4",
    type: "shift",
    title: "Night Shift Work",
    start: "19:00",
    end: "07:00",
    desc: "Duty hours. Keep notes ready for short study breaks.",
    completed: false
  }
];

const DEFAULT_MISTAKES = [
  {
    id: "m1",
    subject: "Design & Analysis of Algorithms",
    topic: "Bellman-Ford Algorithm",
    type: "Calculation",
    description: "Forgot that Bellman-Ford needs to run exactly V-1 times to find the correct answer.",
    corrective: "Always loop from 1 to V-1. Perform the final check step separately.",
    date: "2026-05-24",
    solved: false
  },
  {
    id: "m2",
    subject: "Database Management Systems",
    topic: "Normalization",
    type: "Reading",
    description: "Missed the word 'NOT' in the question, so I picked the wrong option immediately.",
    corrective: "Always read questions carefully and look out for negative words like 'NOT' or 'FALSE'.",
    date: "2026-05-23",
    solved: true
  }
];

// Helper definitions
const timeStringToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const formatMinutesToTimeString = (totalMins) => {
  const h = Math.floor(totalMins / 60) % 24;
  const m = Math.floor(totalMins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const format12Hour = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const formatDateString = (dateInput) => {
  if (!dateInput) return "";
  let dateObj;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, monthIdx, day);
    } else {
      dateObj = new Date(dateInput);
    }
  } else if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    return dateInput;
  }

  if (isNaN(dateObj.getTime())) return dateInput;

  const day = dateObj.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) {
    suffix = 'st';
  } else if (day === 2 || day === 22) {
    suffix = 'nd';
  } else if (day === 3 || day === 23) {
    suffix = 'rd';
  }
  
  return `${day}${suffix} ${monthName} ${year}`;
};

const TimePicker12h = ({ label, value, onChange }) => {
  let initialHour = 12;
  let initialMinute = "00";
  let initialAmpm = "AM";

  if (value) {
    const parts = value.split(":");
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      initialMinute = parts[1];
      initialAmpm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      initialHour = h ? h : 12;
    }
  }

  const handleHourChange = (newHour) => {
    let h = parseInt(newHour, 10);
    if (initialAmpm === "PM" && h < 12) h += 12;
    if (initialAmpm === "AM" && h === 12) h = 0;
    const padH = String(h).padStart(2, "0");
    onChange(`${padH}:${initialMinute}`);
  };

  const handleMinuteChange = (newMin) => {
    let h = parseInt(value.split(":")[0], 10) || 0;
    const padH = String(h).padStart(2, "0");
    onChange(`${padH}:${newMin}`);
  };

  const handleAmpmChange = (newAmpm) => {
    let h = parseInt(value.split(":")[0], 10) || 0;
    let h12 = h % 12;
    h12 = h12 ? h12 : 12;
    
    let targetH = h12;
    if (newAmpm === "PM" && h12 < 12) targetH += 12;
    if (newAmpm === "AM" && h12 === 12) targetH = 0;
    
    const padH = String(targetH).padStart(2, "0");
    onChange(`${padH}:${initialMinute}`);
  };

  const minutes = [];
  for (let i = 0; i < 60; i += 5) {
    minutes.push(String(i).padStart(2, "0"));
  }
  if (!minutes.includes(initialMinute)) {
    minutes.push(initialMinute);
    minutes.sort();
  }

  return (
    <div className="time-picker-12h-container">
      {label && <label className="time-picker-label">{label}</label>}
      <div className="time-picker-selects">
        <select 
          value={initialHour} 
          onChange={(e) => handleHourChange(e.target.value)}
          className="time-select"
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="time-separator">:</span>
        <select 
          value={initialMinute} 
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="time-select"
        >
          {minutes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select 
          value={initialAmpm} 
          onChange={(e) => handleAmpmChange(e.target.value)}
          className="time-select ampm-select"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

// Embedded LoginPage component has been removed and modularized to src/LoginPage.jsx

// ==========================================
// MAIN REACT COMPONENT
// ==========================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // App States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [taskStart, setTaskStart] = useState("16:00");
  const [taskEnd, setTaskEnd] = useState("17:00");
  
  const [plannerEntries, setPlannerEntries] = useState(DEFAULT_PLANNER_ENTRIES);
  const [mistakes, setMistakes] = useState(DEFAULT_MISTAKES);
  const [syllabusStatus, setSyllabusStatus] = useState({});
  const [spacedRepetition, setSpacedRepetition] = useState([]);
  const [syllabusData, setSyllabusData] = useState(SYLLABUS_DATA);

  // Onboarding Settings States (Simple words)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState("");
  const [shiftStart, setShiftStart] = useState("19:00");
  const [shiftEnd, setShiftEnd] = useState("07:00");

  // Modals States
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [mistakeModalOpen, setMistakeModalOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);

  // Syllabus Modals States
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectModalTier, setSubjectModalTier] = useState("tier1");
  const [subjectInputName, setSubjectInputName] = useState("");
  const [subjectInputWeight, setSubjectInputWeight] = useState("");

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicModalTier, setTopicModalTier] = useState("tier1");
  const [topicModalSubject, setTopicModalSubject] = useState("");
  const [topicInputName, setTopicInputName] = useState("");

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalCallback, setConfirmModalCallback] = useState(null);

  // Focus Session States
  const [focusGoal, setFocusGoal] = useState("");
  const [focusGoalLocked, setFocusGoalLocked] = useState(false);
  const [focusDuration, setFocusDuration] = useState(45 * 60); // 45m
  const [focusRemaining, setFocusRemaining] = useState(45 * 60);
  const [focusIsRunning, setFocusIsRunning] = useState(false);
  const [focusPhase, setFocusPhase] = useState("STUDY TIME");
  const [focusAmbientSound, setFocusAmbientSound] = useState(null);
  const [focusVolume, setFocusVolume] = useState(0.5);
  const [focusQuickMistake, setFocusQuickMistake] = useState("");

  // Mistake Filter States
  const [mistakeSearch, setMistakeSearch] = useState("");
  const [mistakeFilterSubject, setMistakeFilterSubject] = useState("all");
  const [mistakeFilterType, setMistakeFilterType] = useState("all");
  const [mistakeFilterStatus, setMistakeFilterStatus] = useState("all");

  // Planner Filter State
  const [plannerFilter, setPlannerFilter] = useState("all");

  // Time & Routine synchronization
  const [currentTime, setCurrentTime] = useState(new Date());

  const [routine, setRoutine] = useState(getChronoRoutine("19:00", "07:00"));

  // Routine Edit Modal State
  const [routineEditOpen, setRoutineEditOpen] = useState(false);
  const [tempRoutine, setTempRoutine] = useState([]);
  
  // Custom Toast Notification State & Auto-Dismiss
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  
  // Audio Context Ref for synthesizers
  const audioCtxRef = useRef(null);
  const binauralNodesRef = useRef(null);
  const rainNodesRef = useRef(null);

  // ----------------------------------------------------
  // FIREBASE USER DATA INITIALIZATION & SYNC
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        if (firebaseUser.displayName) {
          setUsername(firebaseUser.displayName);
        }
        await loadUserData(firebaseUser);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setDataLoaded(false);
        setUsername("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle redirect result from Google login
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Successfully logged in via redirect:", result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect auth error:", error);
        showToast("Google Authentication failed: " + error.message, "error");
      });
  }, []);

  const loadUserData = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.plannerEntries) setPlannerEntries(data.plannerEntries);
        if (data.mistakes) setMistakes(data.mistakes);
        if (data.syllabusStatus) setSyllabusStatus(data.syllabusStatus);
        if (data.spacedRepetition) setSpacedRepetition(data.spacedRepetition);
        if (data.syllabusData) setSyllabusData(data.syllabusData);
        if (data.routine) setRoutine(data.routine);
        if (data.shiftStart) setShiftStart(data.shiftStart);
        if (data.shiftEnd) setShiftEnd(data.shiftEnd);
        let resolvedName = data.username;
        // Automatically sync and display name from Firebase Auth / Google if Firestore has default placeholder or is empty
        if ((!resolvedName || resolvedName === "Ishant J." || resolvedName === "Operator") && firebaseUser.displayName) {
          resolvedName = firebaseUser.displayName;
          try {
            await updateDoc(userDocRef, { username: resolvedName });
          } catch (e) {
            console.error("Failed to sync dynamic username to Firestore:", e);
          }
        }
        setUsername(resolvedName || firebaseUser.displayName || "Operator");
        setShowOnboarding(data.showOnboarding !== undefined ? data.showOnboarding : false);
      } else {
        // Migrate legacy localStorage settings if available
        const localPlanner = localStorage.getItem("gate_planner_entries");
        const localMistakes = localStorage.getItem("gate_mistakes");
        const localSyllabus = localStorage.getItem("gate_syllabus_status");
        const localSR = localStorage.getItem("gate_spaced_repetition");
        const localSyllabusData = localStorage.getItem("gate_syllabus_data");
        const localRoutine = localStorage.getItem("gate_custom_routine");
        const localShiftStart = localStorage.getItem("gate_shift_start") || "19:00";
        const localShiftEnd = localStorage.getItem("gate_shift_end") || "07:00";
        const tempName = localStorage.getItem("temp_register_username");
        if (tempName) localStorage.removeItem("temp_register_username");
        const localUsername = tempName || firebaseUser.displayName || "Operator";
        const localOnboarding = localStorage.getItem("gate_onboarding_completed") !== "true";

        const initialData = {
          plannerEntries: localPlanner ? JSON.parse(localPlanner) : DEFAULT_PLANNER_ENTRIES,
          mistakes: localMistakes ? JSON.parse(localMistakes) : DEFAULT_MISTAKES,
          syllabusStatus: localSyllabus ? JSON.parse(localSyllabus) : {},
          spacedRepetition: localSR ? JSON.parse(localSR) : [],
          syllabusData: localSyllabusData ? JSON.parse(localSyllabusData) : SYLLABUS_DATA,
          routine: localRoutine ? JSON.parse(localRoutine) : getChronoRoutine(localShiftStart, localShiftEnd),
          shiftStart: localShiftStart,
          shiftEnd: localShiftEnd,
          username: localUsername,
          showOnboarding: localOnboarding
        };

        // Initialize user document in firestore
        await setDoc(userDocRef, initialData);

        // Update active React states
        setPlannerEntries(initialData.plannerEntries);
        setMistakes(initialData.mistakes);
        setSyllabusStatus(initialData.syllabusStatus);
        setSpacedRepetition(initialData.spacedRepetition);
        setSyllabusData(initialData.syllabusData);
        setRoutine(initialData.routine);
        setShiftStart(initialData.shiftStart);
        setShiftEnd(initialData.shiftEnd);
        setUsername(initialData.username);
        setShowOnboarding(initialData.showOnboarding);
      }
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading user data from Firestore:", error);
      // Ensure the app remains usable in fallback offline mode
      setDataLoaded(true);
    }
  };

  // Sync state values to Firestore only after the database values are fully loaded.
  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { plannerEntries });
      } catch (error) {
        console.error("Error updating plannerEntries:", error);
      }
    };
    save();
  }, [plannerEntries, user, dataLoaded]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { mistakes });
      } catch (error) {
        console.error("Error updating mistakes:", error);
      }
    };
    save();
  }, [mistakes, user, dataLoaded]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { syllabusStatus });
      } catch (error) {
        console.error("Error updating syllabusStatus:", error);
      }
    };
    save();
  }, [syllabusStatus, user, dataLoaded]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { spacedRepetition });
      } catch (error) {
        console.error("Error updating spacedRepetition:", error);
      }
    };
    save();
  }, [spacedRepetition, user, dataLoaded]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { syllabusData });
      } catch (error) {
        console.error("Error updating syllabusData:", error);
      }
    };
    save();
  }, [syllabusData, user, dataLoaded]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const save = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { routine });
      } catch (error) {
        console.error("Error updating routine:", error);
      }
    };
    save();
  }, [routine, user, dataLoaded]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tick focus mode timer
  useEffect(() => {
    let interval = null;
    if (focusIsRunning && focusRemaining > 0) {
      interval = setInterval(() => {
        setFocusRemaining(prev => {
          if (focusPhase === "STUDY TIME") {
            let loggedToday = parseInt(localStorage.getItem("gate_focus_seconds_today")) || 0;
            loggedToday++;
            localStorage.setItem("gate_focus_seconds_today", loggedToday);
          }
          
          if (prev <= 1) {
            playFocusAlarm();
            handleFocusPhaseCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusIsRunning, focusRemaining, focusPhase]);

  // Sync volumes when slider shifts
  useEffect(() => {
    if (audioCtxRef.current) {
      if (binauralNodesRef.current) {
        binauralNodesRef.current.masterGain.gain.setValueAtTime(focusVolume, audioCtxRef.current.currentTime);
      }
      if (rainNodesRef.current) {
        rainNodesRef.current.masterGain.gain.setValueAtTime(focusVolume * 0.45, audioCtxRef.current.currentTime);
      }
    }
  }, [focusVolume]);

  // Get current timeline from state

  // Determine active phase & time remaining
  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  let currentPhaseIndex = -1;
  let phaseTimeRemaining = 0;

  for (let i = 0; i < routine.length; i++) {
    const step = routine[i];
    const start = timeStringToMinutes(step.start);
    let end = timeStringToMinutes(step.end);
    let isCurrent = false;

    if (end < start) {
      if (currentMins >= start || currentMins < end) {
        isCurrent = true;
        phaseTimeRemaining = currentMins >= start ? (24 * 60 - currentMins) + end : end - currentMins;
      }
    } else {
      if (currentMins >= start && currentMins < end) {
        isCurrent = true;
        phaseTimeRemaining = end - currentMins;
      }
    }

    if (isCurrent) {
      currentPhaseIndex = i;
      break;
    }
  }

  const currentPhase = currentPhaseIndex !== -1 ? routine[currentPhaseIndex] : null;

  // Calculate shift progress percentage
  const sStartMins = timeStringToMinutes(shiftStart);
  let elapsedShift = 0;
  const isShiftMode = currentMins >= sStartMins || currentMins < timeStringToMinutes(shiftEnd);

  if (isShiftMode) {
    if (currentMins >= sStartMins) {
      elapsedShift = currentMins - sStartMins;
    } else {
      elapsedShift = (24 * 60 - sStartMins) + currentMins;
    }
  }
  let shiftDurationMins = timeStringToMinutes(shiftEnd) - sStartMins;
  if (shiftDurationMins <= 0) shiftDurationMins += 24 * 60;
  const shiftProgressPct = isShiftMode ? Math.min(100, Math.floor((elapsedShift / shiftDurationMins) * 100)) : 0;

  // Calculate syllabus stats
  let totalTopics = 0;
  let completedTopics = 0;
  const tierMetrics = {
    tier1: { total: 0, completed: 0 },
    tier2: { total: 0, completed: 0 },
    tier3: { total: 0, completed: 0 }
  };

  Object.entries(syllabusData).forEach(([tierKey, subjects]) => {
    subjects.forEach(subj => {
      subj.topics.forEach(topic => {
        const topicKey = `${subj.name}::${topic}`;
        const status = syllabusStatus[topicKey] || "Not Started";
        const isCompleted = (status === "Completed" || status === "Under Revision");
        
        tierMetrics[tierKey].total++;
        if (isCompleted) tierMetrics[tierKey].completed++;

        totalTopics++;
        if (isCompleted) completedTopics++;
      });
    });
  });

  const totalSyllabusPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const radialOffset = 251.2 - (251.2 * totalSyllabusPct) / 100;

  // Spaced Repetition Due Count Today
  const todayStr = new Date().toISOString().split("T")[0];
  const srDueItems = spacedRepetition.filter(item => {
    const nextReview = item.reviews[item.currentReviewIndex];
    return nextReview && nextReview.scheduledDate <= todayStr && item.currentReviewIndex < 5;
  });

  // Calculate focus weekly efficiency metrics
  let focusSecondsToday = parseInt(localStorage.getItem("gate_focus_seconds_today")) || 0;
  let focusHoursToday = parseFloat((focusSecondsToday / 3600).toFixed(1));
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const weekHours = [6.5, 4.0, 7.5, 5.0, 3.5, 8.0, 0];
  const todayIndex = (currentTime.getDay() + 6) % 7;
  weekHours[todayIndex] = focusHoursToday;
  const maxWeekHour = Math.max(...weekHours, 8);
  const totalLoggedHours = weekHours.reduce((a, b) => a + b, 0).toFixed(1);
  const weeklyGoal = 46;
  const efficiencyRate = Math.min(100, Math.floor((totalLoggedHours / weeklyGoal) * 100));

  // ==========================================
  // HELPERS FOR TIMELINE CALIBRATIONS
  // ==========================================
  function getChronoRoutine(start, end) {
    const parseTime = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    
    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = Math.floor(mins % 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const sStart = parseTime(start);
    const sEnd = parseTime(end);

    const sleepStart = (sEnd + 60) % (24 * 60);
    const sleepEnd = (sleepStart + 7 * 60) % (24 * 60);
    const wakeStart = sleepEnd;
    const wakeEnd = (wakeStart + 60) % (24 * 60);
    const study1Start = wakeEnd;
    const study1End = (study1Start + 60) % (24 * 60);
    const study2Start = study1End;
    const study2End = (study2Start + 45) % (24 * 60);
    const revStart = study2End;
    const revEnd = (revStart + 30) % (24 * 60);
    const commuteStart = revEnd;
    const commuteEnd = sStart;
    const transStart = sEnd;
    const transEnd = sleepStart;

    return [
      { start: formatTime(sleepStart), end: formatTime(sleepEnd), name: "Sleep Time", cssClass: "sleep", desc: "Keep room dark, rest to refresh memory." },
      { start: formatTime(wakeStart), end: formatTime(wakeEnd), name: "Wake Up & Fresh Start", cssClass: "wake", desc: "Bright light exposure, drink water, get active." },
      { start: formatTime(study1Start), end: formatTime(study1End), name: "Study Time - Concepts", cssClass: "study", desc: "Learn important topics when brain is fresh." },
      { start: formatTime(study2Start), end: formatTime(study2End), name: "Study Time - Solving Problems", cssClass: "study", desc: "Solve practice questions and past papers." },
      { start: formatTime(revStart), end: formatTime(revEnd), name: "Quick Review", cssClass: "study", desc: "Do quick reviews and spaced repetitions." },
      { start: formatTime(commuteStart), end: formatTime(commuteEnd), name: "Travel Study Time", cssClass: "commute", desc: "Read small notes during your travel time." },
      { start: formatTime(sStart), end: formatTime(sEnd), name: "Night Shift Work", cssClass: "shift", desc: "Work hours. Take small study breaks if possible." },
      { start: formatTime(transStart), end: formatTime(transEnd), name: "Prepare for Sleep", cssClass: "commute", desc: "Travel home, relax, and get ready for deep sleep." }
    ];
  }

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const customRoutine = getChronoRoutine(shiftStart, shiftEnd);
    setRoutine(customRoutine);
    const newPlanner = [
      {
        id: "d1",
        type: "study",
        title: "Algorithms - Concepts Session",
        start: customRoutine[2].start,
        end: customRoutine[2].end,
        desc: "Study core theory topics.",
        completed: false
      },
      {
        id: "d2",
        type: "study",
        title: "Practice - Solve past questions",
        start: customRoutine[3].start,
        end: customRoutine[3].end,
        desc: "Solve 15 practice questions.",
        completed: false
      },
      {
        id: "d3",
        type: "note",
        title: "Revision Check",
        start: customRoutine[4].start,
        end: customRoutine[4].end,
        desc: "Complete daily topic reviews.",
        completed: false
      },
      {
        id: "d4",
        type: "shift",
        title: `Night Shift Work (${username})`,
        start: shiftStart,
        end: shiftEnd,
        desc: "Work hours. Keep small notes ready.",
        completed: false
      }
    ];

    setPlannerEntries(newPlanner);
    setShowOnboarding(false);

    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          username,
          shiftStart,
          shiftEnd,
          showOnboarding: false,
          routine: customRoutine,
          plannerEntries: newPlanner
        });
      } catch (err) {
        console.error("Error saving onboarding details to Firestore:", err);
      }
    }
  };

  const toggleTaskCompleted = (id) => {
    setPlannerEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return { ...entry, completed: !entry.completed };
      }
      return entry;
    }));
  };

  const openNewTaskModal = (task = null) => {
    setEditingTask(task);
    setTaskStart(task ? task.start : "16:00");
    setTaskEnd(task ? task.end : "17:00");
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const type = data.get("entry-type");
    const title = data.get("task-title");
    const desc = data.get("task-desc");

    if (editingTask) {
      setPlannerEntries(prev => prev.map(item => {
        if (item.id === editingTask.id) {
          return { ...item, type, title, start: taskStart, end: taskEnd, desc };
        }
        return item;
      }));
    } else {
      const newEntry = {
        id: "_" + Math.random().toString(36).substr(2, 9),
        type,
        title,
        start: taskStart,
        end: taskEnd,
        desc,
        completed: false
      };
      setPlannerEntries(prev => [...prev, newEntry]);
    }
    closeTaskModal();
  };

  const deletePlannerEntry = (id) => {
    if (window.confirm("Remove this entry?")) {
      setPlannerEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleMistakeSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const subject = data.get("mistake-subject");
    const topic = data.get("mistake-topic");
    const type = data.get("mistake-type");
    const description = data.get("mistake-description");
    const corrective = data.get("mistake-corrective");

    const newMistake = {
      id: "_" + Math.random().toString(36).substr(2, 9),
      subject,
      topic,
      type,
      description,
      corrective,
      date: new Date().toISOString().split("T")[0],
      solved: false
    };

    setMistakes(prev => [...prev, newMistake]);
    setMistakeModalOpen(false);
  };

  const toggleMistakeSolved = (id) => {
    setMistakes(prev => prev.map(m => {
      if (m.id === id) return { ...m, solved: !m.solved };
      return m;
    }));
  };

  const deleteMistake = (id) => {
    if (window.confirm("Delete this mistake?")) {
      setMistakes(prev => prev.filter(m => m.id !== id));
    }
  };

  const updateTopicStatus = (subject, topic, status) => {
    const topicKey = `${subject}::${topic}`;
    setSyllabusStatus(prev => ({
      ...prev,
      [topicKey]: status
    }));

    if (status === "Completed" && !spacedRepetition.some(item => item.topic === topicKey)) {
      scheduleSpacedRepetition(subject, topic);
    }
  };

  const scheduleSpacedRepetition = (subject, topic) => {
    const topicKey = `${subject}::${topic}`;
    if (spacedRepetition.some(item => item.topic === topicKey)) {
      setActiveTab("spaced");
      return;
    }

    const offsets = [1, 2, 3, 5, 7];
    const today = new Date();
    const reviews = offsets.map(dayOffset => {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      return {
        scheduledDate: date.toISOString().split("T")[0],
        completed: false
      };
    });

    const newSR = {
      id: "_" + Math.random().toString(36).substr(2, 9),
      topic: topicKey,
      subject,
      registeredDate: today.toISOString().split("T")[0],
      reviews,
      currentReviewIndex: 0
    };

    setSpacedRepetition(prev => [...prev, newSR]);
    setActiveTab("spaced");
  };

  const completeSRIteration = (id) => {
    setSpacedRepetition(prev => prev.map(item => {
      if (item.id === id) {
        const nextIdx = item.currentReviewIndex + 1;
        return {
          ...item,
          currentReviewIndex: nextIdx
        };
      }
      return item;
    }));
  };

  const addSubjectPrompt = (tierKey) => {
    setSubjectModalTier(tierKey);
    setSubjectInputName("");
    setSubjectInputWeight("");
    setSubjectModalOpen(true);
  };

  const removeSubjectConfirm = (tierKey, subjectName) => {
    setConfirmModalMessage(`Are you sure you want to delete the subject "${subjectName}" and all of its topics?`);
    setConfirmModalCallback(() => () => {
      setSyllabusData(prev => {
        const updatedTier = prev[tierKey].filter(s => s.name !== subjectName);
        return {
          ...prev,
          [tierKey]: updatedTier
        };
      });
    });
    setConfirmModalOpen(true);
  };

  const addTopicPrompt = (tierKey, subjectName) => {
    setTopicModalTier(tierKey);
    setTopicModalSubject(subjectName);
    setTopicInputName("");
    setTopicModalOpen(true);
  };

  const removeTopicConfirm = (tierKey, subjectName, topicName) => {
    setConfirmModalMessage(`Are you sure you want to delete the topic "${topicName}"?`);
    setConfirmModalCallback(() => () => {
      setSyllabusData(prev => {
        const updatedTier = prev[tierKey].map(s => {
          if (s.name === subjectName) {
            return {
              ...s,
              topics: s.topics.filter(t => t !== topicName)
            };
          }
          return s;
        });
        return {
          ...prev,
          [tierKey]: updatedTier
        };
      });

      const topicKey = `${subjectName}::${topicName}`;
      setSyllabusStatus(prev => {
        const copy = { ...prev };
        delete copy[topicKey];
        return copy;
      });
    });
    setConfirmModalOpen(true);
  };

  // ==========================================
  // AUDIO SYNTHESIZERS (WEB AUDIO API)
  // ==========================================
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const toggleSound = (soundType) => {
    initAudioCtx();
    const ctx = audioCtxRef.current;

    if (focusAmbientSound === soundType) {
      if (soundType === "binaural") stopBinauralBeat();
      if (soundType === "rain") stopRainSound();
      setFocusAmbientSound(null);
    } else {
      stopBinauralBeat();
      stopRainSound();

      if (soundType === "binaural") {
        startBinauralBeat(ctx);
        setFocusAmbientSound("binaural");
      } else if (soundType === "rain") {
        startRainSound(ctx);
        setFocusAmbientSound("rain");
      }
    }
  };

  const startBinauralBeat = (ctx) => {
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    leftOsc.frequency.value = 200;
    rightOsc.frequency.value = 206;

    const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 0.12;
    rightGain.gain.value = 0.12;

    const masterGain = ctx.createGain();
    masterGain.gain.value = focusVolume;

    if (leftPanner && rightPanner) {
      leftPanner.pan.value = -1;
      rightPanner.pan.value = 1;
      leftOsc.connect(leftGain).connect(leftPanner).connect(masterGain);
      rightOsc.connect(rightGain).connect(rightPanner).connect(masterGain);
    } else {
      leftOsc.connect(leftGain).connect(masterGain);
      rightOsc.connect(rightGain).connect(masterGain);
    }

    masterGain.connect(ctx.destination);
    leftOsc.start();
    rightOsc.start();

    binauralNodesRef.current = { leftOsc, rightOsc, masterGain };
  };

  const stopBinauralBeat = () => {
    if (binauralNodesRef.current) {
      try {
        binauralNodesRef.current.leftOsc.stop();
        binauralNodesRef.current.rightOsc.stop();
      } catch(e){}
      binauralNodesRef.current = null;
    }
  };

  const startRainSound = (ctx) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(filter.frequency);

    const masterGain = ctx.createGain();
    masterGain.gain.value = focusVolume * 0.45;

    whiteNoise.connect(filter).connect(masterGain).connect(ctx.destination);
    lfo.start();
    whiteNoise.start();

    rainNodesRef.current = { whiteNoise, lfo, filter, masterGain };
  };

  const stopRainSound = () => {
    if (rainNodesRef.current) {
      try {
        rainNodesRef.current.whiteNoise.stop();
        rainNodesRef.current.lfo.stop();
      } catch(e){}
      rainNodesRef.current = null;
    }
  };

  const playFocusAlarm = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  };

  // ==========================================
  // TIMER FUNCTIONS
  // ==========================================
  const startFocusSession = () => {
    if (!focusGoal.trim()) {
      showToast("Please enter a goal to lock your focus.", "warning");
      return;
    }
    setFocusGoalLocked(true);
    setFocusIsRunning(true);
    initAudioCtx();
  };

  const handleFocusPhaseCompletion = () => {
    if (focusPhase === "STUDY TIME") {
      const newStudy = {
        id: "_" + Math.random().toString(36).substr(2, 9),
        type: "study",
        title: `Deep Study: ${focusGoal}`,
        start: formatMinutesToTimeString(currentMins - Math.floor(focusDuration / 60)),
        end: formatMinutesToTimeString(currentMins),
        desc: "Automatically saved deep study session.",
        completed: true
      };
      setPlannerEntries(prev => [...prev, newStudy]);
      
      setFocusPhase("SHORT BREAK");
      setFocusDuration(10 * 60);
      setFocusRemaining(10 * 60);
    } else {
      setFocusPhase("STUDY TIME");
      setFocusDuration(45 * 60);
      setFocusRemaining(45 * 60);
    }
    setFocusIsRunning(true);
  };

  const skipFocusPhase = () => {
    handleFocusPhaseCompletion();
  };

  const handleFocusQuickMistakeSubmit = () => {
    if (!focusQuickMistake.trim()) return;
    const newMistake = {
      id: "_" + Math.random().toString(36).substr(2, 9),
      subject: "Design & Analysis of Algorithms",
      topic: "Quick Logged Mistake",
      type: "Silly",
      description: focusQuickMistake,
      corrective: "Spotted during study time. Watch out next time.",
      date: new Date().toISOString().split("T")[0],
      solved: false
    };

    setMistakes(prev => [...prev, newMistake]);
    setFocusQuickMistake("");
    showToast("Mistake saved to your Mistake Book. Good job identifying it!", "success");
  };

  const exitFocusMode = () => {
    setFocusIsRunning(false);
    stopBinauralBeat();
    stopRainSound();
    setFocusAmbientSound(null);
    setFocusModeActive(false);
    setFocusGoalLocked(false);
    setFocusGoal("");
    setFocusDuration(45 * 60);
    setFocusRemaining(45 * 60);
    setFocusPhase("STUDY TIME");
  };

  if (!isAuthenticated) {
    return (
      <LoginPage />
    );
  }

  return (
    <div className="gate-app-root">
      
      {/* ONBOARDING MODAL / POPUP */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-card">
            <div className="onboarding-header">
              <h2>⎈ GATE CSE 2027 Study Setup</h2>
              <p>Set up your study plan and night shift work hours</p>
            </div>
            <div className="onboarding-slide">
              <p className="onboarding-intro">
                Welcome! This study planner helps you balance your 12-hour night shifts 
                with your GATE preparation.
              </p>
              
              <div className="onboarding-pillars">
                <div className="pillar-item">
                  <span className="material-symbols-outlined">nights_stay</span>
                  <h4>Daily Planner</h4>
                  <p>Sets your sleep times and best study hours.</p>
                </div>
                <div className="pillar-item">
                  <span className="material-symbols-outlined">history</span>
                  <h4>Revision Plan</h4>
                  <p>Reminds you to review topics on days 1, 2, 3, 5, and 7.</p>
                </div>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="onboarding-setup-form">
                <div className="form-group">
                  <label htmlFor="user-pref-name">Your Name</label>
                  <input 
                    type="text" 
                    id="user-pref-name" 
                    required 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="e.g. Ishant J."
                  />
                </div>
                <div className="form-row form-row-picker">
                  <TimePicker12h 
                    label="Night Shift Start Time" 
                    value={shiftStart} 
                    onChange={setShiftStart} 
                  />
                  <TimePicker12h 
                    label="Night Shift End Time" 
                    value={shiftEnd} 
                    onChange={setShiftEnd} 
                  />
                </div>
                <button type="submit" className="primary-button" style={{ marginTop: '12px', justifyContent: 'center' }}>
                  Save & Start Planning
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className="top-nav">
        <div className="logo-area">
          <button className="icon-button mobile-menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)} title="Open Navigation Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="logo-symbol">⎈</span>
          <span className="logo-text">GATE CSE 2027</span>
          <span className="logo-tag">STUDY ASSISTANT</span>
        </div>
        <div className="status-indicator">
          <span className="status-pulse"></span>
          <span className="status-text">System Live</span>
        </div>
        <div className="top-nav-actions">
          <div className="current-time-display" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ opacity: 0.6, fontSize: '11px', fontWeight: '500' }}>{formatDateString(currentTime)}</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </div>
          <div className="desktop-only-actions">
            <button className="icon-button" onClick={() => setFocusModeActive(true)} title="Start Study Session" style={{ color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined">timer</span>
            </button>
            <button className="icon-button" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="badge">2</span>
            </button>
            <button className="icon-button" onClick={() => setShowOnboarding(true)} title="Set Up Shift Hours">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <div className="user-profile">
            <div className="avatar" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-container-highest)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>person</span>
            </div>
            <div className="user-meta">
              <span className="user-name">{username}</span>
              <span className="user-role">Night Shift Scholar</span>
            </div>
          </div>
          <button className="icon-button" onClick={handleLogout} title="Log Out Session" style={{ color: 'var(--color-error)' }}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR AND MAIN */}
      <div className="app-layout">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <span className="section-title">NAVIGATION</span>
            <nav className="nav-links">
              <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <span className="material-symbols-outlined">dashboard</span>
                <span className="link-label">Dashboard</span>
              </button>
              <button className={`nav-link ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
                <span className="material-symbols-outlined">calendar_month</span>
                <span className="link-label">Daily Study Planner</span>
              </button>
              <button className={`nav-link ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => setActiveTab('syllabus')}>
                <span className="material-symbols-outlined">menu_book</span>
                <span className="link-label">Syllabus Tracker</span>
              </button>
              <button className={`nav-link ${activeTab === 'mistakes' ? 'active' : ''}`} onClick={() => setActiveTab('mistakes')}>
                <span className="material-symbols-outlined">error</span>
                <span className="link-label">Mistake Book</span>
              </button>
              <button className={`nav-link ${activeTab === 'spaced' ? 'active' : ''}`} onClick={() => setActiveTab('spaced')}>
                <span className="material-symbols-outlined">history</span>
                <span className="link-label">Revision Schedule</span>
              </button>
              <button className="nav-link mobile-only-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
                <span className="link-label">Menu</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-section focus-action">
            <button className="focus-button" onClick={() => setFocusModeActive(true)}>
              <span className="material-symbols-outlined">timer</span>
              <span>Start Study Session</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="shift-card">
              <div className="shift-card-header">
                <span className="material-symbols-outlined">nights_stay</span>
                <span>SHIFT OPERATIONAL HOURS</span>
              </div>
              <p className="shift-schedule">{format12Hour(shiftStart)} - {format12Hour(shiftEnd)}</p>
              <div className="shift-progress-container">
                <div className="shift-progress-bar" style={{ width: `${shiftProgressPct}%` }}></div>
              </div>
              <span className="shift-status-sub">
                {isShiftMode ? `Shift Progress: ${shiftProgressPct}%` : `Off-Duty: Sleeping/Study Cycle`}
              </span>
            </div>
          </div>
        </aside>

        {/* VIEWPORT AREA */}
        <main className="main-viewport">
          
          {/* TAB 1: DASHBOARD */}
          <section className={`tab-view ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <div className="view-header">
              <div>
                <h1 className="view-title">My Daily Schedule</h1>
                <p className="view-subtitle">{formatDateString(currentTime)}</p>
              </div>
              <div className="dashboard-quick-actions">
                <button className="secondary-button" onClick={() => setMistakeModalOpen(true)}>
                  <span className="material-symbols-outlined">edit_document</span>
                  <span>Log a Mistake</span>
                </button>
                <button className="primary-button" onClick={() => openNewTaskModal()}>
                  <span className="material-symbols-outlined">add</span>
                  <span>New Entry</span>
                </button>
              </div>
            </div>

            <div className="bento-grid">
              
              {/* Daily Sleep/Study Timeline Card */}
              <div className="grid-card col-span-2 row-span-1 chronobio-card">
                <div className="card-header chronobio-header">
                  <div className="chronobio-title-area">
                    <span className="chronobio-label-mobile">MY SLEEP & STUDY HOURS</span>
                    <h3 className="card-title">My Sleep & Study Hours</h3>
                    <h3 className="chronobio-sub-mobile">Best Study Hours Plan</h3>
                  </div>
                  <div className="chronobio-actions">
                    <button 
                      className="secondary-button edit-routine-btn" 
                      onClick={() => {
                        setTempRoutine(JSON.parse(JSON.stringify(routine)));
                        setRoutineEditOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                      <span>Edit Routine</span>
                    </button>
                    <span className="card-tag primary-tag">Best Study Hours Plan</span>
                  </div>
                </div>
                <div className="chrono-progress-display">
                  <div className="chrono-current-status">
                    <span className="chrono-label">Current Step</span>
                    <h2 className="chrono-phase-title">
                      {currentPhase ? currentPhase.name : "Sleep Time"}
                    </h2>
                    <p className="chrono-phase-desc">
                      {currentPhase ? currentPhase.desc : "Resting time to refresh your memory."}
                    </p>
                  </div>
                  <div className="chrono-countdown">
                    <span className="chrono-label">Time Left</span>
                    <h2 className="chrono-timer">
                      {currentPhase ? `${Math.floor(phaseTimeRemaining / 60).toString().padStart(2, '0')}:${(phaseTimeRemaining % 60).toString().padStart(2, '0')}` : "00:00"}
                    </h2>
                  </div>
                </div>
                <div className="chrono-timeline-strip">
                  {routine.map((step, idx) => {
                    const startM = timeStringToMinutes(step.start);
                    let endM = timeStringToMinutes(step.end);
                    let duration = endM - startM;
                    if (endM < startM) duration = (24 * 60 - startM) + endM;
                    const flexShare = Math.round(duration / 15);

                    return (
                      <div 
                        key={idx}
                        className={`timeline-segment ${step.cssClass} ${idx === currentPhaseIndex ? 'active-phase' : ''}`}
                        style={{ flexGrow: flexShare }}
                        data-title={`${step.name} (${format12Hour(step.start)} - ${format12Hour(step.end)})`}
                      />
                    );
                  })}
                </div>
                <div className="chrono-timeline-labels">
                  <span>0:00</span>
                  <span>8:00</span>
                  <span>10:00</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* Weekly Study Hours logged Card */}
              <div className="grid-card col-span-1 row-span-1 efficiency-card">
                <h3 className="card-title">Weekly Focus Hours</h3>
                <span className="efficiency-pct">{efficiencyRate}%</span>
                <div className="efficiency-chart-container">
                  <div className="bar-chart">
                    {weekDays.map((day, idx) => {
                      const barHeight = Math.min(100, Math.floor((weekHours[idx] / maxWeekHour) * 100));
                      return (
                        <div className="chart-bar-wrapper" key={idx}>
                          <div 
                            className={`chart-bar ${idx === todayIndex ? 'active' : ''}`} 
                            style={{ height: `${barHeight}%` }}
                            title={`${weekHours[idx]} Hours`}
                          />
                          <span className="chart-label">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="card-footer-text">
                  {totalLoggedHours} study hours logged this week. {Math.max(0, (weeklyGoal - totalLoggedHours).toFixed(1))} hours left to hit weekly goal of {weeklyGoal}h.
                </p>
              </div>

              {/* Daily Task checklist */}
              <div className="grid-card col-span-2 row-span-2 daily-trajectory-card">
                <div className="card-header">
                  <h3 className="card-title">Tasks for Today</h3>
                  <span className="card-action-link" onClick={() => setActiveTab("planner")}>Open Planner</span>
                </div>
                <div className="trajectory-list">
                  {plannerEntries.length === 0 ? (
                    <div className="empty-state">
                      <span className="material-symbols-outlined">hourglass_empty</span>
                      <p>No planner entries logged today. Click 'New Entry' to add tasks.</p>
                    </div>
                  ) : (
                    [...plannerEntries]
                      .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start))
                      .map(entry => (
                        <div className={`trajectory-item ${entry.completed ? 'completed' : ''}`} key={entry.id}>
                          <div 
                            className={`trajectory-checkbox ${entry.completed ? 'checked' : ''}`}
                            onClick={() => toggleTaskCompleted(entry.id)}
                          />
                          <div className={`item-icon-box ${entry.type}`}>
                            <span className="material-symbols-outlined">
                              {entry.type === 'study' ? 'school' : entry.type === 'shift' ? 'work' : 'sticky_note_2'}
                            </span>
                          </div>
                          <div className="item-content">
                            <div className="item-meta">
                              <span style={{ color: `var(--color-${entry.type})` }}>{entry.type}</span>
                            </div>
                            <div className="item-title">{entry.title}</div>
                            <p className="item-desc">{entry.desc}</p>
                          </div>
                          <div className="item-time">{format12Hour(entry.start)} - {format12Hour(entry.end)}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Syllabus Completion Card */}
              <div className="grid-card col-span-1 row-span-1 syllabus-overview-card">
                <div className="card-header">
                  <h3 className="card-title">Topics Finished</h3>
                  <span className="card-tag secondary-tag">GATE CSE</span>
                </div>
                <div className="syllabus-radial-stats">
                  <div className="radial-progress-wrapper">
                    <svg className="radial-svg" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="radial3dGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0089a8" />
                          <stop offset="30%" stopColor="#4cd7f6" />
                          <stop offset="50%" stopColor="#ffffff" />
                          <stop offset="70%" stopColor="#4cd7f6" />
                          <stop offset="100%" stopColor="#005a70" />
                        </linearGradient>
                        <filter id="radialDropShadow" x="-15%" y="-15%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
                        </filter>
                      </defs>
                      {/* Outer bevel reflection ring */}
                      <circle className="radial-bevel-outer" cx="50" cy="50" r="44" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1"></circle>
                      {/* Main track groove */}
                      <circle className="radial-bg" cx="50" cy="50" r="40"></circle>
                      {/* Inner bevel shadow ring */}
                      <circle className="radial-bevel-inner" cx="50" cy="50" r="36" fill="none" stroke="rgba(0, 0, 0, 0.8)" strokeWidth="1"></circle>
                      {/* 3D cylindrical glowing progress circle */}
                      <circle 
                        className="radial-fg" 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        stroke="url(#radial3dGlow)"
                        filter="url(#radialDropShadow)"
                        strokeDasharray="251.2" 
                        style={{ strokeDashoffset: radialOffset }}
                      ></circle>
                    </svg>
                    <span className="radial-label">{totalSyllabusPct}%</span>
                  </div>
                  <div className="syllabus-breakdown">
                    <div className="breakdown-item">
                      <span className="color-dot tier1-dot"></span>
                      <span className="breakdown-label">Priority 1 (High)</span>
                      <span className="breakdown-val">
                        {tierMetrics.tier1.total > 0 ? Math.round((tierMetrics.tier1.completed / tierMetrics.tier1.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="color-dot tier2-dot"></span>
                      <span className="breakdown-label">Priority 2 (Medium)</span>
                      <span className="breakdown-val">
                        {tierMetrics.tier2.total > 0 ? Math.round((tierMetrics.tier2.completed / tierMetrics.tier2.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="color-dot tier3-dot"></span>
                      <span className="breakdown-label">Priority 3 (Other)</span>
                      <span className="breakdown-val">
                        {tierMetrics.tier3.total > 0 ? Math.round((tierMetrics.tier3.completed / tierMetrics.tier3.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spaced Repetition Due Widget */}
              <div className="grid-card col-span-1 row-span-1 spaced-due-card">
                <div className="card-header">
                  <h3 className="card-title">Topic Revisions</h3>
                  <span className={`badge ${srDueItems.length > 0 ? 'warning-badge' : ''}`}>
                    {srDueItems.length} Due
                  </span>
                </div>
                <div className="sr-due-list">
                  {srDueItems.length === 0 ? (
                    <div className="sr-due-item">
                      <span className="sr-due-topic">All done! No reviews left today.</span>
                    </div>
                  ) : (
                    srDueItems.slice(0, 3).map(item => (
                      <div className="sr-due-item" key={item.id}>
                        <span className="sr-due-topic">{item.topic.split("::")[1]}</span>
                        <span className="sr-due-interval">Review {item.currentReviewIndex + 1}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* TAB 2: DAILY STUDY PLANNER */}
          <section className={`tab-view ${activeTab === 'planner' ? 'active' : ''}`}>
            <div className="view-header" style={{ marginBottom: '16px' }}>
              <div>
                <h1 className="view-title">Daily Study Planner</h1>
                <p className="view-subtitle">Plan your study hours around your night shifts</p>
              </div>
              <div className="header-buttons">
                <div className="filter-tabs">
                  <button className={`filter-tab ${plannerFilter === 'all' ? 'active' : ''}`} onClick={() => setPlannerFilter('all')}>All</button>
                  <button className={`filter-tab ${plannerFilter === 'study' ? 'active' : ''}`} onClick={() => setPlannerFilter('study')}>Study</button>
                  <button className={`filter-tab ${plannerFilter === 'shift' ? 'active' : ''}`} onClick={() => setPlannerFilter('shift')}>Shift</button>
                  <button className={`filter-tab ${plannerFilter === 'note' ? 'active' : ''}`} onClick={() => setPlannerFilter('note')}>Notes</button>
                </div>
                <button className="primary-button" onClick={() => openNewTaskModal()}>
                  <span className="material-symbols-outlined">add</span>
                  <span>New Entry</span>
                </button>
              </div>
            </div>

            {/* Daily Focus Pipeline Progress Banner */}
            <div className="planner-progress-banner glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', marginBottom: '24px', borderRadius: 'var(--radius-xl)', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', letterSpacing: '0.02em', color: 'var(--color-on-surface)' }}>Daily Pipeline Progress</h4>
                <p style={{ margin: 0, fontSize: '11px', opacity: 0.6, color: 'var(--color-on-surface-variant)' }}>
                  {plannerEntries.filter(e => e.type === 'study').length} study blocks scheduled today
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, maxWidth: '400px', marginLeft: '32px' }}>
                <div style={{ margin: 0, height: '8px', background: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden', flexGrow: 1, border: '1px solid var(--color-outline-variant)' }}>
                  <div 
                    style={{ 
                      width: `${plannerEntries.length > 0 ? (plannerEntries.filter(e => e.completed).length / plannerEntries.length) * 100 : 0}%`,
                      backgroundColor: 'var(--color-primary)',
                      height: '100%',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '45px', textAlign: 'right', color: 'var(--color-primary)' }}>
                  {plannerEntries.length > 0 ? Math.round((plannerEntries.filter(e => e.completed).length / plannerEntries.length) * 100) : 0}% Done
                </span>
              </div>
            </div>

            <div className="planner-layout">
              <div className="planner-feed-section">
                <div className="planner-feed">
                  {plannerEntries
                    .filter(e => plannerFilter === 'all' || e.type === plannerFilter)
                    .sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start))
                    .map(entry => (
                      <div 
                        className={`trajectory-item glass-panel ${entry.completed ? 'completed' : ''}`} 
                        style={{ borderLeft: `4px solid var(--color-${entry.type})` }}
                        key={entry.id}
                      >
                        <div 
                          className={`trajectory-checkbox ${entry.completed ? 'checked' : ''}`} 
                          onClick={() => toggleTaskCompleted(entry.id)}
                        />
                        <div className={`item-icon-box ${entry.type}`}>
                          <span className="material-symbols-outlined">
                            {entry.type === 'study' ? 'school' : entry.type === 'shift' ? 'work' : 'sticky_note_2'}
                          </span>
                        </div>
                        <div className="item-content">
                          <div className="item-meta">
                            <span style={{ color: `var(--color-${entry.type})` }}>{entry.type}</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>{format12Hour(entry.start)} - {format12Hour(entry.end)}</span>
                          </div>
                          <div className="item-title">{entry.title}</div>
                          <p className="item-desc">{entry.desc}</p>
                        </div>
                        <div className="item-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {entry.type === 'study' && !entry.completed && (
                            <button 
                              className="secondary-button" 
                              onClick={() => {
                                setFocusModeActive(true);
                              }}
                              style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px', display: 'flex', alignItems: 'center', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                              title="Launch deep focus timer"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
                              <span>Focus</span>
                            </button>
                          )}
                          <button className="icon-button" onClick={() => openNewTaskModal(entry)} title="Edit Entry">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button className="icon-button" onClick={() => deletePlannerEntry(entry.id)} title="Delete Entry">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-error)' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="planner-sidebar-section">
                <div className="glass-panel routine-card" style={{ borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>My Daily Routine</h3>
                    <button 
                      className="secondary-button" 
                      onClick={() => {
                        setTempRoutine(JSON.parse(JSON.stringify(routine)));
                        setRoutineEditOpen(true);
                      }}
                      style={{ padding: '4px 10px', fontSize: '11px', height: '28px', gap: '4px', display: 'flex', alignItems: 'center' }}
                      title="Edit Daily Routine Baseline"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="routine-subtitle" style={{ margin: '0 0 16px 0' }}>Chronobiological baseline steps</p>
                  <div className="routine-steps">
                    {routine.map((step, idx) => (
                      <div className={`routine-step ${step.cssClass}`} key={idx}>
                        <span className="time">{format12Hour(step.start)} - {format12Hour(step.end)}</span>
                        <div className="step-details">
                          <h4>{step.name}</h4>
                          <p>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TAB 3: SYLLABUS TRACKER */}
          <section className={`tab-view ${activeTab === 'syllabus' ? 'active' : ''}`}>
            <div className="view-header">
              <div>
                <h1 className="view-title">Syllabus Tracker</h1>
                <p className="view-subtitle">Track subjects sorted by exam weightage and priority</p>
              </div>
              <div className="syllabus-legend">
                <span className="legend-item"><span className="badge badge-ns">NS</span> Not Started</span>
                <span className="legend-item"><span className="badge badge-ip">IP</span> In Progress</span>
                <span className="legend-item"><span className="badge badge-co">CO</span> Completed</span>
                <span className="legend-item"><span className="badge badge-ur">UR</span> Under Revision</span>
              </div>
            </div>

            <div className="syllabus-container">
              {Object.entries(syllabusData).map(([tierKey, subjects]) => {
                const isTier1 = tierKey === "tier1";
                const isTier2 = tierKey === "tier2";
                
                return (
                  <div className="syllabus-tier-block" key={tierKey}>
                    <div className={`tier-header ${isTier1 ? 'tier-1' : isTier2 ? 'tier-2' : 'tier-3'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div className="tier-title-grp">
                        <span className="tier-num">
                          {tierKey === 'tier1' ? 'PRIORITY 1' : tierKey === 'tier2' ? 'PRIORITY 2' : 'PRIORITY 3'}
                        </span>
                        <h2>
                          {tierKey === 'tier1' ? 'Most Important Subjects (~50 Marks)' : tierKey === 'tier2' ? 'Medium Importance Subjects (~35 Marks)' : 'Low Importance Subjects (~15 Marks)'}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="tier-roti font-bold">
                          {tierKey === 'tier1' ? 'Priority: High Marks Return' : tierKey === 'tier2' ? 'Priority: Balance Study Time' : 'Priority: Quick Revision'}
                        </span>
                        <button 
                          className="secondary-button" 
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
                          onClick={() => addSubjectPrompt(tierKey)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                          <span>Add Subject</span>
                        </button>
                      </div>
                    </div>

                    <div className="subject-grid">
                      {subjects.map(subj => (
                        <div className="subject-card" key={subj.name}>
                          <div className="subject-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3>{subj.name}</h3>
                              <span className="subject-weight">{subj.weight}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                className="icon-button" 
                                style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} 
                                onClick={() => addTopicPrompt(tierKey, subj.name)}
                                title="Add Topic"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>add</span>
                              </button>
                              <button 
                                className="icon-button" 
                                style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} 
                                onClick={() => removeSubjectConfirm(tierKey, subj.name)}
                                title="Delete Subject"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-error)' }}>delete</span>
                              </button>
                            </div>
                          </div>
                          <div className="subject-card-content">
                            {subj.topics.map(topic => {
                              const topicKey = `${subj.name}::${topic}`;
                              const currentStatus = syllabusStatus[topicKey] || "Not Started";
                              
                              const srActive = spacedRepetition.some(item => item.topic === topicKey && item.currentReviewIndex < 5);

                              return (
                                <div className="topic-row" key={topic}>
                                  <span className="topic-name">{topic}</span>
                                  <div className="topic-status-group">
                                    <button 
                                      className={`sr-trigger-btn ${srActive ? 'active-sr' : ''}`}
                                      onClick={() => scheduleSpacedRepetition(subj.name, topic)}
                                    >
                                      {srActive ? "Review Scheduled" : "Schedule Review"}
                                    </button>
                                    <select 
                                      className="status-badge-select"
                                      value={currentStatus}
                                      onChange={e => updateTopicStatus(subj.name, topic, e.target.value)}
                                    >
                                      <option value="Not Started">Not Started</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Under Revision">Under Revision</option>
                                    </select>
                                    <button 
                                      className="icon-button" 
                                      style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)', padding: 0 }} 
                                      onClick={() => removeTopicConfirm(tierKey, subj.name, topic)}
                                      title="Delete Topic"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-error)' }}>close</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* TAB 4: MISTAKE BOOK */}
          <section className={`tab-view ${activeTab === 'mistakes' ? 'active' : ''}`}>
            <div className="view-header">
              <div>
                <h1 className="view-title">Mistake Book</h1>
                <p className="view-subtitle">Write down and review your mistakes so you do not repeat them</p>
              </div>
              <button className="primary-button" onClick={() => setMistakeModalOpen(true)}>
                <span className="material-symbols-outlined">add</span>
                <span>Log Mistake</span>
              </button>
            </div>

            <div className="mistake-search-filter">
              <div className="search-box">
                <span className="material-symbols-outlined">search</span>
                <input 
                  type="text" 
                  placeholder="Search by topic or what went wrong..."
                  value={mistakeSearch}
                  onChange={e => setMistakeSearch(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <select value={mistakeFilterSubject} onChange={e => setMistakeFilterSubject(e.target.value)}>
                  <option value="all">All Subjects</option>
                  {Object.values(syllabusData).flatMap(tier => tier.map(s => s.name)).map(name => (
                    <option value={name} key={name}>{name}</option>
                  ))}
                </select>
                <select value={mistakeFilterType} onChange={e => setMistakeFilterType(e.target.value)}>
                  <option value="all">All Types of Mistakes</option>
                  <option value="Conceptual">Conceptual Error</option>
                  <option value="Calculation">Calculation Error</option>
                  <option value="Reading">Reading Error</option>
                  <option value="Silly">Silly Mistake</option>
                </select>
                <select value={mistakeFilterStatus} onChange={e => setMistakeFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="unsolved">Active (Unsolved)</option>
                  <option value="solved">Solved</option>
                </select>
              </div>
            </div>

            <div className="mistake-table-wrapper">
              <table className="mistake-table">
                <thead>
                  <tr>
                    <th>Subject & Topic</th>
                    <th>Type of Mistake</th>
                    <th>What went wrong?</th>
                    <th>How to avoid next time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mistakes
                    .filter(m => {
                      const matchesSearch = m.topic.toLowerCase().includes(mistakeSearch.toLowerCase()) || 
                                           m.description.toLowerCase().includes(mistakeSearch.toLowerCase()) || 
                                           m.corrective.toLowerCase().includes(mistakeSearch.toLowerCase());
                      const matchesSub = mistakeFilterSubject === 'all' || m.subject === mistakeFilterSubject;
                      const matchesType = mistakeFilterType === 'all' || m.type === mistakeFilterType;
                      const matchesStatus = mistakeFilterStatus === 'all' || 
                                           (mistakeFilterStatus === 'solved' && m.solved) || 
                                           (mistakeFilterStatus === 'unsolved' && !m.solved);
                      return matchesSearch && matchesSub && matchesType && matchesStatus;
                    })
                    .map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{m.topic}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ textTransform: 'uppercase' }}>{m.subject}</span>
                              <span>•</span>
                              <span>{formatDateString(m.date)}</span>
                            </div>
                          </td>
                        <td>
                          <span className={`type-badge ${m.type.toLowerCase()}`}>{m.type}</span>
                        </td>
                        <td>
                          <div style={{ maxHeight: '80px', overflowY: 'auto' }}>{m.description}</div>
                        </td>
                        <td>
                          <div style={{ maxHeight: '80px', overflowY: 'auto', color: 'var(--color-primary)', fontStyle: 'italic' }}>
                            {m.corrective}
                          </div>
                        </td>
                        <td>
                          <button 
                            className={`status-toggle-btn ${m.solved ? 'solved' : ''}`}
                            onClick={() => toggleMistakeSolved(m.id)}
                          >
                            {m.solved ? 'Solved' : 'Unsolved'}
                          </button>
                        </td>
                        <td>
                          <button className="icon-button" onClick={() => deleteMistake(m.id)} title="Delete Mistake">
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Mistake Cards (Visible only on mobile) */}
            <div className="mistake-cards-mobile-view">
              {mistakes
                .filter(m => {
                  const matchesSearch = m.topic.toLowerCase().includes(mistakeSearch.toLowerCase()) || 
                                       m.description.toLowerCase().includes(mistakeSearch.toLowerCase()) || 
                                       m.corrective.toLowerCase().includes(mistakeSearch.toLowerCase());
                  const matchesSub = mistakeFilterSubject === 'all' || m.subject === mistakeFilterSubject;
                  const matchesType = mistakeFilterType === 'all' || m.type === mistakeFilterType;
                  const matchesStatus = mistakeFilterStatus === 'all' || 
                                       (mistakeFilterStatus === 'solved' && m.solved) || 
                                       (mistakeFilterStatus === 'unsolved' && !m.solved);
                  return matchesSearch && matchesSub && matchesType && matchesStatus;
                })
                .map(m => (
                  <div className="mobile-mistake-card glass-panel" key={m.id}>
                    <div className="mobile-mistake-card-header">
                      <div className="mobile-mistake-title-grp">
                        <span className="mobile-mistake-subject">{m.subject}</span>
                        <h4 className="mobile-mistake-topic">{m.topic}</h4>
                        <span className="mobile-mistake-date" style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
                          {formatDateString(m.date)}
                        </span>
                      </div>
                      <span className={`type-badge ${m.type.toLowerCase()}`}>{m.type}</span>
                    </div>
                    <div className="mobile-mistake-body">
                      <div className="mobile-mistake-section">
                        <span className="label">What went wrong?</span>
                        <p>{m.description}</p>
                      </div>
                      <div className="mobile-mistake-section corrective">
                        <span className="label">How to avoid next time</span>
                        <p>{m.corrective}</p>
                      </div>
                    </div>
                    <div className="mobile-mistake-actions">
                      <button 
                        className={`status-toggle-btn ${m.solved ? 'solved' : ''}`}
                        onClick={() => toggleMistakeSolved(m.id)}
                      >
                        {m.solved ? 'Solved' : 'Unsolved'}
                      </button>
                      <button className="icon-button delete-mistake-btn" style={{ padding: '6px' }} onClick={() => deleteMistake(m.id)} title="Delete Mistake">
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* TAB 5: REVISION SCHEDULE */}
          <section className={`tab-view ${activeTab === 'spaced' ? 'active' : ''}`}>
            <div className="view-header">
              <div>
                <h1 className="view-title">Revision Schedule</h1>
                <p className="view-subtitle">Review topics on days 1, 2, 3, 5, and 7 to remember them longer</p>
              </div>
            </div>

            <div className="spaced-rep-layout">
              {/* Due columns */}
              <div className="spaced-column">
                <div className="column-header">
                  <h3>Due for Review</h3>
                  <span className="count-badge warning">
                    {spacedRepetition.filter(item => {
                      const nextRev = item.reviews[item.currentReviewIndex];
                      return nextRev && nextRev.scheduledDate <= todayStr && item.currentReviewIndex < 5;
                    }).length}
                  </span>
                </div>
                <div className="sr-card-list">
                  {spacedRepetition
                    .filter(item => {
                      const nextRev = item.reviews[item.currentReviewIndex];
                      return nextRev && nextRev.scheduledDate <= todayStr && item.currentReviewIndex < 5;
                    })
                    .map(sr => (
                      <div className="sr-card" key={sr.id}>
                        <div>
                          <div className="sr-card-subject">{sr.subject}</div>
                          <div className="sr-card-title">{sr.topic.split("::")[1]}</div>
                        </div>
                        <div className="sr-intervals-strip">
                          {[1, 2, 3, 5, 7].map((val, idx) => (
                            <div 
                              className={`interval-box ${idx < sr.currentReviewIndex ? 'done' : idx === sr.currentReviewIndex ? 'active' : ''}`}
                              key={val}
                            >
                              {val}d
                            </div>
                          ))}
                        </div>
                        <div className="sr-footer">
                          <span className="sr-due-date">Next: {formatDateString(sr.reviews[sr.currentReviewIndex].scheduledDate)}</span>
                          <button className="primary-button" style={{ padding: '4px 8px', fontSize: '9px' }} onClick={() => completeSRIteration(sr.id)}>
                            Done
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Future columns */}
              <div className="spaced-column">
                <div className="column-header">
                  <h3>Future Reviews</h3>
                  <span className="count-badge focus">
                    {spacedRepetition.filter(item => {
                      const nextRev = item.reviews[item.currentReviewIndex];
                      return nextRev && nextRev.scheduledDate > todayStr && item.currentReviewIndex < 5;
                    }).length}
                  </span>
                </div>
                <div className="sr-card-list">
                  {spacedRepetition
                    .filter(item => {
                      const nextRev = item.reviews[item.currentReviewIndex];
                      return nextRev && nextRev.scheduledDate > todayStr && item.currentReviewIndex < 5;
                    })
                    .map(sr => (
                      <div className="sr-card" key={sr.id}>
                        <div>
                          <div className="sr-card-subject">{sr.subject}</div>
                          <div className="sr-card-title">{sr.topic.split("::")[1]}</div>
                        </div>
                        <div className="sr-intervals-strip">
                          {[1, 2, 3, 5, 7].map((val, idx) => (
                            <div 
                              className={`interval-box ${idx < sr.currentReviewIndex ? 'done' : idx === sr.currentReviewIndex ? 'active' : ''}`}
                              key={val}
                            >
                              {val}d
                            </div>
                          ))}
                        </div>
                        <div className="sr-footer">
                          <span className="sr-due-date">Next: {formatDateString(sr.reviews[sr.currentReviewIndex].scheduledDate)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Completed column */}
              <div className="spaced-column">
                <div className="column-header">
                  <h3>Fully Revised (5/5 Reviews)</h3>
                  <span className="count-badge success">
                    {spacedRepetition.filter(item => item.currentReviewIndex >= 5).length}
                  </span>
                </div>
                <div className="sr-card-list">
                  {spacedRepetition
                    .filter(item => item.currentReviewIndex >= 5)
                    .map(sr => (
                      <div className="sr-card" key={sr.id}>
                        <div>
                          <div className="sr-card-subject">{sr.subject}</div>
                          <div className="sr-card-title">{sr.topic.split("::")[1]}</div>
                        </div>
                        <div className="sr-intervals-strip">
                          {[1, 2, 3, 5, 7].map(val => (
                            <div className="interval-box done" key={val}>
                              {val}d
                            </div>
                          ))}
                        </div>
                        <div className="sr-footer">
                          <span className="sr-due-date">Fully Mastered</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>

      {/* PLANNER TASK ENTRY MODAL */}
      {taskModalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
              <button className="icon-button" onClick={closeTaskModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Task Type</label>
                <div className="type-selector">
                  <label className="type-option">
                    <input type="radio" name="entry-type" value="study" defaultChecked={!editingTask || editingTask.type === 'study'} />
                    <div className="option-card type-study">
                      <span className="material-symbols-outlined">school</span>
                      <span>Study Task</span>
                    </div>
                  </label>
                  <label className="type-option">
                    <input type="radio" name="entry-type" value="shift" defaultChecked={editingTask && editingTask.type === 'shift'} />
                    <div className="option-card type-shift">
                      <span className="material-symbols-outlined">work</span>
                      <span>Work Shift</span>
                    </div>
                  </label>
                  <label className="type-option">
                    <input type="radio" name="entry-type" value="note" defaultChecked={editingTask && editingTask.type === 'note'} />
                    <div className="option-card type-note">
                      <span className="material-symbols-outlined">sticky_note_2</span>
                      <span>Quick Note</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input 
                  type="text" 
                  id="task-title" 
                  name="task-title" 
                  required 
                  defaultValue={editingTask ? editingTask.title : ''} 
                  placeholder="e.g. Master Operating System Mutexes" 
                />
              </div>

              <div className="form-row form-row-picker">
                <TimePicker12h 
                  label="Start Time" 
                  value={taskStart} 
                  onChange={setTaskStart} 
                />
                <TimePicker12h 
                  label="End Time" 
                  value={taskEnd} 
                  onChange={setTaskEnd} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-desc">Description / Task Goal</label>
                <textarea 
                  id="task-desc" 
                  name="task-desc" 
                  rows="3" 
                  defaultValue={editingTask ? editingTask.desc : ''} 
                  placeholder="Write down what you plan to accomplish..."
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeTaskModal}>Cancel</button>
                <button type="submit" className="primary-button">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MISTAKE MODAL */}
      {mistakeModalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Log a new mistake</h2>
              <button className="icon-button" onClick={() => setMistakeModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleMistakeSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mistake-subject">Subject</label>
                  <select id="mistake-subject" name="mistake-subject" required>
                    {Object.values(syllabusData).flatMap(tier => tier.map(s => s.name)).map(name => (
                      <option value={name} key={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mistake-topic">Topic Name</label>
                  <input type="text" id="mistake-topic" name="mistake-topic" required placeholder="e.g. Recursion in C" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mistake-type">Type of Mistake</label>
                <select id="mistake-type" name="mistake-type" required>
                  <option value="Conceptual">Conceptual (Did not know the theory)</option>
                  <option value="Calculation">Calculation (Math error)</option>
                  <option value="Reading">Reading (Missed details in question)</option>
                  <option value="Silly">Silly Mistake (Small mistake)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mistake-description">What went wrong?</label>
                <textarea id="mistake-description" name="mistake-description" required rows="3" placeholder="What exactly did you do? Write down your reasoning."></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="mistake-corrective">How to avoid next time</label>
                <textarea id="mistake-corrective" name="mistake-corrective" required rows="3" placeholder="What rules will you follow next time to avoid this mistake?"></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setMistakeModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Mistake</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOCUS OVERLAY SCREEN */}
      {focusModeActive && (
        <div className="focus-overlay active">
          <div className="focus-container">
            <header className="focus-header">
              <div className="focus-logo">
                <span className="material-symbols-outlined pulsing">nights_stay</span>
                <span>DEEP STUDY MODE</span>
              </div>
              <div className="focus-meta">
                <span className="session-phase">{focusPhase}</span>
              </div>
              <button className="exit-focus-btn" onClick={exitFocusMode}>
                <span className="material-symbols-outlined">logout</span>
                <span>Exit Study Mode</span>
              </button>
            </header>

            <div className="focus-content">
              {/* Big Clock Ring */}
              <div className="focus-timer-ring">
                <svg className="timer-svg" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="timer3dGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00a4cc" />
                      <stop offset="30%" stopColor="#4cd7f6" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="70%" stopColor="#4cd7f6" />
                      <stop offset="100%" stopColor="#007390" />
                    </linearGradient>
                    <filter id="timerDropShadow" x="-15%" y="-15%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.95" />
                    </filter>
                  </defs>
                  {/* Outer Bevel reflection ring */}
                  <circle className="timer-bevel-outer" cx="50" cy="50" r="48" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8"></circle>
                  {/* Hollow track groove */}
                  <circle className="timer-bg" cx="50" cy="50" r="45"></circle>
                  {/* Inner Bevel shadow ring */}
                  <circle className="timer-bevel-inner" cx="50" cy="50" r="42" fill="none" stroke="rgba(0, 0, 0, 0.8)" strokeWidth="0.8"></circle>
                  {/* 3D cylindrical glowing progress circle */}
                  <circle 
                    className="timer-fg" 
                    id="focus-timer-fg" 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    stroke="url(#timer3dGlow)"
                    filter="url(#timerDropShadow)"
                    strokeDasharray="282.7" 
                    style={{ strokeDashoffset: 282.7 - (282.7 * focusRemaining) / focusDuration }}
                  ></circle>
                </svg>
                <div className="focus-timer-time">
                  {`${Math.floor(focusRemaining / 60).toString().padStart(2, '0')}:${(focusRemaining % 60).toString().padStart(2, '0')}`}
                </div>
              </div>

              {/* Goal Setup Box */}
              <div className="focus-goal-box">
                {!focusGoalLocked ? (
                  <div>
                    <p className="focus-prompt">What topic are you studying right now?</p>
                    <div className="focus-goal-input-group">
                      <input 
                        type="text" 
                        placeholder="e.g. Practice questions on regular expressions" 
                        value={focusGoal} 
                        onChange={e => setFocusGoal(e.target.value)} 
                      />
                      <button className="primary-button" onClick={startFocusSession}>Start Timer</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="label-sm font-bold text-primary" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                      CURRENT TOPIC
                    </span>
                    <h2 className="active-goal-text">{focusGoal}</h2>
                    <div className="timer-controls">
                      <button className="icon-button active-glow" onClick={() => setFocusIsRunning(!focusIsRunning)}>
                        <span className="material-symbols-outlined">
                          {focusIsRunning ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <button className="icon-button" onClick={skipFocusPhase}>
                        <span className="material-symbols-outlined">skip_next</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Synthesizer Ambient Noise Toggles */}
              <div className="focus-extras">
                <div className="focus-ambient">
                  <span className="ambient-title">Background Focus Sounds</span>
                  <div className="ambient-controls">
                    <button 
                      className={`ambient-btn ${focusAmbientSound === 'binaural' ? 'active' : ''}`}
                      onClick={() => toggleSound("binaural")}
                    >
                      <span className="material-symbols-outlined">graphic_eq</span>
                      <span>Study Sound</span>
                    </button>
                    <button 
                      className={`ambient-btn ${focusAmbientSound === 'rain' ? 'active' : ''}`}
                      onClick={() => toggleSound("rain")}
                    >
                      <span className="material-symbols-outlined">water_drop</span>
                      <span>Rain Sound</span>
                    </button>
                  </div>
                  <div className="volume-slider-group">
                    <span className="material-symbols-outlined">volume_down</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={focusVolume} 
                      onChange={e => setFocusVolume(parseFloat(e.target.value))} 
                    />
                    <span className="material-symbols-outlined">volume_up</span>
                  </div>
                </div>

                <div className="focus-quick-mistake">
                  <span className="ambient-title">Quick Mistake Logger</span>
                  <div className="focus-mistake-form">
                    <input 
                      type="text" 
                      placeholder="What mistake did you just make?" 
                      value={focusQuickMistake} 
                      onChange={e => setFocusQuickMistake(e.target.value)} 
                    />
                    <button className="danger-button" onClick={handleFocusQuickMistakeSubmit}>
                      <span className="material-symbols-outlined">add_alert</span>
                      <span>Save Mistake</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {subjectModalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Subject</h2>
              <button className="icon-button" onClick={() => setSubjectModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!subjectInputName.trim()) return;
              const newSubj = {
                name: subjectInputName.trim(),
                weight: subjectInputWeight.trim() || "4 Marks",
                topics: []
              };
              setSyllabusData(prev => ({
                ...prev,
                [subjectModalTier]: [...prev[subjectModalTier], newSubj]
              }));
              setSubjectModalOpen(false);
              setSubjectInputName("");
              setSubjectInputWeight("");
            }}>
              <div className="form-group">
                <label htmlFor="subj-name">Subject Name</label>
                <input 
                  type="text" 
                  id="subj-name" 
                  required 
                  value={subjectInputName} 
                  onChange={(e) => setSubjectInputName(e.target.value)} 
                  placeholder="e.g. Software Engineering" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="subj-weight">Marks Weightage (e.g. 5 Marks)</label>
                <input 
                  type="text" 
                  id="subj-weight" 
                  value={subjectInputWeight} 
                  onChange={(e) => setSubjectInputWeight(e.target.value)} 
                  placeholder="e.g. 4 Marks" 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setSubjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TOPIC MODAL */}
      {topicModalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Topic to {topicModalSubject}</h2>
              <button className="icon-button" onClick={() => setTopicModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!topicInputName.trim()) return;
              
              let isDuplicate = false;
              setSyllabusData(prev => {
                const updatedTier = prev[topicModalTier].map(s => {
                  if (s.name === topicModalSubject) {
                    if (s.topics.includes(topicInputName.trim())) {
                      isDuplicate = true;
                      return s;
                    }
                    return {
                      ...s,
                      topics: [...s.topics, topicInputName.trim()]
                    };
                  }
                  return s;
                });
                if (isDuplicate) return prev;
                return {
                  ...prev,
                  [topicModalTier]: updatedTier
                };
              });
              
              if (isDuplicate) {
                showToast("This topic already exists in this subject.", "warning");
                return;
              }
              
              setTopicModalOpen(false);
              setTopicInputName("");
            }}>
              <div className="form-group">
                <label htmlFor="topic-name-input">Topic Name</label>
                <input 
                  type="text" 
                  id="topic-name-input" 
                  required 
                  value={topicInputName} 
                  onChange={(e) => setTopicInputName(e.target.value)} 
                  placeholder="e.g. System Calls & API" 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setTopicModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModalOpen && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Action</h2>
              <button className="icon-button" onClick={() => setConfirmModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ margin: '16px 0', fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: '1.5' }}>
              {confirmModalMessage}
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                className="primary-button" 
                style={{ backgroundColor: 'var(--color-error)' }}
                onClick={() => {
                  if (confirmModalCallback) confirmModalCallback();
                  setConfirmModalOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROUTINE MODAL */}
      {routineEditOpen && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Edit Daily Chronobiological Routine</h2>
              <button className="icon-button" onClick={() => setRoutineEditOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-scroll-area" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', margin: '16px 0' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '16px' }}>
                Customize your daily timeline steps. Shift operational hours will still be displayed in the sidebar.
              </p>
              
              {tempRoutine.map((step, idx) => (
                <div key={idx} style={{ 
                  background: 'var(--color-surface-container)', 
                  border: '1px solid var(--color-outline-variant)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '12px', 
                  marginBottom: '12px'
                }}>
                  <div className="form-row" style={{ marginBottom: '8px', display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Step Title</label>
                      <input 
                        type="text" 
                        value={step.name} 
                        onChange={(e) => {
                          const copy = [...tempRoutine];
                          copy[idx].name = e.target.value;
                          setTempRoutine(copy);
                        }} 
                      />
                                     <div className="form-group" style={{ flex: 1 }}>
                      <TimePicker12h 
                        label="Start Time"
                        value={step.start} 
                        onChange={(newVal) => {
                          const copy = [...tempRoutine];
                          copy[idx].start = newVal;
                          setTempRoutine(copy);
                        }} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <TimePicker12h 
                        label="End Time"
                        value={step.end} 
                        onChange={(newVal) => {
                          const copy = [...tempRoutine];
                          copy[idx].end = newVal;
                          setTempRoutine(copy);
                        }} 
                      />
                    </div>    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Description</label>
                    <input 
                      type="text" 
                      value={step.desc} 
                      onChange={(e) => {
                        const copy = [...tempRoutine];
                        copy[idx].desc = e.target.value;
                        setTempRoutine(copy);
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-button" style={{ marginRight: 'auto' }} onClick={() => {
                if (window.confirm("Reset all steps to defaults calibrated from your shift times?")) {
                  setTempRoutine(getChronoRoutine(shiftStart, shiftEnd));
                }
              }}>Reset to Default</button>
              <button type="button" className="secondary-button" onClick={() => setRoutineEditOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => {
                setRoutine(tempRoutine);
                setRoutineEditOpen(false);
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="logo-area">
                <span className="material-symbols-outlined logo-symbol">settings_accessibility</span>
                <span className="logo-text">SYSTEM MENU</span>
              </div>
              <button className="icon-button close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mobile-menu-body">
              <div className="mobile-menu-section">
                <span className="menu-section-title">ALL MODULES</span>
                <div className="mobile-nav-grid">
                  <button className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined mobile-nav-icon">dashboard</span>
                    <span className="mobile-nav-title">Dashboard</span>
                  </button>
                  <button className={`mobile-nav-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => { setActiveTab('planner'); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined mobile-nav-icon">calendar_month</span>
                    <span className="mobile-nav-title">Daily Study Planner</span>
                  </button>
                  <button className={`mobile-nav-item ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => { setActiveTab('syllabus'); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined mobile-nav-icon">menu_book</span>
                    <span className="mobile-nav-title">Syllabus Tracker</span>
                  </button>
                  <button className={`mobile-nav-item ${activeTab === 'mistakes' ? 'active' : ''}`} onClick={() => { setActiveTab('mistakes'); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined mobile-nav-icon">error</span>
                    <span className="mobile-nav-title">Mistake Book</span>
                  </button>
                  <button className={`mobile-nav-item ${activeTab === 'spaced' ? 'active' : ''}`} onClick={() => { setActiveTab('spaced'); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined mobile-nav-icon">history</span>
                    <span className="mobile-nav-title">Revision Schedule</span>
                  </button>
                </div>
              </div>

              <div className="mobile-menu-section" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span className="menu-section-title">QUICK ACTIONS</span>
                <div className="mobile-menu-actions-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="primary-button mobile-focus-btn" style={{ justifyContent: 'center' }} onClick={() => { setFocusModeActive(true); setIsMobileMenuOpen(false); }}>
                    <span className="material-symbols-outlined" style={{ marginRight: '8px' }}>timer</span>
                    <span>Start Live Study Session</span>
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="secondary-button" style={{ flex: 1, height: '40px', justifyContent: 'center' }} onClick={() => { setShowOnboarding(true); setIsMobileMenuOpen(false); }}>
                      <span className="material-symbols-outlined" style={{ marginRight: '6px' }}>settings</span>
                      <span>Setup Shift</span>
                    </button>
                    <button className="secondary-button mobile-logout-btn" style={{ flex: 1, height: '40px', justifyContent: 'center', margin: 0 }} onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                      <span className="material-symbols-outlined" style={{ marginRight: '6px' }}>logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-notification ${toast.type}`}>
            <span className="material-symbols-outlined toast-icon">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
