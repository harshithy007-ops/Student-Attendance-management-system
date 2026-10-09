import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { attendanceFor, classAverage, DEFAULT_THRESHOLD, useDB } from "@/lib/attendance";
import { Card } from "@/lib/ui";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AttendEase" },
      { name: "description", content: "Subject-wise attendance percentage for every student, with defaulters below 75%." },
      { property: "og:title", content: "Reports — AttendEase" },
      { property: "og:description", content: "Student-wise and subject-wise attendance reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function pctColor(pct: number) {
  return pct < DEFAULT_THRESHOLD ? "text-destructive" : pct < 90 ? "text-warning" : "text-success";
}

function ReportsPage() {
  const db = useDB();

  const rows = useMemo(
    () =>
      db.students.map((st) => ({
        ...st,
        perSubject: Object.fromEntries(
          db.subjects.map((sub) => [sub.code, attendanceFor(db, st.roll, sub.code)]),
        ),
        overall: attendanceFor(db, st.roll),
      })),
    [db],
  );

  const subjectSummary = useMemo(
    () =>
      db.subjects.map((sub) => ({
        ...sub,
        classes: db.sessions.filter((s) => s.subject === sub.code).length,
        avg: classAverage(db, sub.code),
      })),
    [db],
  );

  const defaulters = rows.filter((r) => r.overall.total > 0 && r.overall.pct < DEFAULT_THRESHOLD);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Attendance percentage per student, subject-wise. Students below {DEFAULT_THRESHOLD}% are
          flagged as defaulters.
        </p>
      </div>

      <Card title={`Defaulters (below ${DEFAULT_THRESHOLD}%)`}>
        {defaulters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No defaulters right now.</p>
        ) : (
          <ul className="divide-y">
            {defaulters.map((r) => (
              <li key={r.roll} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{r.roll}</span> {r.name}
                </span>
                <span className="font-medium text-destructive">
                  {r.overall.pct}% ({r.overall.present}/{r.overall.total})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Student-wise attendance (%)">
        {db.students.length === 0 || db.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add students and subjects to see reports.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Roll No</th>
                  <th className="py-2 pr-3">Name</th>
                  {db.subjects.map((s) => (
                    <th key={s.code} className="py-2 pr-3 text-right" title={s.name}>
                      {s.code}
                    </th>
                  ))}
                  <th className="py-2 text-right">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.roll}>
                    <td className="py-2 pr-3 font-mono text-xs">{r.roll}</td>
                    <td className="py-2 pr-3">{r.name}</td>
                    {db.subjects.map((s) => {
                      const a = r.perSubject[s.code]!;
                      return (
                        <td
                          key={s.code}
                          className={`py-2 pr-3 text-right ${a.total ? pctColor(a.pct) : "text-muted-foreground"}`}
                        >
                          {a.total ? `${a.pct}%` : "—"}
                        </td>
                      );
                    })}
                    <td className={`py-2 text-right font-semibold ${pctColor(r.overall.pct)}`}>
                      {r.overall.total ? `${r.overall.pct}%` : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2">
                  <td className="py-2 pr-3 text-xs font-semibold uppercase text-muted-foreground" colSpan={2}>
                    Class average
                  </td>
                  {subjectSummary.map((s) => (
                    <td key={s.code} className={`py-2 pr-3 text-right font-medium ${pctColor(s.avg)}`}>
                      {s.avg}%
                    </td>
                  ))}
                  <td className={`py-2 text-right font-semibold ${pctColor(classAverage(db))}`}>
                    {classAverage(db)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Subject summary">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjectSummary.map((s) => (
            <div key={s.code} className="rounded-md border p-4">
              <div className="font-mono text-xs text-muted-foreground">{s.code}</div>
              <div className="mt-0.5 text-sm font-medium">{s.name}</div>
              <div className="mt-2 text-xs text-muted-foreground">{s.classes} classes held</div>
              <div className={`mt-1 text-xl font-semibold ${pctColor(s.avg)}`}>{s.avg}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
