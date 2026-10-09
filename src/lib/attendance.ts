import { useEffect, useSyncExternalStore } from "react";

export type Status = "P" | "A";
export type Student = { roll: string; name: string; dept: string; sem: string };
export type Subject = { code: string; name: string };
export type Session = { date: string; subject: string; status: Record<string, Status> };
export type DB = { students: Student[]; subjects: Subject[]; sessions: Session[] };

const KEY = "attendease_db_v1";

const SUBJECTS: Subject[] = [
  { code: "CS501", name: "Data Structures" },
  { code: "CS502", name: "Database Management Systems" },
  { code: "CS503", name: "Operating Systems" },
  { code: "CS504", name: "Computer Networks" },
];

const STUDENTS: Student[] = [
  { roll: "CS2301", name: "Aarav Sharma", dept: "CSE", sem: "5" },
  { roll: "CS2302", name: "Diya Patel", dept: "CSE", sem: "5" },
  { roll: "CS2303", name: "Rohan Gupta", dept: "CSE", sem: "5" },
  { roll: "CS2304", name: "Ananya Iyer", dept: "CSE", sem: "5" },
  { roll: "CS2305", name: "Vikram Reddy", dept: "CSE", sem: "5" },
  { roll: "CS2306", name: "Sneha Nair", dept: "CSE", sem: "5" },
  { roll: "CS2307", name: "Arjun Mehta", dept: "CSE", sem: "5" },
  { roll: "CS2308", name: "Kavya Rao", dept: "CSE", sem: "5" },
  { roll: "CS2309", name: "Ishan Das", dept: "CSE", sem: "5" },
  { roll: "CS2310", name: "Priya Chatterjee", dept: "CSE", sem: "5" },
];

// Small deterministic PRNG so the sample data is stable.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function seedDB(): DB {
  const rnd = mulberry32(42);
  const sessions: Session[] = [];
  const today = new Date();
  for (let back = 25; back >= 1; back--) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const sub of SUBJECTS) {
      const status: Record<string, Status> = {};
      for (const st of STUDENTS) status[st.roll] = rnd() < 0.85 ? "P" : "A";
      sessions.push({ date: isoDate(d), subject: sub.code, status });
    }
  }
  return { students: STUDENTS, subjects: SUBJECTS, sessions };
}

let cache: DB = seedDB();
let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

/** Load the user's saved data from the browser (runs once, client-side). */
export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) cache = JSON.parse(raw) as DB;
  } catch {
    /* corrupted data — keep seed */
  }
  emit();
}

export function saveDB(db: DB) {
  cache = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked — keep in memory */
  }
  emit();
}

export function useDB(): DB {
  const db = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => {
    hydrate();
  }, []);
  return db;
}

export function attendanceFor(db: DB, roll: string, subject?: string) {
  let present = 0;
  let total = 0;
  for (const s of db.sessions) {
    if (subject && s.subject !== subject) continue;
    const v = s.status[roll];
    if (v) {
      total++;
      if (v === "P") present++;
    }
  }
  return { present, total, pct: total ? Math.round((present / total) * 100) : 0 };
}

export function classAverage(db: DB, subject?: string) {
  const vals = db.students
    .map((s) => attendanceFor(db, s.roll, subject))
    .filter((a) => a.total > 0)
    .map((a) => a.pct);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((x, y) => x + y, 0) / vals.length);
}

export function overallPct(db: DB) {
  return classAverage(db);
}

export const DEFAULT_THRESHOLD = 75;
