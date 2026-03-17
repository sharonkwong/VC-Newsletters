import { useState } from "react";
import { BookmarkCheck, ChevronDown, ChevronUp, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { COLORS, FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./SavedNotes.module.css";

function cleanMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const isStruct = (s: string) => /^#{1,4} /.test(s) || /^[-*] /.test(s) || /^\d+[\.\)] /.test(s) || s.startsWith("```");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") { out.push(""); continue; }
    if (isStruct(trimmed)) { out.push(trimmed); continue; }
    if (out.length > 0 && out[out.length - 1] !== "") {
      out[out.length - 1] += " " + trimmed;
    } else {
      out.push(trimmed);
    }
  }

  for (let i = 0; i < out.length; i++) {
    if (/^[-*]$/.test(out[i].trim()) || /^\d+[\.\)]$/.test(out[i].trim())) {
      for (let j = i + 1; j < out.length; j++) {
        if (out[j].trim() !== "") {
          out[i] = out[i].trim() + " " + out[j].trim();
          out.splice(j, 1);
          break;
        }
      }
    }
  }

  return out.join("\n").replace(/  +/g, " ").replace(/ ([.,;:!?])/g, "$1").replace(/\( /g, "(").replace(/ \)/g, ")").trim();
}

interface SavedNote {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface SavedNotesProps {
  notes: SavedNote[];
  onDelete?: (id: string) => void;
}

export default function SavedNotes({ notes, onDelete }: SavedNotesProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  return (
    <SectionCard title="AI Chat Saved Notes" icon={<BookmarkCheck size={20} />}>
      {notes.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageSquare size={32} style={{ color: COLORS.gray[300] }} />
          <p className={styles.emptyTitle} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
            No saved notes yet
          </p>
          <p className={styles.emptyHint} style={{ color: COLORS.gray[400], fontFamily: FONTS.body }}>
            Bookmark responses in the AI Chat to save them here for reference.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {notes.map((note) => (
            <div key={note.id} className={styles.noteCard}>
              <button
                className={styles.noteHeader}
                onClick={() => setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(note.id)) next.delete(note.id);
                    else next.add(note.id);
                    return next;
                  })}
              >
                <div className={styles.noteQuestion} style={{ color: COLORS.black, fontFamily: FONTS.body }}>
                  {note.question}
                </div>
                <div className={styles.noteActions}>
                  <span className={styles.noteTime} style={{ color: COLORS.gray[400] }}>
                    {new Date(note.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {expandedIds.has(note.id) ? (
                    <ChevronUp size={14} style={{ color: COLORS.gray[400] }} />
                  ) : (
                    <ChevronDown size={14} style={{ color: COLORS.gray[400] }} />
                  )}
                </div>
              </button>
              {expandedIds.has(note.id) && (
                <div className={styles.noteBody} style={{ backgroundColor: COLORS.gray[50] }}>
                  <div className={styles.noteAnswer} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                    <ReactMarkdown>{cleanMarkdown(note.answer)}</ReactMarkdown>
                  </div>
                  {onDelete && (
                    <div className={styles.deleteRow}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => onDelete(note.id)}
                        style={{ color: COLORS.gray[400] }}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
