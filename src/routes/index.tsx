import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { attendanceFor, classAverage, DEFAULT_THRESHOLD, overallPct, useDB } from "@/lib/attendance";
import { Card } from "@/lib/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendEase — College Attendance Management" },
      { name: "description", content: "Track student attendance subject-wise, mark daily classes and monitor defaulters below 75%." },
      { property: "og:title", content: "AttendEase — College Attendance Management" },
      { property: "og:description", content: "Mark daily attendance, manage students and subjects, and view attendance reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB();

  const stats = useMemo(
    () => [
      ["Students", String(db.students.length)],
      ["Subjects", String(db.subjects.length)],
      ["Classes held", String(db.sessions.length)],
      ["Overall attendance", overallPct(db) + "%"],
    ],
    [db],
  );

  const defaulters = useMemo(
    () =>
      db.students
        .map((s) => ({ ...s, ...attendanceFor(db, s.roll) }))
        .filter((s) => s.total > 0 && s.pct < DEFAULT_THRESHOLD)
        .sort((a, b) => a.pct - b.pct),
    [db],
  );

  const recent = useMemo(() => db.sessions.slice(-6).reverse(), [db]);
  const subjectName = (code: string) => db.subjects.find((s) => s.code === code)?.name ?? code;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick overview of attendance across all classes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-5">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Students below ${DEFAULT_THRESHOLD}%`}>
          {defaulters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Everyone is at or above {DEFAULT_THRESHOLD}% attendance. Well done!
            </p>
          ) : (
            <ul className="divide-y">
              {defaulters.map((s) => (
                <li key={s.roll} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{s.roll}</span>{" "}
                    {s.name}
                  </span>
                  <span className="font-medium text-destructive">
                    {s.present}/{s.total} · {s.pct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent classes">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes recorded yet. Mark one in "Mark Attendance".</p>
          ) : (
            <ul className="divide-y">
              {recent.map((sess, i) => {
                const present = Object.values(sess.status).filter((v) => v === "P").length;
                const total = Object.values(sess.status).length;
                return (
                  <li key={sess.date + sess.subject + i} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="font-mono text-xs text-muted-foreground">{sess.date}</span>{" "}
                      {subjectName(sess.subject)}
                    </span>
                    <span className="font-medium text-success">
                      {present}/{total} present
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Subject-wise class average">
        {db.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects added yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {db.subjects.map((sub) => {
              const avg = classAverage(db, sub.code);
              return (
                <div key={sub.code} className="rounded-md border p-4">
                  <div className="font-mono text-xs text-muted-foreground">{sub.code}</div>
                  <div className="mt-0.5 text-sm font-medium">{sub.name}</div>
                  <div
                    className={`mt-2 text-xl font-semibold ${
                      avg < DEFAULT_THRESHOLD ? "text-destructive" : avg < 90 ? "text-warning" : "text-success"
                    }`}
                  >
                    {avg}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
