import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MiniMM — SAP Inventory Management Mini Project" },
      { name: "description", content: "A college mini project simulating SAP MM: material master, stock movements and inventory reports." },
      { property: "og:title", content: "MiniMM — SAP Inventory Management Mini Project" },
      { property: "og:description", content: "Material master, goods receipt/issue and stock reports inspired by SAP MM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Material = { id: string; name: string; group: string; uom: string; price: number; stock: number; reorder: number };
type Movement = { id: string; date: string; material: string; type: "101" | "201"; qty: number };

const SEED: Material[] = [
  { id: "MAT-1001", name: "Steel Bolt M8", group: "Raw Material", uom: "PC", price: 4.5, stock: 1200, reorder: 300 },
  { id: "MAT-1002", name: "Copper Wire 2mm", group: "Raw Material", uom: "M", price: 18, stock: 140, reorder: 200 },
  { id: "MAT-2001", name: "Control Panel", group: "Finished Good", uom: "PC", price: 5400, stock: 25, reorder: 10 },
  { id: "MAT-3001", name: "Packing Box L", group: "Packaging", uom: "PC", price: 22, stock: 60, reorder: 100 },
];

const TABS = [
  { code: "MM60", label: "Dashboard" },
  { code: "MM01", label: "Material Master" },
  { code: "MIGO", label: "Goods Movement" },
  { code: "MB51", label: "Movement Log" },
  { code: "INFO", label: "About Project" },
] as const;
type Tab = (typeof TABS)[number]["code"];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const input = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90";

function App() {
  const [tab, setTab] = useState<Tab>("MM60");
  const [mats, setMats] = useState<Material[]>(SEED);
  const [moves, setMoves] = useState<Movement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cmd, setCmd] = useState("");

  useEffect(() => {
    const m = localStorage.getItem("mm_mats");
    const v = localStorage.getItem("mm_moves");
    if (m) setMats(JSON.parse(m));
    if (v) setMoves(JSON.parse(v));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("mm_mats", JSON.stringify(mats));
    localStorage.setItem("mm_moves", JSON.stringify(moves));
  }, [mats, moves, loaded]);

  const runCmd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = TABS.find((x) => x.code === cmd.trim().toUpperCase());
    if (t) setTab(t.code);
    setCmd("");
  };

  return (
    <div className="min-h-screen">
      <header className="bg-shell text-shell-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="font-mono text-lg font-semibold">Mini<span className="text-accent">MM</span></div>
          <form onSubmit={runCmd} className="flex items-center gap-2">
            <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="T-code e.g. MIGO"
              className="w-40 rounded-md bg-shell-foreground/10 px-3 py-1.5 font-mono text-sm outline-none placeholder:text-shell-foreground/50" />
          </form>
          <span className="ml-auto text-xs text-shell-foreground/70">SAP MM Simulation · College Mini Project</span>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button key={t.code} onClick={() => setTab(t.code)}
              className={`whitespace-nowrap rounded-t-md px-4 py-2 text-sm ${tab === t.code ? "bg-background text-foreground" : "text-shell-foreground/70 hover:text-shell-foreground"}`}>
              <span className="mr-1.5 font-mono text-xs opacity-60">{t.code}</span>{t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "MM60" && <Dashboard mats={mats} moves={moves} />}
        {tab === "MM01" && <MaterialMaster mats={mats} setMats={setMats} />}
        {tab === "MIGO" && <Migo mats={mats} setMats={setMats} setMoves={setMoves} />}
        {tab === "MB51" && <Log moves={moves} mats={mats} />}
        {tab === "INFO" && <About />}
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Dashboard({ mats, moves }: { mats: Material[]; moves: Movement[] }) {
  const value = mats.reduce((s, m) => s + m.price * m.stock, 0);
  const low = mats.filter((m) => m.stock <= m.reorder);
  const stats = [
    ["Materials", mats.length],
    ["Stock Value", inr(value)],
    ["Below Reorder", low.length],
    ["Movements", moves.length],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k as string} className="rounded-lg border bg-card p-5">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <Card title="Reorder alerts">
        {low.length === 0 ? <p className="text-sm text-muted-foreground">All materials are above reorder level.</p> : (
          <ul className="divide-y">
            {low.map((m) => (
              <li key={m.id} className="flex justify-between py-2 text-sm">
                <span><span className="font-mono text-muted-foreground">{m.id}</span> {m.name}</span>
                <span className="font-medium text-destructive">{m.stock} / {m.reorder} {m.uom}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MaterialMaster({ mats, setMats }: { mats: Material[]; setMats: (f: (m: Material[]) => Material[]) => void }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState({ name: "", group: "Raw Material", uom: "PC", price: "", reorder: "" });
  const list = useMemo(() => mats.filter((m) => (m.id + m.name + m.group).toLowerCase().includes(q.toLowerCase())), [mats, q]);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    setMats((ms) => {
      const n = Math.max(1000, ...ms.map((m) => +m.id.slice(4))) + 1;
      return [...ms, { id: `MAT-${n}`, name: f.name.trim(), group: f.group, uom: f.uom, price: +f.price || 0, stock: 0, reorder: +f.reorder || 0 }];
    });
    setF({ ...f, name: "", price: "", reorder: "" });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Create material (MM01)">
        <form onSubmit={add} className="space-y-3">
          <input className={input} placeholder="Description" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select className={input} value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>
            {["Raw Material", "Finished Good", "Packaging", "Spare Part"].map((g) => <option key={g}>{g}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select className={input} value={f.uom} onChange={(e) => setF({ ...f, uom: e.target.value })}>
              {["PC", "KG", "M", "L"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <input className={input} type="number" placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            <input className={input} type="number" placeholder="Reorder" value={f.reorder} onChange={(e) => setF({ ...f, reorder: e.target.value })} />
          </div>
          <button className={btn}>Save material</button>
        </form>
      </Card>
      <div className="lg:col-span-2">
        <Card title="Material list (MM03)">
          <input className={`${input} mb-3`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2">Material</th><th>Description</th><th>Group</th><th className="text-right">Price</th><th className="text-right">Stock</th><th></th></tr>
              </thead>
              <tbody className="divide-y">
                {list.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 font-mono text-xs">{m.id}</td>
                    <td>{m.name}</td>
                    <td className="text-muted-foreground">{m.group}</td>
                    <td className="text-right">{inr(m.price)}</td>
                    <td className={`text-right font-medium ${m.stock <= m.reorder ? "text-destructive" : "text-success"}`}>{m.stock} {m.uom}</td>
                    <td className="text-right"><button onClick={() => setMats((ms) => ms.filter((x) => x.id !== m.id))} className="text-xs text-muted-foreground hover:text-destructive">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Migo({ mats, setMats, setMoves }: { mats: Material[]; setMats: (f: (m: Material[]) => Material[]) => void; setMoves: (f: (m: Movement[]) => Movement[]) => void }) {
  const [mat, setMat] = useState(mats[0]?.id ?? "");
  const [type, setType] = useState<"101" | "201">("101");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const post = (e: React.FormEvent) => {
    e.preventDefault();
    const n = +qty;
    const m = mats.find((x) => x.id === mat);
    if (!m || n <= 0) return setMsg({ ok: false, text: "Enter a valid material and quantity." });
    if (type === "201" && n > m.stock) return setMsg({ ok: false, text: `Deficit of ${n - m.stock} ${m.uom} — not enough stock.` });
    setMats((ms) => ms.map((x) => (x.id === mat ? { ...x, stock: x.stock + (type === "101" ? n : -n) } : x)));
    const doc = String(4900000000 + Date.now() % 100000000);
    setMoves((v) => [{ id: doc, date: new Date().toLocaleString("en-IN"), material: mat, type, qty: n }, ...v]);
    setMsg({ ok: true, text: `Material document ${doc} posted.` });
    setQty("");
  };
  return (
    <div className="max-w-lg">
      <Card title="Goods movement (MIGO)">
        <form onSubmit={post} className="space-y-3">
          <select className={input} value={type} onChange={(e) => setType(e.target.value as "101" | "201")}>
            <option value="101">101 — Goods Receipt</option>
            <option value="201">201 — Goods Issue</option>
          </select>
          <select className={input} value={mat} onChange={(e) => setMat(e.target.value)}>
            {mats.map((m) => <option key={m.id} value={m.id}>{m.id} — {m.name} ({m.stock} {m.uom})</option>)}
          </select>
          <input className={input} type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
          <button className={btn}>Post</button>
          {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
        </form>
      </Card>
    </div>
  );
}

function Log({ moves, mats }: { moves: Movement[]; mats: Material[] }) {
  return (
    <Card title="Material document list (MB51)">
      {moves.length === 0 ? <p className="text-sm text-muted-foreground">No movements yet. Post one in MIGO.</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Document</th><th>Date</th><th>Material</th><th>Mvt</th><th className="text-right">Qty</th></tr></thead>
          <tbody className="divide-y">
            {moves.map((v) => (
              <tr key={v.id}>
                <td className="py-2 font-mono text-xs">{v.id}</td>
                <td>{v.date}</td>
                <td>{mats.find((m) => m.id === v.material)?.name ?? v.material}</td>
                <td className="font-mono">{v.type}</td>
                <td className={`text-right font-medium ${v.type === "101" ? "text-success" : "text-warning"}`}>{v.type === "101" ? "+" : "−"}{v.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function About() {
  return (
    <div className="max-w-2xl space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">MiniMM — Inventory Management inspired by SAP MM</h1>
      <p>This mini project simulates core features of the SAP Materials Management (MM) module, used by companies to manage materials, purchasing and inventory.</p>
      <Card title="Modules covered">
        <ul className="list-disc space-y-1 pl-5">
          <li><b>MM01 / MM03</b> — Create and display material master records.</li>
          <li><b>MIGO</b> — Post goods receipts (movement type 101) and goods issues (201).</li>
          <li><b>MB51</b> — View the material document log.</li>
          <li><b>MM60</b> — Dashboard with stock value and reorder alerts.</li>
        </ul>
      </Card>
      <p className="text-muted-foreground">Tip: type a transaction code like <span className="font-mono">MIGO</span> in the top bar and press Enter, just like in SAP GUI. Data is saved in your browser.</p>
    </div>
  );
}
