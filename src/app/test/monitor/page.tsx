"use client";

import { useState } from "react";
import { mainApi } from "@/services";
type FinalizeResult = { fileName: string; filePath: string };

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

// Same as apiFinalize() in the uploaded recording page.tsx
async function apiFinalize(apiBase: string, sessionId: string): Promise<FinalizeResult> {
    const res = await fetch(`${apiBase}/recordings/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Finalize failed (${res.status}): ${msg}`);
    }

    return res.json();
}

// Decide which errors are "not ready yet" vs "real failure"
function isRetryableFinalizeError(message: string) {
    const m = message.toLowerCase();
    return (
        m.includes("no chunks found") ||
        m.includes("missing chunk") ||
        m.includes("not all chunks") ||
        m.includes("still uploading") ||
        m.includes("not ready") ||
        m.includes("cannot finalize") ||
        m.includes("in progress")
    );
}

// “Server-side waitForDrain”: keep trying finalize until chunks are present/complete
async function finalizeWithRetry(apiBase: string, sessionId: string) {
    const MAX_ATTEMPTS = 10;
    const BASE_DELAY_MS = 1500;

    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await apiFinalize(apiBase, sessionId);
        } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);

            if (!isRetryableFinalizeError(msg) || attempt === MAX_ATTEMPTS) {
                throw err;
            }

            const backoff = BASE_DELAY_MS + attempt * 500; // small linear backoff
            console.log(`⏳ Finalize not ready (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${backoff}ms...`, msg);
            await delay(backoff);
        }
    }

    // Should never hit here because we throw on last attempt
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
// ─── Types ────────────────────────────────────────────────────────────────────
type MergeStatus =
    | { kind: "idle" }
    | { kind: "merging" }
    | { kind: "done"; fileName: string; filePath: string; sessionId: string }
    | { kind: "error"; message: string };

