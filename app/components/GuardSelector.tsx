"use client";

import React, { useState, useRef, useEffect } from "react";
import { Guard, User } from "@prisma/client";
import { $Enums } from ".prisma/client/client";

interface IProps {
  guardId: Guard["id"] | null;
  onChange: (userId: User["id"] | null, guardType: $Enums.GuardType) => void;
  guardType: $Enums.GuardType;
  selectedUser: User["name"] | null;
  users: Pick<User, "id" | "name">[];
}

export function GuardSelector({
  onChange,
  guardType,
  selectedUser,
  users,
}: IProps) {
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

  return (
    <div ref={ref} className="relative">
      <button
        className={`h-7 w-36 min-w-[7rem] truncate px-2 rounded-md border text-left ${
          selectedUser
            ? "bg-gray-50 text-gray-900 border-gray-300"
            : "bg-gray-100 text-gray-700 border-gray-200"
        } hover:brightness-95`}
        onClick={() => setOpen((o) => !o)}
        title="Cliquez pour modifier"
      >
        {selectedUser ?? "—"}
      </button>
      {open && (
        <div className="flex flex-col gap-1 absolute z-40 mt-1 w-72 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg p-1">
          <OptionRow
            active={!selectedUser}
            label="(Aucun)"
            onClick={() => {
              onChange(null, guardType);
              setOpen(false);
            }}
          />
          <div className="h-px bg-gray-200" />
          {users.map((user) => (
            <OptionRow
              key={user.id}
              active={selectedUser === user.name}
              label={user.name}
              onClick={() => {
                onChange(user.id, guardType);
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
  const base = active
    ? "bg-gray-200 text-gray-900 border-gray-400"
    : "bg-gray-50 text-gray-800 border-gray-200";
  return (
    <button
      className={`w-full text-left px-2 py-1.5 rounded-lg border ${base} ${
        active ? "ring-1 ring-black/40" : "hover:bg-gray-100 opacity-80"
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  );
}
