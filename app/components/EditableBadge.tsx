"use client";

import React, { useState, useRef, useEffect } from "react";
import { TASK_COLORS, TASK_LABELS } from "../helpers/Tasks";
import { Assignment } from "@prisma/client";
import { $Enums } from ".prisma/client/client";

const TASKS: $Enums.TaskType[] = Object.values($Enums.TaskType);

interface IProps {
  assignmentId: Assignment["id"] | null;
  onChange: (taskType: $Enums.TaskType | null) => void;
  task: Assignment["task"] | null;
}

export function EditableBadge({ assignmentId, onChange, task }: IProps) {
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

  const currentLabel = task ? TASK_LABELS[task] : "—";
  const color = task
    ? TASK_COLORS[task]
    : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div ref={ref} className="relative">
      <button
        className={`h-7 w-36 min-w-[7rem] truncate px-2 rounded-md border text-xs text-left ${color} hover:brightness-95`}
        onClick={() => setOpen((o) => !o)}
        title="Cliquez pour modifier"
      >
        {currentLabel}
      </button>
      {open && (
        <div className="flex flex-col gap-1 absolute z-40 mt-1 w-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg p-1">
          <OptionRow
            active={!assignmentId}
            label="(Aucune)"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          />
          <div className="h-px bg-gray-200" />
          {TASKS.map((taskType) => (
            <OptionRow
              key={taskType}
              active={task === taskType}
              label={TASK_LABELS[taskType]}
              taskType={taskType}
              onClick={() => {
                onChange(taskType);
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
  taskType,
  onClick,
}: {
  active: boolean;
  label: string;
  taskType?: $Enums.TaskType;
  onClick: () => void;
}) {
  const base = taskType
    ? TASK_COLORS[taskType]
    : "bg-gray-50 text-gray-800 border-gray-200";
  return (
    <button
      className={`w-full text-left px-2 py-1.5 rounded-lg border ${base} ${
        active ? "ring-1 ring-black/40" : "hover:bg-gray-100 opacity-80"
      }`}
      onClick={onClick}
    >
      <span className="text-[13px]">{label}</span>
    </button>
  );
}
