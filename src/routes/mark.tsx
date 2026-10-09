import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { saveDB, useDB, type Status } from "@/lib/attendance";
import { Card, btn, input } from "@/lib/ui";

export const Route = createFileRoute("/mark")({
  head: () => ({
    meta: [
      { title: "Mark Attendance — AttendEase" },
      { name: "description", content: "Mark daily attendance class-wise for any subject and date." },
      { property: "og:title", content: "Mark Attendance — AttendEase" },
      { property: "og:description", content: "Mark students present or absent for a class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarkPage,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function MarkPage() {
  const db = useDB();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!date) setDate(todayISO());
  }, [date]);

  useEffect(() => {
    if (!subject && db.subjects[0]) setSubject(db.subjects[0].code);
  }, [db.subjects, subject]);

  // Load the saved session (if any) whenever class, date or roster changes.
  useEffect(() => {
    if (!subject || !date) return;
    const existing = db.sessions.find((s) => s.date === date && s.subject === subject);
    const next: Record<string, Status> = {};
    for (const st of db.students) next[st.roll] = existing?.status[st.roll] ?? "P";
    setStatus(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, date, db.students.length]);

  const toggle = (roll: string, v: Status) => setStatus((s) => ({ ...s, [roll]: v }));
  const markAll = (v: Status) => {
    const next: Record<string, Status> = {};
    for (const st of db.students) next[st.roll] = v;
    setStatus(next);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !date) return setMsg({ ok: false, text: "Pick a subject and date first." });
    if (db.students.length === 0) return setMsg({ ok: false, text: "Add students first." });
    const present = Object.values(status).filter((v) => v === "P").length;
    const absent = db.students.length - present;
    const sessions = [
      ...db.sessions.filter((s) => !(s.date === date && s.subject === subject)),
      { date, subject, status },
    ].sort((a, b) => (a.date < b.date ? -1 : 1));
    saveDB({ ...db, sessions });
    setMsg({
      ok: true,
      text: `Saved — ${present} present, ${absent} absent (${subjectName(subject)}, ${date}).`,
    });
  };

  const subjectName = (code: string) => db.subjects.find((s) => s.code === code)?.name ?? code;
  const present = Object.values(status).filter((v) => v === "P").length;
  const existing = subject && date ? db.sessions.find((s) => s.date === date && s.subject === subject) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mark Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the class and date, tap Present or Absent for each student, then save.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Class details">
          <form onSubmit={save} className="space-y-3">
            <select className={input} value={subject} onChange={(e) => setSubject(e.target.value)}>
              {db.subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
            <input
              className={input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm hover:bg-accent" onClick={() => markAll("P")}>
                All present
              </button>
              <button type="button" className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm hover:bg-accent" onClick={() => markAll("A")}>
                All absent
              </button>
            </div>
            <button className={`${btn} w-full`}>
              {existing ? "Update attendance" : "Save attendance"}
            </button>
            {existing && (
              <p className="text-xs text-warning">
                A session for this class and date already exists — saving will overwrite it.
              </p>
            )}
            {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card
            title={`Students — ${present} present · ${db.students.length - present} absent`}
          >
            {db.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No students yet. Add them under "Students &amp; Subjects".
              </p>
            ) : (
              <ul className="divide-y">
                {db.students.map((st) => {
                  const v = status[st.roll] ?? "P";
                  return (
                    <li key={st.roll} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{st.roll}</span>{" "}
                        {st.name}
                      </span>
                      <span className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggle(st.roll, "P")}
                          className={`rounded-md border px-3 py-1 text-xs font-medium ${
                            v === "P"
                              ? "border-success bg-success/15 text-success"
                              : "border-input text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(st.roll, "A")}
                          className={`rounded-md border px-3 py-1 text-xs font-medium ${
                            v === "A"
                              ? "border-destructive bg-destructive/15 text-destructive"
                              : "border-input text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          Absent
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
