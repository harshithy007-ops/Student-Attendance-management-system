import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { saveDB, useDB, type Student, type Subject } from "@/lib/attendance";
import { Card, btn, btnDanger, input } from "@/lib/ui";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students & Subjects — AttendEase" },
      { name: "description", content: "Add or remove students and subjects for attendance tracking." },
      { property: "og:title", content: "Students & Subjects — AttendEase" },
      { property: "og:description", content: "Manage the student roster and subject list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

const DEPTS = ["CSE", "IT", "ECE", "EEE", "ME", "CE"];

function StudentsPage() {
  const db = useDB();
  const [sf, setSf] = useState({ roll: "", name: "", dept: "CSE", sem: "5" });
  const [sub, setSub] = useState({ code: "", name: "" });
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const roll = sf.roll.trim().toUpperCase();
    const name = sf.name.trim();
    if (!roll || !name) return setMsg({ ok: false, text: "Enter both roll number and name." });
    if (db.students.some((s) => s.roll === roll))
      return setMsg({ ok: false, text: `Roll number ${roll} already exists.` });
    const student: Student = { roll, name, dept: sf.dept, sem: sf.sem };
    saveDB({ ...db, students: [...db.students, student] });
    setSf({ roll: "", name: "", dept: sf.dept, sem: sf.sem });
    setMsg({ ok: true, text: `${name} added.` });
  };

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const code = sub.code.trim().toUpperCase();
    const name = sub.name.trim();
    if (!code || !name) return setMsg({ ok: false, text: "Enter both subject code and name." });
    if (db.subjects.some((s) => s.code === code))
      return setMsg({ ok: false, text: `Subject code ${code} already exists.` });
    const subject: Subject = { code, name };
    saveDB({ ...db, subjects: [...db.subjects, subject] });
    setSub({ code: "", name: "" });
    setMsg({ ok: true, text: `${name} added.` });
  };

  const list = db.students.filter((s) =>
    (s.roll + s.name + s.dept).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Students &amp; Subjects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintain the class roster and the subjects you take attendance for.
        </p>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Add student">
          <form onSubmit={addStudent} className="space-y-3">
            <input
              className={input}
              placeholder="Roll number (e.g. CS2311)"
              value={sf.roll}
              onChange={(e) => setSf({ ...sf, roll: e.target.value })}
            />
            <input
              className={input}
              placeholder="Full name"
              value={sf.name}
              onChange={(e) => setSf({ ...sf, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <select className={input} value={sf.dept} onChange={(e) => setSf({ ...sf, dept: e.target.value })}>
                {DEPTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <select className={input} value={sf.sem} onChange={(e) => setSf({ ...sf, sem: e.target.value })}>
                {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <button className={btn}>Add student</button>
          </form>
        </Card>

        <Card title="Add subject">
          <form onSubmit={addSubject} className="space-y-3">
            <input
              className={input}
              placeholder="Subject code (e.g. CS505)"
              value={sub.code}
              onChange={(e) => setSub({ ...sub, code: e.target.value })}
            />
            <input
              className={input}
              placeholder="Subject name (e.g. Software Engineering)"
              value={sub.name}
              onChange={(e) => setSub({ ...sub, name: e.target.value })}
            />
            <button className={btn}>Add subject</button>
          </form>

          <ul className="mt-4 divide-y border-t pt-2">
            {db.subjects.map((s) => (
              <li key={s.code} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{s.code}</span> {s.name}
                </span>
                <button
                  onClick={() =>
                    saveDB({ ...db, subjects: db.subjects.filter((x) => x.code !== s.code) })
                  }
                  className={btnDanger}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="lg:col-span-1">
          <Card title={`Students (${db.students.length})`}>
            <input
              className={`${input} mb-3`}
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul className="max-h-96 divide-y overflow-y-auto">
              {list.map((s) => (
                <li key={s.roll} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{s.roll}</span> {s.name}
                    <span className="block text-xs text-muted-foreground">
                      {s.dept} · Semester {s.sem}
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      saveDB({ ...db, students: db.students.filter((x) => x.roll !== s.roll) })
                    }
                    className={btnDanger}
                  >
                    Delete
                  </button>
                </li>
              ))}
              {list.length === 0 && (
                <li className="py-2 text-sm text-muted-foreground">No students match.</li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
