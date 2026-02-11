"use client";

import { Loader2, FilePlus, FilePen, Eye, Undo2, FileInput, FileX, ArrowRightLeft } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  state: string;
  args?: Record<string, unknown>;
}

function getToolMessage(toolName: string, args?: Record<string, unknown>): { label: string; icon: React.ReactNode } {
  const path = typeof args?.path === "string" ? args.path : undefined;
  const command = typeof args?.command === "string" ? args.command : undefined;

  if (toolName === "str_replace_editor" && command) {
    switch (command) {
      case "create":
        return { label: `Creating ${path ?? "file"}`, icon: <FilePlus className="w-3 h-3" /> };
      case "str_replace":
        return { label: `Editing ${path ?? "file"}`, icon: <FilePen className="w-3 h-3" /> };
      case "insert":
        return { label: `Inserting into ${path ?? "file"}`, icon: <FileInput className="w-3 h-3" /> };
      case "view":
        return { label: `Viewing ${path ?? "file"}`, icon: <Eye className="w-3 h-3" /> };
      case "undo_edit":
        return { label: `Undoing edit to ${path ?? "file"}`, icon: <Undo2 className="w-3 h-3" /> };
    }
  }

  if (toolName === "file_manager" && command) {
    const newPath = typeof args?.new_path === "string" ? args.new_path : undefined;
    switch (command) {
      case "rename":
        return { label: `Moving ${path ?? "file"}${newPath ? ` → ${newPath}` : ""}`, icon: <ArrowRightLeft className="w-3 h-3" /> };
      case "delete":
        return { label: `Deleting ${path ?? "file"}`, icon: <FileX className="w-3 h-3" /> };
    }
  }

  return { label: toolName, icon: null };
}

export function ToolInvocationBadge({ toolName, state, args }: ToolInvocationBadgeProps) {
  const isComplete = state === "result";
  const { label, icon } = getToolMessage(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {icon}
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          {icon}
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
