import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bookmark,
  BookmarkCheck,
  Bot,
  User,
  Maximize2,
  X,
} from "lucide-react";
import Anthropic from "@anthropic-ai/sdk";
import ReactMarkdown from "react-markdown";

// Clean up Claude responses that have spurious newlines.
// Joins continuation lines into their parent (paragraph, bullet, heading).
function cleanMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  const isStructural = (s: string) =>
    /^#{1,4} /.test(s) || /^[-*] /.test(s) || /^\d+[\.\)] /.test(s) || s.startsWith("```");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Empty line = paragraph break
    if (trimmed === "") {
      out.push("");
      continue;
    }

    // If this line starts a new structural block, push it
    if (isStructural(trimmed)) {
      out.push(trimmed);
      continue;
    }

    // Non-structural continuation: append to previous non-empty line
    if (out.length > 0 && out[out.length - 1] !== "") {
      out[out.length - 1] += " " + trimmed;
    } else {
      out.push(trimmed);
    }
  }

  // Post-process: if a bullet line is JUST the marker (e.g. "- " or "* "),
  // merge the next line into it
  for (let i = 0; i < out.length; i++) {
    if (/^[-*]$/.test(out[i].trim()) || /^\d+[\.\)]$/.test(out[i].trim())) {
      // Bare marker with no content — pull next non-empty line in
      for (let j = i + 1; j < out.length; j++) {
        if (out[j].trim() !== "") {
          out[i] = out[i].trim() + " " + out[j].trim();
          out.splice(j, 1);
          break;
        }
      }
    }
  }

  return out.join("\n")
    .replace(/  +/g, " ")
    .replace(/ ([.,;:!?])/g, "$1")
    .replace(/\( /g, "(")
    .replace(/ \)/g, ")")
    .trim();
}
import { COLORS, FONTS } from "../../constants/constants";
import type { ChatMessage, Newsletter } from "../../types/types";
import styles from "./ChatBot.module.css";