// ─── Component ────────────────────────────────────────────────────────────────
export default function TestMonitorPage() {
    // Form fields
    const [studentId, setStudentId] = useState("345678");
    const [examId, setExamId] = useState("exam-cs105-quiz5");
    const [discoveredSessionId, setDiscoveredSessionId] = useState("");

    const [status, setStatus] = useState<MergeStatus>({ kind: "idle" });

    const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

    // Derive video URL
    function buildVideoUrl(result: { fileName: string; filePath: string; sessionId: string }) {
        // This endpoint might return 404 if the backend hasn't implemented it yet,
        // but it follows the existing pattern in the codebase.
        return `${apiBase}/recordings/stream/${result.sessionId}`;
    }

    async function handleRequestMerge(e?: React.FormEvent) {
        if (e) e.preventDefault();

        const trimmedStudent = studentId.trim();
        const trimmedExam = examId.trim();

        if (!trimmedStudent || !trimmedExam) {
            setStatus({ kind: "error", message: "Student ID and Exam ID are required." });
            return;
        }

        setStatus({ kind: "merging" });

        try {
            let targetSessionId = discoveredSessionId.trim();

            if (!targetSessionId) {
                console.log(`🔍 Searching for sessions in exam: ${trimmedExam}...`);

                // Polling helper: try to find a session, wait if none or if only old ones exist
                let sessions = await mainApi.getExamSessions(trimmedExam);
                let studentSessions = sessions.filter(s => s.studentId === trimmedStudent);

                // If no sessions or no very recent sessions, try waiting a few seconds 
                // (student might have JUST started)
                if (studentSessions.length === 0) {
                    console.log("⏳ No sessions found. Waiting 3s for student to start...");
                    await new Promise(r => setTimeout(r, 3000));
                    sessions = await mainApi.getExamSessions(trimmedExam);
                    studentSessions = sessions.filter(s => s.studentId === trimmedStudent);
                }

                if (studentSessions.length === 0) {
                    setStatus({
                        kind: "error",
                        message: `No sessions found for Student ${trimmedStudent} in Exam ${trimmedExam}. Is the student recording?`
                    });
                    return;
                }

                // Sort by createdAt (absolute DB creation time) or startTime
                studentSessions.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.startTime).getTime() || 0;
                    const timeB = new Date(b.createdAt || b.startTime).getTime() || 0;
                    return timeB - timeA;
                });

                const activeSession = studentSessions[0];
                targetSessionId = activeSession.id;
                setDiscoveredSessionId(targetSessionId);
                console.log(`✅ Automatically picked newest session: ${targetSessionId} (Created: ${activeSession.createdAt})`);
            }

            // Step 2: Request the merge/finalize on the server
            console.log(`🚀 Requesting merge for session: ${targetSessionId}`);
            try {
                const finalized = await finalizeWithRetry(apiBase, targetSessionId);

                setStatus({
                    kind: "done",
                    fileName: finalized.fileName,
                    filePath: finalized.filePath,
                    sessionId: targetSessionId,
                });
            } catch (mergeErr) {
                const msg = mergeErr instanceof Error ? mergeErr.message : String(mergeErr);

                // If the error is "No chunks found", the student might have started but 
                // the first chunk upload (every 5s) hasn't finished yet.
                if (msg.includes("No chunks found")) {
                    console.log("⚠️ Backend reports no chunks yet. Retrying in 4s...");
                    setStatus({ kind: "merging" }); // keep loading state
                    await new Promise(r => setTimeout(r, 4000));

                    // Recursive call to try again now that chunks should be there
                    return handleRequestMerge();
                }

                throw mergeErr; // throw other errors to main catch
            }
        } catch (err) {
            console.error("Merge error:", err);
            const msg = err instanceof Error ? err.message : String(err);
            setStatus({ kind: "error", message: msg });
        }
    }

    function handleReset() {
        setStatus({ kind: "idle" });
        setDiscoveredSessionId("");
    }

    const isMerging = status.kind === "merging";

    return (
        <div style={{ background: "#0f1117", minHeight: "100vh", color: "#e4e6f1", padding: "40px 20px", fontFamily: "Inter, sans-serif" }}>
            <main style={{ maxWidth: 800, margin: "0 auto" }}>
                <header style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#fff" }}>Test Recording Monitor</h1>
                    <p style={{ color: "#8b8fa8", marginTop: 8 }}>
                        Testing the "Merge-on-the-fly" feature without Professor UI dependencies.
                    </p>
                </header>

                {/* Configuration Card */}
                <div style={{ background: "#1a1d27", borderRadius: 12, padding: 24, border: "1px solid #2a2d3a", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 600, color: "#8b8fa8", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.05em" }}>Test Configuration</h2>

                    <form onSubmit={handleRequestMerge} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>STUDENT ID</span>
                                <input
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    disabled={isMerging}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>EXAM ID</span>
                                <input
                                    type="text"
                                    value={examId}
                                    onChange={(e) => setExamId(e.target.value)}
                                    disabled={isMerging}
                                    style={inputStyle}
                                />
                            </label>
                        </div>

                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>SESSION ID</span>
                                <span style={{ fontSize: 10, color: "#4b5563" }}>Detected automatically</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Auto-detecting..."
                                value={discoveredSessionId}
                                onChange={(e) => setDiscoveredSessionId(e.target.value)}
                                disabled={isMerging}
                                style={inputStyle}
                            />
                        </label>

                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <button
                                type="submit"
                                disabled={isMerging}
                                style={{ ...btnStyle, backgroundColor: isMerging ? "#1e2235" : "#3b82f6" }}
                            >
                                {isMerging ? "⏳ Processing..." : "Start Discovery & Merge"}
                            </button>
                            {status.kind !== "idle" && (
                                <button type="button" onClick={handleReset} style={{ ...btnStyle, backgroundColor: "transparent", border: "1px solid #374151" }}>
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Discovery Indicator */}
                {discoveredSessionId && (
                    <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14 }}>🔍 Discovered Session ID:</span>
                        <code style={{ color: "#38bdf8", fontWeight: 600 }}>{discoveredSessionId}</code>
                    </div>
                )}

                {/* Status & Results */}
                {status.kind === "error" && (
                    <div style={{ padding: 16, borderRadius: 8, background: "#451a1a", border: "1px solid #ef4444", color: "#fca5a5", fontSize: 14 }}>
                        <strong>Error:</strong> {status.message}
                    </div>
                )}

                {status.kind === "done" && (
                    <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", border: "1px solid #1e3a8a" }}>
                        <div style={{ padding: 16, borderBottom: "1px solid #1e3a8a", display: "flex", alignItems: "center", gap: 10, backgroundColor: "#1e293b" }}>
                            <span style={{ color: "#4ade80", fontSize: 18 }}>✔</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Merge Complete</span>
                        </div>

                        <div style={{ padding: 24 }}>
                            <div style={{ marginBottom: 16 }}>
                                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Server-side File Path:</p>
                                <code style={{ fontSize: 12, background: "#000", padding: "8px 12px", borderRadius: 6, display: "block", overflowX: "auto", border: "1px solid #1e293b" }}>
                                    {status.filePath}
                                </code>
                            </div>

                            <div style={{ background: "#000", borderRadius: 8, overflow: "hidden", marginBottom: 16, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                                <video controls style={{ width: "100%", maxHeight: 400, display: "block" }}>
                                    <source src={buildVideoUrl(status)} type="video/mp4" />
                                    Your browser does not support playing this video.
                                </video>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <a
                                    href={buildVideoUrl(status)}
                                    download={status.fileName}
                                    style={{ color: "#3b82f6", fontSize: 13, textDecoration: "none" }}
                                >
                                    Try Direct Download ⬇
                                </a>
                            </div>

                            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 16 }}>
                                Note: The video preview depends on the backend's ability to serve static files from the storage directory.
                            </p>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div style={{ marginTop: 40, borderTop: "1px solid #2a2d3a", paddingTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#8b8fa8", marginBottom: 12 }}>Testing Steps:</h3>
                    <ol style={{ fontSize: 13, color: "#94a3b8", paddingLeft: 20, lineHeight: 1.8 }}>
                        <li>Open the <a href="/test/recording_page" target="_blank" style={{ color: "#3b82f6" }}>Recording Test Page</a>.</li>
                        <li>Start a recording session (Wait 10-15s for chunks to upload).</li>
                        <li>Return here and click <strong>"Start Discovery & Merge"</strong>.</li>
                        <li>Observe the <strong>Browser Console (F12)</strong> for step-by-step progress.</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}

const inputStyle = {
    background: "#0f1117",
    border: "1px solid #374151",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f3f4f6",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const
};

const btnStyle = {
    padding: "10px 24px",
    borderRadius: 8,
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.2s"
};
