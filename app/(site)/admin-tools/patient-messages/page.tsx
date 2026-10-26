"use client";

/**
 * Patient messages: messages and weekly check-ins patients send from the
 * portal (/profile), with replies from the clinical team. Threads with an
 * unanswered severe check-in are pinned to the top.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type Thread = {
  userId: number;
  name: string;
  email: string;
  lastAt: string;
  unread: number;
  openCheckins: number;
  severe: boolean;
  lastBody: string;
};
type Message = { id: number; svc: string; fromStaff: boolean; author: string; body: string; at: string; readByPatient: boolean };
type Checkin = { id: number; at: string; mood: string; effects: string[]; severe: boolean; note: string; reply: string; repliedBy: string };
type Patient = { userId: number; name: string; email: string; phone: string; address: string; safePlace: string; gpShare: boolean; gp: string };

const SVC: Record<string, string> = { wl: "Weight loss", ed: "Erectile dysfunction", pd: "Period delay" };

function when(v: string): string {
  const d = new Date(v);
  return Number.isNaN(+d)
    ? ""
    : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

export default function PatientMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [svc, setSvc] = useState("wl");
  const [reply, setReply] = useState("");
  const [ciReply, setCiReply] = useState<Record<number, string>>({});
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/patient-messages", { credentials: "include", cache: "no-store" });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");
      setThreads(j.threads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const open = useCallback(async (userId: number) => {
    setSel(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin-tools/patient-messages?userId=${userId}`, { credentials: "include", cache: "no-store" });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");
      setPatient(j.patient);
      setMessages(j.messages ?? []);
      setCheckins(j.checkins ?? []);
      const last = (j.messages ?? []).filter((m: Message) => !m.fromStaff).slice(-1)[0];
      if (last) setSvc(last.svc);
      setThreads((ts) => ts.map((t) => (t.userId === userId ? { ...t, unread: 0 } : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadThreads();
  }, [loadThreads]);

  async function post(body: Record<string, unknown>) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-tools/patient-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Couldn't send");
      if (sel) await open(sel);
      void loadThreads();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? threads.filter((t) => `${t.name} ${t.email}`.toLowerCase().includes(term)) : threads;
  }, [threads, q]);

  const thread = messages.filter((m) => m.svc === svc);
  const svcsWithMessages = Array.from(new Set(messages.map((m) => m.svc)));

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-6 md:px-8 md:py-8">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">Patient messages</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Messages and weekly check-ins from the patient portal. Patients are told a prescriber replies within one working day.
        </p>
      </header>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-[12px] border border-[#e3e5e8] bg-white">
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email"
              className="h-9 w-full rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] outline-none focus:border-[#142e2a]"
            />
            <button onClick={() => void loadThreads()} className="h-9 rounded-[8px] border border-[#d0d3d6] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]">
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="p-4 text-[14px] text-[#616161]">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-[14px] text-[#8a8f94]">No patient messages yet.</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {filtered.map((t) => (
                <li key={t.userId}>
                  <button
                    onClick={() => void open(t.userId)}
                    className={`flex w-full flex-col gap-1 border-b border-[#f1f2f4] px-4 py-3 text-left hover:bg-[#f7f9f2] ${sel === t.userId ? "bg-[#eef5e9]" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#142e2a]">{t.name}</span>
                      {t.severe ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Severe check-in</span> : null}
                      {t.unread ? <span className="rounded-full bg-[#142e2a] px-2 py-0.5 text-[11px] font-semibold text-white">{t.unread}</span> : null}
                    </span>
                    <span className="truncate text-[12px] text-[#616161]">{t.lastBody || (t.openCheckins ? "New check-in" : "")}</span>
                    <span className="text-[11px] text-[#8a8f94]">
                      {when(t.lastAt)}
                      {t.openCheckins ? ` · ${t.openCheckins} check-in${t.openCheckins > 1 ? "s" : ""} to review` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="min-w-0 rounded-[12px] border border-[#e3e5e8] bg-white p-4 md:p-5">
          {!patient ? (
            <p className="py-16 text-center text-[14px] text-[#8a8f94]">Choose a patient to read and reply.</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eef0f2] pb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-[#142e2a]">{patient.name || patient.email}</h2>
                  <p className="text-[13px] text-[#616161]">
                    {patient.email}
                    {patient.phone ? ` · ${patient.phone}` : ""}
                  </p>
                  {patient.address ? <p className="text-[13px] text-[#616161]">{patient.address}</p> : null}
                </div>
                <div className="text-right text-[12px] text-[#616161]">
                  <p>DPD safe place: {patient.safePlace || "not set"}</p>
                  <p>
                    GP sharing: {patient.gpShare ? "on" : "off"}
                    {patient.gp ? ` · ${patient.gp}` : ""}
                  </p>
                </div>
              </div>

              {checkins.length ? (
                <div>
                  <h3 className="mb-2 text-[14px] font-semibold text-[#142e2a]">Weekly check-ins</h3>
                  <ul className="flex flex-col gap-2">
                    {checkins.slice(0, 6).map((c) => (
                      <li key={c.id} className={`rounded-[10px] border p-3 text-[13px] ${c.severe && !c.reply ? "border-red-300 bg-red-50" : "border-[#eef0f2]"}`}>
                        <p className="font-medium text-[#142e2a]">
                          {when(c.at)} · feeling {c.mood.toLowerCase()} · {c.effects.length ? c.effects.join(", ") : "no side effects"}
                          {c.severe ? " · SEVERE SYMPTOMS (told to stop and call 111)" : ""}
                        </p>
                        {c.note ? <p className="mt-1 text-[#3d4a47]">“{c.note}”</p> : null}
                        {c.reply ? (
                          <p className="mt-1 text-[#1f5a2e]">
                            Reply from {c.repliedBy}: {c.reply}
                          </p>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <input
                              value={ciReply[c.id] ?? ""}
                              onChange={(e) => setCiReply((r) => ({ ...r, [c.id]: e.target.value }))}
                              placeholder="Reply to this check-in"
                              className="h-9 min-w-0 flex-1 rounded-[8px] border border-[#d0d3d6] px-3 text-[13px] outline-none focus:border-[#142e2a]"
                            />
                            <button
                              disabled={sending || !(ciReply[c.id] ?? "").trim()}
                              onClick={async () => {
                                if (await post({ checkinId: c.id, reply: ciReply[c.id] })) setCiReply((r) => ({ ...r, [c.id]: "" }));
                              }}
                              className="h-9 rounded-[8px] bg-[#142e2a] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {Object.keys(SVC).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSvc(k)}
                      className={`h-8 rounded-full border px-3 text-[12px] font-semibold ${svc === k ? "border-[#142e2a] bg-[#142e2a] text-white" : "border-[#d0d3d6] bg-white text-[#142e2a]"}`}
                    >
                      {SVC[k]}
                      {svcsWithMessages.includes(k) ? ` · ${messages.filter((m) => m.svc === k).length}` : ""}
                    </button>
                  ))}
                </div>
                <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto rounded-[10px] bg-[#f7f9f2] p-3">
                  {thread.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-[#8a8f94]">No messages about {SVC[svc].toLowerCase()} yet.</p>
                  ) : (
                    thread.map((m) => (
                      <div key={m.id} className={`flex max-w-[85%] flex-col ${m.fromStaff ? "self-end items-end" : "self-start"}`}>
                        <div className={`whitespace-pre-wrap break-words rounded-[14px] px-3 py-2 text-[14px] ${m.fromStaff ? "bg-[#142e2a] text-white" : "bg-white text-[#142e2a]"}`}>
                          {m.body}
                        </div>
                        <span className="mt-1 text-[11px] text-[#8a8f94]">
                          {m.fromStaff ? m.author : "Patient"} · {when(m.at)}
                          {m.fromStaff ? (m.readByPatient ? " · read" : " · not read yet") : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder={`Reply about ${SVC[svc].toLowerCase()} as yourself. The patient sees your name.`}
                    className="w-full rounded-[10px] border border-[#d0d3d6] px-3 py-2 text-[14px] outline-none focus:border-[#142e2a]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-[#8a8f94]">We email the patient that there&rsquo;s a new message. The email never includes what you wrote.</p>
                    <button
                      disabled={sending || !reply.trim()}
                      onClick={async () => {
                        if (await post({ userId: patient.userId, svc, body: reply })) setReply("");
                      }}
                      className="h-10 rounded-[8px] bg-[#142e2a] px-5 text-[14px] font-semibold text-white disabled:opacity-50"
                    >
                      {sending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
