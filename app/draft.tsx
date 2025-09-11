import React, { useEffect, useMemo, useRef, useState } from "react";

// ------------------------------------------------------------
// Planificateur annuel – React + TypeScript (Vite + Tailwind)
// ------------------------------------------------------------
// Hypothèses clés :
// - Chaque ligne = une personne
// - Chaque colonne = un jour de l'année (lundi -> dimanche)
// - L'affectation se fait à la SEMAINE (lundi -> vendredi). Les samedis/dimanches
// sont grisés et non éditables.
// - Les tâches hebdomadaires à répartir sont :
// 2x "Vérification de dossiers"
// 2x "Validations de dossiers et Préparation CQ"
// 1x "Garde Appareil"
// 1x "Curiethérapie"
// 1x "Gestion CQ/Appareil"
// 1x "Support dosimétrie"
// - Édition : cliquer sur une cellule (lundi-vendredi) pour ouvrir un sélecteur.
// - Persistance locale via localStorage; import/export JSON.
// - Tailwind requis (classes utilisées) ; compatible Vite + React + TS.

// ---------------------- Types & Constantes -------------------

type Task = {
  id: string; // identifiant unique (p.ex. "verif-1")
  label: string; // libellé affiché (p.ex. "Vérification de dossiers")
};

export type AssignmentMap = Record<string, Record<string, string | null>>;
// structure: { weekKey: { personName: taskId|null } }

const humanTasks: Omit<Task, "id">[] = [
  { label: "Vérification de dossiers" },
  { label: "Vérification de dossiers" },
  { label: "Validations de dossiers et Préparation CQ" },
  { label: "Validations de dossiers et Préparation CQ" },
  { label: "Garde Appareil" },
  { label: "Curiethérapie" },
  { label: "Gestion CQ/Appareil" },
  { label: "Support dosimétrie" },
];

export const TASKS: Task[] = humanTasks.map((t, i) => ({
  id: `${slugify(t.label)}-${i + 1}`,
  label: t.label,
}));

export const TASK_COLORS: Record<string, string> = {
  "Vérification de dossiers": "bg-blue-100 text-blue-900 border-blue-200",
  "Validations de dossiers et Préparation CQ":
    "bg-emerald-100 text-emerald-900 border-emerald-200",
  "Garde Appareil": "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  Curiethérapie: "bg-amber-100 text-amber-900 border-amber-200",
  "Gestion CQ/Appareil": "bg-sky-100 text-sky-900 border-sky-200",
  "Support dosimétrie": "bg-rose-100 text-rose-900 border-rose-200",
};

const STORAGE_KEY = "year-planner-v1";

// ----------------------- Utilitaires -------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfYear(year: number): Date {
  return new Date(year, 0, 1);
}

function endOfYear(year: number): Date {
  return new Date(year, 11, 31);
}

function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

function getMonday(d: Date): Date {
  const nd = new Date(d);
  const day = nd.getDay(); // 0=Sun,1=Mon,...
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

export function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6; // Sun or Sat
}

export function formatDayHeader(d: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return fmt.format(d).replace(/\.$/, ""); // enlever les points abrégés (lun. -> lun)
}

