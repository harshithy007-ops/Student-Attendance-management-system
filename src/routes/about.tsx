import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_THRESHOLD } from "@/lib/attendance";
import { Card } from "@/lib/ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — AttendEase" },
      { name: "description", content: "About this college mini project: a college attendance management system." },
      { property: "og:title", content: "About the Project — AttendEase" },
      { property: "og:description", content: "A college attendance management system mini project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="max-w-2xl space-y-4 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold">About this project</h1>
        <p className="mt-2 text-muted-foreground">
          AttendEase is a college attendance management system. It replaces the usual paper register
          or spreadsheet with a simple web app: maintain the student list, take attendance class by
          class, and get instant reports on who is falling short.
        </p>
      </div>

      <Card title="Modules covered">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Dashboard</b> — overall attendance, students below the {DEFAULT_THRESHOLD}% cut-off
            and recent classes at a glance.
          </li>
          <li>
            <b>Students &amp; Subjects</b> — add or remove students (roll number, name, department,
            semester) and the subjects you teach.
          </li>
          <li>
            <b>Mark Attendance</b> — pick a subject and date, mark each student Present or Absent
            (with "All present" shortcuts), and save. Saving again for the same class/date updates
            it.
          </li>
          <li>
            <b>Reports</b> — student-wise attendance percentage for every subject, class averages,
            and a defaulters list (below {DEFAULT_THRESHOLD}%).
          </li>
        </ul>
      </Card>

      <Card title="How it works">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Attendance percentage = classes present ÷ total classes held × 100, calculated per
            subject and overall.
          </li>
          <li>
            The {DEFAULT_THRESHOLD}% attendance rule follows the standard university requirement to
            be eligible for end-semester exams.
          </li>
          <li>
            All data is stored in your own browser — nothing is sent to a server. The app comes with
            sample students, subjects and a few weeks of attendance so you can explore the reports
            immediately; delete them and add your own real data.
          </li>
        </ul>
      </Card>

      <p className="text-muted-foreground">
        Built as a college mini project. Send me your name, college and project title and I'll add
        them to this page.
      </p>
    </div>
  );
}