interface ChatBotProps {
  topic: string | null;
  newsletter: Newsletter | null;
  onSaveQA?: (question: string, answer: string) => void;
  onUnsaveQA?: (answer: string) => void;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildNewsletterContext(newsletter: Newsletter): string {
  const parts: string[] = [];
  parts.push(`Topic: ${newsletter.topic}`);
  parts.push(`\nExecutive Summary:\n${newsletter.executiveSummary.map((b, i) => `${i + 1}. ${b}`).join("\n")}`);
  parts.push(`\nKey Themes:\n${newsletter.themes.map((t) => `- ${t}`).join("\n")}`);
  parts.push(`\nMarket Landscape: ${newsletter.landscape}`);
  parts.push(`\nCurrent State: ${newsletter.currentState}`);
  parts.push(`\nPredictions: ${newsletter.predictions}`);
  parts.push(`\nInvestment Insights: ${newsletter.investmentInsights}`);

  if (newsletter.competitors.length > 0) {
    parts.push(`\nCompetitors:\n${newsletter.competitors.map((c) => `- ${c.name} (${c.momentum}): ${c.description} | Funding: ${c.funding} | Stage: ${c.stage}`).join("\n")}`);
  }

  if (newsletter.emergingCompanies.length > 0) {
    parts.push(`\nEmerging Companies:\n${newsletter.emergingCompanies.map((c) => `- ${c.name}: ${c.description} | Signals: ${c.signals.join(", ")} | Stage: ${c.fundingStage}`).join("\n")}`);
  }

  if (newsletter.consensus.length > 0) {
    parts.push(`\nConsensus Views:\n${newsletter.consensus.map((v) => `- ${v.title}: ${v.description}`).join("\n")}`);
  }

  if (newsletter.contrarian.length > 0) {
    parts.push(`\nContrarian Views:\n${newsletter.contrarian.map((v) => `- ${v.title}: ${v.description}`).join("\n")}`);
  }

  if (newsletter.topPeople.length > 0) {
    parts.push(`\nTop People:\n${newsletter.topPeople.map((p) => `- ${p.name}: ${p.detail}`).join("\n")}`);
  }

  if (newsletter.topCompanies.length > 0) {
    parts.push(`\nTop Companies:\n${newsletter.topCompanies.map((c) => `- ${c.name}: ${c.detail}`).join("\n")}`);
  }

  if (newsletter.topProducts.length > 0) {
    parts.push(`\nTop Products:\n${newsletter.topProducts.map((p) => `- ${p.name}: ${p.detail}`).join("\n")}`);
  }

  return parts.join("\n");
}

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

let anthropicClient: Anthropic | null = null;
if (apiKey) {
  anthropicClient = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export default function ChatBot({ topic, newsletter, onSaveQA, onUnsaveQA }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const modalMessagesRef = useRef<HTMLDivElement>(null);
  const messageCountRef = useRef(0);

  // Scroll only when new messages are added or typing state changes, not on bookmark
  useEffect(() => {
    if (messages.length !== messageCountRef.current || isTyping) {
      messageCountRef.current = messages.length;
      const container = isExpanded ? modalMessagesRef.current : messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isTyping, isExpanded]);

  // Reset messages when topic changes
  useEffect(() => {
    setMessages([]);
  }, [topic]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !topic || isTyping) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      let responseText: string;

      if (anthropicClient && newsletter) {
        const context = buildNewsletterContext(newsletter);
        const chatHistory = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const response = await anthropicClient.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 3,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          ],
          system: `You are a VC research analyst assistant. You have access to an intelligence report about "${topic}" AND the ability to search the web for additional information.

Use the report data to answer questions when the information is available there. If the user asks something broader, more recent, or not covered in the report, use web search to find the answer. Always frame answers for venture capital decision-making. Keep responses concise (2-3 paragraphs max).

REPORT DATA:
${context}`,
          messages: [
            ...chatHistory,
            { role: "user", content: trimmed },
          ],
        });

        // Extract text from response (may contain multiple content blocks when web search is used)
        const textParts: string[] = [];
        for (const block of response.content) {
          if (block.type === "text") {
            textParts.push(block.text);
          }
        }
        responseText = textParts.join("\n\n") || "I couldn't generate a response.";
      } else {
        responseText = `I need an API key to provide intelligent answers. Please configure VITE_ANTHROPIC_API_KEY in your .env file.`;
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your question. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSaved = (messageId: string) => {
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === messageId ? { ...m, saved: !m.saved } : m
      );

      const msg = updated.find((m) => m.id === messageId);
      if (msg && msg.role === "assistant") {
        if (msg.saved && onSaveQA) {
          // Bookmarked — save to notes
          const idx = updated.indexOf(msg);
          const userMsg = updated
            .slice(0, idx)
            .reverse()
            .find((m) => m.role === "user");
          if (userMsg) {
            onSaveQA(userMsg.content, msg.content);
          }
        } else if (!msg.saved && onUnsaveQA) {
          // Unbookmarked — remove from notes
          onUnsaveQA(msg.content);
        }
      }

      return updated;
    });
  };

  // No topic selected
  if (!topic) {
    return (
      <div className={styles.container} style={{ fontFamily: FONTS.body }}>
        <div className={styles.header}>
          <MessageSquare size={16} className={styles.headerIcon} />
          <span className={styles.headerText} style={{ color: COLORS.gray[700] }}>AI Chat</span>
        </div>
        <div className={styles.emptyState}>
          <Bot size={24} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            Search a topic first to start asking questions
          </p>
        </div>
      </div>
    );
  }

  const renderChatContent = (messagesRef: React.RefObject<HTMLDivElement | null>) => (
    <div className={styles.panel}>
      <div className={styles.messages} ref={messagesRef}>
        {messages.length === 0 && (
          <div className={styles.welcomeState}>
            <Bot size={20} className={styles.welcomeIcon} />
            <p className={styles.welcomeText}>
              Ask me anything about <strong>{topic}</strong>. I have access to
              the full intelligence report and can search the web for additional context.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.role === "user" ? styles.userMessage : styles.assistantMessage
            }`}
          >
            <div className={styles.messageHeader}>
              <div className={styles.messageAvatar}>
                {msg.role === "user" ? (
                  <User size={14} />
                ) : (
                  <Bot size={14} />
                )}
              </div>
              <span className={styles.messageTime}>
                {formatTimestamp(msg.timestamp)}
              </span>
              {msg.role === "assistant" && (
                <button
                  className={`${styles.saveBtn} ${
                    msg.saved ? styles.saveBtnActive : ""
                  }`}
                  onClick={() => toggleSaved(msg.id)}
                  aria-label={msg.saved ? "Unsave response" : "Save response"}
                  title={msg.saved ? "Unsave response" : "Save response"}
                >
                  {msg.saved ? (
                    <BookmarkCheck size={14} />
                  ) : (
                    <Bookmark size={14} />
                  )}
                </button>
              )}
            </div>
            <div className={styles.messageContent}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{cleanMarkdown(msg.content)}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.messageHeader}>
              <div className={styles.messageAvatar}>
                <Bot size={14} />
              </div>
            </div>
            <div className={styles.typingIndicator}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputBar}>
        <input
          type="text"
          className={styles.input}
          placeholder={`Ask about ${topic}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.container} style={{ fontFamily: FONTS.body }}>
        <div className={styles.header}>
          <MessageSquare size={16} className={styles.headerIcon} />
          <span className={styles.headerText} style={{ color: COLORS.gray[700] }}>AI Chat</span>
          <button
            className={styles.expandBtn}
            onClick={() => setIsExpanded(true)}
            title="Expand chat"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        {renderChatContent(messagesContainerRef)}
      </div>

      {isExpanded && (
        <div className={styles.modalOverlay} onClick={() => setIsExpanded(false)}>
          <div
            className={styles.modal}
            style={{ fontFamily: FONTS.body }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <MessageSquare size={16} className={styles.headerIcon} />
              <span className={styles.headerText} style={{ color: COLORS.gray[700] }}>
                AI Chat — {topic}
              </span>
              <button
                className={styles.closeBtn}
                onClick={() => setIsExpanded(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            {renderChatContent(modalMessagesRef)}
          </div>
        </div>
      )}
    </>
  );
}