function daysOfYear(year: number): Date[] {
  const days: Date[] = [];
  let d = startOfYear(year);
  const last = endOfYear(year);
  while (d <= last) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

export function weekKeyFromDate(d: Date): string {
  const monday = getMonday(d);
  return toYMD(monday);
}

function computeWeeks(year: number): string[] {
  // Renvoie la liste ordonnée des weeks keys (lundi) couvrant l'année
  const first = getMonday(startOfYear(year));
  const last = getMonday(endOfYear(year));
  const weeks: string[] = [];
  let cur = new Date(first);
  while (cur <= addDays(last, 7)) {
    weeks.push(toYMD(cur));
    cur = addDays(cur, 7);
  }
  return weeks;
}

function rotate<T>(arr: T[], offset: number): T[] {
  const n = arr.length;
  if (n === 0) return arr.slice();
  const k = ((offset % n) + n) % n;
  return arr.slice(k).concat(arr.slice(0, k));
}

// ------------------------ composant --------------------------

export type GuardType = "MORNING" | "MORNING_IRM" | "EVENING" | "EVENING_IRM";

export type DailyGuards = Record<string, Record<GuardType, string | null>>; // { yyy-mm-dd: { MORNING: person|null, ... } }

type PersistedState = {
  year: number;
  people: string[];
  assignments: AssignmentMap;
  dailyGuards: DailyGuards;
};

export default function YearPlannerApp() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [people, setPeople] = useState<string[]>([
    "Alice",
    "Bob",
    "Charlie",
    "Diane",
    "Eric",
    "Fatima",
    "Hugo",
    "Inès",
  ]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [dailyGuards, setDailyGuards] = useState<DailyGuards>({});

  // Pré-calculs
  const days = useMemo(() => daysOfYear(year), [year]);
  const weeks = useMemo(() => computeWeeks(year), [year]);

  // Charger depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Partial<PersistedState> = JSON.parse(raw);
        if (parsed.year) setYear(parsed.year);
        if (parsed.people) setPeople(parsed.people);
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.dailyGuards) setDailyGuards(parsed.dailyGuards);
      } else {
        // Première initialisation : auto-répartition
        const ws = computeWeeks(currentYear);
        const defaultPeople = [
          "Alice",
          "Bob",
          "Charlie",
          "Diane",
          "Eric",
          "Fatima",
          "Hugo",
          "Inès",
        ];
        setAssignments(generateAutoAssignments(ws, defaultPeople));
        setDailyGuards(generateAutoGuards(currentYear, defaultPeople));
      }
    } catch (e) {
      // en cas de corruption, on repart propre
      const ws = computeWeeks(currentYear);
      setAssignments(generateAutoAssignments(ws, people));
      setDailyGuards(generateAutoGuards(currentYear, people));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde locale
  useEffect(() => {
    const state: PersistedState = { year, people, assignments, dailyGuards };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [year, people, assignments, dailyGuards]);

  // Re-générer si l'année change et qu'on n'a pas d'affectations pour ces weeks
  useEffect(() => {
    const weeksForYear = computeWeeks(year);
    const missing = weeksForYear.some((wk) => !assignments[wk]);
    if (missing) {
      setAssignments((prev) => ({
        ...generateAutoAssignments(weeksForYear, people),
        ...prev,
      }));
    }
    // Gardes
    const daysForYear = daysOfYear(year).map(toYMD);
    const guardsMissing = daysForYear.some((d) => !dailyGuards[d]);
    if (guardsMissing) {
      setDailyGuards((prev) => ({
        ...generateAutoGuards(year, people),
        ...prev,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // -------------------- Actions -----------------------------

  function generateAutoAssignments(
    weeksKeys: string[],
    ppl: string[]
  ): AssignmentMap {
    const map: AssignmentMap = {};
    const tasks = TASKS.slice(); // 8 items
    for (let w = 0; w < weeksKeys.length; w++) {
      const wk = weeksKeys[w];
      const rotatedPeople = rotate(ppl, w);
      map[wk] = {};
      for (let i = 0; i < rotatedPeople.length; i++) {
        map[wk][rotatedPeople[i]] = null; // par défaut vide
      }
      // Affecter les tâches en respectant max 1 tâche/pers/semaine
      const pool = rotatedPeople.slice();
      for (let t = 0; t < tasks.length; t++) {
        if (pool.length === 0) break;
        const person = pool.shift()!;
        map[wk][person] = tasks[t].id;
      }
    }
    return map;
  }

  function handleAssign(
    weekKey: string,
    person: string,
    taskId: string | null
  ) {
    setAssignments((prev) => ({
      ...prev,
      [weekKey]: {
        ...(prev[weekKey] || {}),
        [person]: taskId,
      },
    }));
  }

  // ---------- Gardes quotidiennes (matin / matin IRM / soir / soir IRM) ----------
  function generateAutoGuards(targetYear: number, ppl: string[]): DailyGuards {
    const out: DailyGuards = {};
    const weeks = computeWeeks(targetYear);
    const n = Math.max(ppl.length, 1);

    weeks.forEach((wk, wIdx) => {
      const monday = new Date(wk);
      for (let i = 0; i < 5; i++) {
        // lun-ven
        const d = addDays(monday, i);
        if (d.getFullYear() !== targetYear) continue;
        const ymd = toYMD(d);
        const r = rotate(ppl, (wIdx * 3) % n);
        const m1 = r[(i * 3) % n];
        const m2 = r[(i * 3 + 1) % n];
        let e1 = r[(i * 3 + 2) % n];
        let e2 = r[(i * 3 + 3) % n];

        // Ajustement simple si J-1 soir == J matin
        const prev = out[toYMD(addDays(d, -1))];
        if (prev) {
          if (prev.EVENING === m1 || prev.EVENING_IRM === m1)
            e1 = m1 === e1 ? r[(i * 3 + 4) % n] : e1;
          if (prev.EVENING === m2 || prev.EVENING_IRM === m2)
            e2 = m2 === e2 ? r[(i * 3 + 5) % n] : e2;
        }

        out[ymd] = {
          MORNING: m1 ?? null,
          MORNING_IRM: m2 ?? null,
          EVENING: e1 ?? null,
          EVENING_IRM: e2 ?? null,
        };
      }
    });
    return out;
  }

  function handleGuardChange(
    date: string,
    type: GuardType,
    person: string | null
  ) {
    const d = new Date(date);
    const ymdPrev = toYMD(addDays(d, -1));
    const ymdNext = toYMD(addDays(d, 1));

    const isMorning = type === "MORNING" || type === "MORNING_IRM";
    const isEvening = type === "EVENING" || type === "EVENING_IRM";

    if (person) {
      if (isMorning) {
        const prev = dailyGuards[ymdPrev];
        if (prev && (prev.EVENING === person || prev.EVENING_IRM === person)) {
          alert(
            `${person} était de garde du soir la veille. Conflit avec la règle.`
          );
          return;
        }
      }
      if (isEvening) {
        const next = dailyGuards[ymdNext];
        if (next && (next.MORNING === person || next.MORNING_IRM === person)) {
          alert(
            `${person} est déjà prévu(e) en garde du matin le lendemain. Conflit avec la règle.`
          );
          return;
        }
      }
    }

    setDailyGuards((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || {
          MORNING: null,
          MORNING_IRM: null,
          EVENING: null,
          EVENING_IRM: null,
        }),
        [type]: person,
      },
    }));
  }

  function addPerson(name: string) {
    const n = name.trim();
    if (!n) return;
    setPeople((p) => (p.includes(n) ? p : [...p, n]));
  }

  function removePerson(name: string) {
    setPeople((p) => p.filter((x) => x !== name));
    setAssignments((prev) => {
      const next: AssignmentMap = {};
      for (const wk of Object.keys(prev)) {
        const row = { ...prev[wk] };
        delete row[name];
        next[wk] = row;
      }
      return next;
    });
  }

  function regenerate() {
    const ws = computeWeeks(year);
    setAssignments(generateAutoAssignments(ws, people));
    setDailyGuards(generateAutoGuards(year, people));
  }

  function clearAll() {
    const ws = computeWeeks(year);
    const blank: AssignmentMap = {};
    for (const wk of ws) {
      blank[wk] = Object.fromEntries(people.map((p) => [p, null]));
    }
    setAssignments(blank);
    const blankGuards: DailyGuards = {};
    for (const d of daysOfYear(year)) {
      if (isWeekend(d)) continue; // on cible lun-ven
      blankGuards[toYMD(d)] = {
        MORNING: null,
        MORNING_IRM: null,
        EVENING: null,
        EVENING_IRM: null,
      };
    }
    setDailyGuards(blankGuards);
  }

  function exportJSON() {
    const data: PersistedState = { year, people, assignments, dailyGuards };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planning-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: Partial<PersistedState> = JSON.parse(
          String(reader.result)
        );
        if (parsed) {
          if (parsed.year) setYear(parsed.year);
          if (parsed.people) setPeople(parsed.people);
          if (parsed.assignments) setAssignments(parsed.assignments);
          if (parsed.dailyGuards) setDailyGuards(parsed.dailyGuards);
        }
      } catch (err) {
        alert("Fichier invalide");
      }
    };
    reader.onloadend = () => {
      e.currentTarget.value = "";
    };
    reader.readAsText(file);
  }

  // -------------------- Rendu -------------------------------

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Planificateur annuel</h1>
          <div className="ml-auto flex items-center gap-2">
            <YearPicker year={year} setYear={setYear} />
            <button
              onClick={regenerate}
              className="px-3 py-1.5 rounded-2xl bg-indigo-600 text-white shadow hover:bg-indigo-700"
            >
              Répartition auto
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:bg-gray-50"
            >
              Tout vider
            </button>
            <button
              onClick={exportJSON}
              className="px-3 py-1.5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:bg-gray-50"
            >
              Exporter JSON
            </button>
            <label className="px-3 py-1.5 rounded-2xl bg-white border border-gray-300 shadow-sm hover:bg-gray-50 cursor-pointer">
              Importer JSON
              <input
                type="file"
                accept="application/json"
                onChange={onImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4">
        <section className="mb-4">
          <PeopleManager
            people={people}
            onAdd={addPerson}
            onRemove={removePerson}
          />
        </section>

        <section className="mb-4">
          <Legend />
        </section>

        <section className="border rounded-2xl overflow-hidden shadow-sm">
          <PlannerTable
            year={year}
            people={people}
            days={days}
            assignments={assignments}
            dailyGuards={dailyGuards}
            onAssign={handleAssign}
            onGuardChange={handleGuardChange}
          />
        </section>
      </main>
    </div>
  );

  // -------------------- Sous-composants ------------------------

  function YearPicker({
    year,
    setYear,
  }: {
    year: number;
    setYear: (y: number) => void;
  }) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
          onClick={() => setYear(year - 1)}
          aria-label="Année précédente"
        >
          ← {year - 1}
        </button>
        <div className="px-3 py-1.5 rounded-xl bg-gray-100 font-medium">
          {year}
        </div>
        <button
          className="px-2 py-1 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
          onClick={() => setYear(year + 1)}
          aria-label="Année suivante"
        >
          {year + 1} →
        </button>
      </div>
    );
  }

  function PeopleManager({
    people,
    onAdd,
    onRemove,
  }: {
    people: string[];
    onAdd: (n: string) => void;
    onRemove: (n: string) => void;
  }) {
    const [name, setName] = useState("");
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="font-medium mr-2">Personnes :</div>
        {people.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-gray-100 border border-gray-200"
          >
            {p}
            <button
              onClick={() => onRemove(p)}
              className="text-gray-500 hover:text-red-600"
              title={`Supprimer ${p}`}
            >
              ✕
            </button>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ajouter une personne"
            className="px-3 py-1.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd(name);
                setName("");
              }
            }}
          />
          <button
            onClick={() => {
              onAdd(name);
              setName("");
            }}
            className="px-3 py-1.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Ajouter
          </button>
        </div>
      </div>
    );
  }

  function Legend() {
    // grouper par label (sans index dupliqué)
    const labels = Array.from(new Set(TASKS.map((t) => t.label)));
    return (
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-2xl border ${TASK_COLORS[label]}`}
          >
            <span className="h-2 w-2 rounded-full border border-black/10" />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl border bg-gray-100 text-gray-700 border-gray-200">
          Vide / aucune tâche
        </span>
      </div>
    );
  }

  function PlannerTable({
    year,
    people,
    days,
    assignments,
    dailyGuards,
    onAssign,
    onGuardChange,
  }: {
    year: number;
    people: string[];
    days: Date[];
    assignments: AssignmentMap;
    dailyGuards: DailyGuards;
    onAssign: (weekKey: string, person: string, taskId: string | null) => void;
    onGuardChange: (
      date: string,
      type: GuardType,
      person: string | null
    ) => void;
  }) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const months = useMemo(() => {
      // Découpage par mois pour intercalage d'en-têtes
      const groups: { month: number; days: Date[] }[] = [];
      for (const d of days) {
        const m = d.getMonth();
        const g = groups.find((x) => x.month === m);
        if (g) g.days.push(d);
        else groups.push({ month: m, days: [d] });
      }
      return groups;
    }, [days]);

    const labelsById = useMemo(
      () => Object.fromEntries(TASKS.map((t) => [t.id, t.label])),
      []
    );

    function cellContent(
      person: string,
      d: Date
    ): { label: string | null; id: string | null } {
      const wk = weekKeyFromDate(d);
      const id = assignments[wk]?.[person] ?? null;
      return id ? { label: labelsById[id], id } : { label: null, id: null };
    }

    return (
      <div ref={containerRef} className="overflow-auto max-h-[72vh]">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            {/* Ligne mois */}
            <tr>
              <th className="sticky left-0 z-30 bg-white border-b border-gray-200 text-left px-3 py-2 w-48">
                Personne
              </th>
              {months.map((m) => (
                <th
                  key={m.month}
                  colSpan={m.days.length}
                  className="bg-white border-b border-gray-200 px-1 py-2 text-sm font-semibold text-gray-700"
                >
                  {new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
                    new Date(year, m.month, 1)
                  )}
                </th>
              ))}
            </tr>
            {/* Ligne jours */}
            <tr>
              <th className="sticky left-0 z-30 bg-white border-b border-gray-200 text-left px-3 py-2">
                &nbsp;
              </th>
              {days.map((d, idx) => {
                const weekend = isWeekend(d);
                const isMon = d.getDay() === 1;
                return (
                  <th
                    key={idx}
                    className={
                      `text-[11px] font-medium border-b border-gray-200 px-1 py-1 ${
                        weekend ? "bg-gray-100 text-gray-500" : "bg-white"
                      } ` + (isMon ? "border-l-2 border-l-gray-300" : "")
                    }
                  >
                    {formatDayHeader(d)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Ligne gardes quotidienne */}
            <tr className="bg-white">
              <th className="sticky left-0 z-10 bg-inherit border-b border-gray-200 text-left px-3 py-2 text-sm font-semibold">
                Gardes (lun–ven)
              </th>
              {days.map((d, idx) => {
                const weekend = isWeekend(d);
                const ymd = toYMD(d);
                const g = dailyGuards[ymd] || {
                  MORNING: null,
                  MORNING_IRM: null,
                  EVENING: null,
                  EVENING_IRM: null,
                };
                const isMon = d.getDay() === 1;
                return (
                  <td
                    key={idx}
                    className={`align-top border-b border-gray-200 px-1 py-1 ${
                      isMon ? "border-l-2 border-l-gray-300" : ""
                    }`}
                  >
                    {weekend ? (
                      <div className="h-16 w-28 min-w-[7rem] rounded-md bg-gray-100" />
                    ) : (
                      <div className="flex flex-col gap-1 w-40 min-w-[10rem]">
                        <GuardSelect
                          label="Matin"
                          value={g.MORNING}
                          people={people}
                          onChange={(p) => onGuardChange(ymd, "MORNING", p)}
                        />
                        <GuardSelect
                          label="Matin IRM"
                          value={g.MORNING_IRM}
                          people={people}
                          onChange={(p) => onGuardChange(ymd, "MORNING_IRM", p)}
                        />
                        <GuardSelect
                          label="Soir"
                          value={g.EVENING}
                          people={people}
                          onChange={(p) => onGuardChange(ymd, "EVENING", p)}
                        />
                        <GuardSelect
                          label="Soir IRM"
                          value={g.EVENING_IRM}
                          people={people}
                          onChange={(p) => onGuardChange(ymd, "EVENING_IRM", p)}
                        />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {people.map((person) => (
              <tr key={person} className="odd:bg-white even:bg-gray-50">
                <th className="sticky left-0 z-10 bg-inherit border-b border-gray-200 text-left px-3 py-2 text-sm font-medium w-48">
                  {person}
                </th>
                {days.map((d, idx) => {
                  const weekend = isWeekend(d);
                  const { label } = cellContent(person, d);
                  const wk = weekKeyFromDate(d);
                  const isMon = d.getDay() === 1;
                  return (
                    <td
                      key={idx}
                      className={`border-b border-gray-200 px-1 py-0.5 ${
                        isMon ? "border-l-2 border-l-gray-300" : ""
                      }`}
                    >
                      {weekend ? (
                        <div className="h-7 w-28 min-w-[7rem] rounded-md bg-gray-100" />
                      ) : (
                        <EditableBadge
                          valueId={assignments[wk]?.[person] ?? null}
                          onChange={(newId) => onAssign(wk, person, newId)}
                          label={label}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function EditableBadge({
    valueId,
    onChange,
    label,
  }: {
    valueId: string | null;
    onChange: (id: string | null) => void;
    label: string | null;
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      function onDocClick(e: MouseEvent) {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const currentLabel = label ?? "—";
    const color = label
      ? TASK_COLORS[label]
      : "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <div ref={ref} className="relative">
        <button
          className={`h-7 w-28 min-w-[7rem] truncate px-2 rounded-md border text-xs text-left ${color} hover:brightness-95`}
          onClick={() => setOpen((o) => !o)}
          title="Cliquez pour modifier (affecte la semaine entière)"
        >
          {currentLabel}
        </button>
        {open && (
          <div className="absolute z-40 mt-1 w-72 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg p-1">
            <OptionRow
              active={!valueId}
              label="(Aucune)"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            />
            <div className="my-1 h-px bg-gray-200" />
            {TASKS.map((t) => (
              <OptionRow
                key={t.id}
                active={valueId === t.id}
                label={t.label}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function OptionRow({
    active,
    label,
    onClick,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) {
    const base =
      TASK_COLORS[label] || "bg-gray-50 text-gray-800 border-gray-200";
    return (
      <button
        className={`w-full text-left px-2 py-1.5 rounded-lg border ${
          active ? base + " ring-1 ring-black/5" : "hover:bg-gray-100"
        }`}
        onClick={onClick}
      >
        <span className="text-[13px]">{label}</span>
      </button>
    );
  }

  function GuardSelect({
    label,
    value,
    people,
    onChange,
  }: {
    label: string;
    value: string | null;
    people: string[];
    onChange: (person: string | null) => void;
  }) {
    return (
      <label className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-[12px] text-gray-600">{label}</span>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full text-sm px-2 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          <option value="">—</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    );
  }
}

// -------------------- Conseils d'intégration ------------------
// 1) Créez un projet Vite :
// npm create vite@latest mon-planning -- --template react-ts
// cd mon-planning
// npm i
// 2) Installez Tailwind et configurez : https://tailwindcss.com/docs/guides/vite
// 3) Remplacez le contenu de src/App.tsx par ce composant (ou importez-le et
// faites <YearPlannerApp /> dans App.tsx). Assurez-vous que Tailwind est actif.
// 4) npm run dev
