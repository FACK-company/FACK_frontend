'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const CHUNK_INTERVAL_MS = 5_000;

// Ranked list of MIME types — first supported one wins
const MIME_PREFERENCE = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
];

function getBestMime(): string {
    return MIME_PREFERENCE.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

function newSessionId(): string {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Status =
    | { kind: 'idle' }
    | { kind: 'recording' }
    | { kind: 'uploading' }
    | { kind: 'done'; fileName: string }
    | { kind: 'error'; message: string };

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiUploadChunk(
    sessionId: string,
    studentId: string,
    examId: string,
    index: number,
    blob: Blob,
): Promise<void> {
    const fd = new FormData();
    fd.append('sessionId', sessionId);
    fd.append('studentId', studentId);
    fd.append('examId', examId);
    fd.append('index', String(index));
    fd.append('chunk', blob, `chunk_${String(index).padStart(6, '0')}.webm`);

    const res = await fetch(`${API_BASE}/recordings/chunk`, {
        method: 'POST',
        body: fd,
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Chunk ${index} upload failed (${res.status}): ${msg}`);
    }
}

async function apiFinalize(sessionId: string): Promise<{ fileName: string; filePath: string }> {
    const res = await fetch(`${API_BASE}/recordings/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Finalize failed (${res.status}): ${msg}`);
    }

    return res.json();
}

async function apiDeleteSession(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/recordings/${sessionId}`, { method: 'DELETE' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecordingPage() {
    const [status, setStatus] = useState<Status>({ kind: 'idle' });
    const [elapsed, setElapsed] = useState(0); // seconds while recording

    // Refs — these never cause re-renders but persist across renders
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionIdRef = useRef<string>('');
    const chunkIndexRef = useRef(0);

    // Upload queue: blobs are pushed here; a single async drainer processes them in order
    const queueRef = useRef<Blob[]>([]);
    const drainingRef = useRef(false);
    const drainErrorRef = useRef<Error | null>(null);

    // Timer
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Drain the upload queue sequentially so chunks never arrive out of order
    const drainQueue = useCallback(async () => {
        if (drainingRef.current) return;
        drainingRef.current = true;

        while (queueRef.current.length > 0) {
            const blob = queueRef.current[0];
            const index = chunkIndexRef.current;
            try {
                const studentId = '345678'; 
                const examId = 'exam-cs105-quiz5'; 
                await apiUploadChunk(sessionIdRef.current, studentId, examId, index, blob);
                console.log(`✅ Chunk ${index} uploaded (${blob.size} bytes)`);
                queueRef.current.shift();
                chunkIndexRef.current += 1;
            } catch (err) {
                console.error(err);
                drainErrorRef.current = err instanceof Error ? err : new Error(String(err));
                break; // stop draining; finalize will catch the error
            }
        }

        drainingRef.current = false;
    }, []);

    // Wait until the queue is fully drained (called before finalizing)
    const waitForDrain = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            const check = () => {
                if (!drainingRef.current && queueRef.current.length === 0) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setElapsed(0);
    }, []);

    const cleanUpStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    // Called when MediaRecorder fully stops — drain queue then finalize
    const handleRecorderStop = useCallback(async () => {
        stopTimer();
        setStatus({ kind: 'uploading' });

        await waitForDrain();

        if (drainErrorRef.current) {
            setStatus({ kind: 'error', message: drainErrorRef.current.message });
            // Clean up orphaned chunks on the server
            await apiDeleteSession(sessionIdRef.current).catch(() => { });
            return;
        }

        try {
            const result = await apiFinalize(sessionIdRef.current);
            console.log('🎉 Finalized:', result);
            setStatus({ kind: 'done', fileName: result.fileName });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setStatus({ kind: 'error', message: msg });
        }
    }, [stopTimer, waitForDrain]);

    const startRecording = useCallback(async () => {
        drainErrorRef.current = null;
        queueRef.current = [];
        chunkIndexRef.current = 0;
        sessionIdRef.current = newSessionId();
        console.log('🆕 New recording session:', sessionIdRef.current);
        let stream: MediaStream;
        try {
            console.log('Requesting screen share with constraints: 1280x720 @ 15fps');
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } },
                audio: false,
            });
        } catch {
            console.log('Screen share permission denied or cancelled by user.');
            setStatus({ kind: 'error', message: 'Screen share was cancelled or denied.' });
            return;
        }
        console.log('Screen share granted. Stream tracks:', stream.getTracks().map((t) => t.label).join(', '));
        // Enforce full-screen share (not a tab or window)
        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack.getSettings() as MediaTrackSettings & { displaySurface?: string };
        if (trackSettings.displaySurface && trackSettings.displaySurface !== 'monitor') {
            alert('❌ Please share your ENTIRE SCREEN, not a tab or window.');
            stream.getTracks().forEach((t) => t.stop());
            return;
        }

        streamRef.current = stream;

        const mime = getBestMime();
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        recorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (!e.data || e.data.size === 0) return;
            queueRef.current.push(e.data);
            drainQueue(); // non-blocking; drainer skips if already running
        };

        recorder.onerror = (e: Event) => {
            const err = (e as Event & { error?: DOMException }).error;
            console.error('Recorder error:', err);
            setStatus({ kind: 'error', message: err?.message ?? 'Recorder error' });
            cleanUpStream();
        };

        recorder.onstop = () => {
            cleanUpStream();
            handleRecorderStop();
        };

        // Handle user clicking the browser's native "Stop sharing" button
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (recorder.state !== 'inactive') recorder.stop();
        });

        recorder.start(CHUNK_INTERVAL_MS);

        setStatus({ kind: 'recording' });

        // Start elapsed-time counter
        let secs = 0;
        timerRef.current = setInterval(() => {
            secs += 1;
            setElapsed(secs);
        }, 1_000);

        console.log('🎬 Recording started. sessionId:', sessionIdRef.current, '| mime:', mime || '(browser default)');
    }, [cleanUpStream, drainQueue, handleRecorderStop]);

    const stopRecording = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopTimer();
            cleanUpStream();
            if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
        };
    }, [stopTimer, cleanUpStream]);

    // ─── Derived UI state ──────────────────────────────────────────────────────
    const isRecording = status.kind === 'recording';
    const isBusy = status.kind === 'uploading';
    const canStart = status.kind === 'idle' || status.kind === 'done' || status.kind === 'error';
    const canStop = isRecording;

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-8">
            <h1 className="text-3xl font-bold tracking-tight">Screen Recorder</h1>

            {/* Status Banner */}
            <StatusBanner status={status} elapsed={elapsed} formatTime={formatTime} />

            {/* Controls */}
            <div className="flex gap-4">
                <button
                    onClick={startRecording}
                    disabled={!canStart}
                    className="px-6 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Start Recording
                </button>

                <button
                    onClick={stopRecording}
                    disabled={!canStop}
                    className="px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Stop Recording
                </button>
            </div>

            {isBusy && (
                <p className="text-sm text-gray-400 animate-pulse">
                    Finalizing upload, please wait…
                </p>
            )}
        </div>
    );
}

// ─── Sub-component: Status Banner ─────────────────────────────────────────────
function StatusBanner({
    status,
    elapsed,
    formatTime,
}: {
    status: Status;
    elapsed: number;
    formatTime: (s: number) => string;
}) {
    const base = 'px-6 py-3 rounded-xl text-sm font-medium';

    switch (status.kind) {
        case 'idle':
            return <div className={`${base} bg-gray-800 text-gray-400`}>● Idle — press Start to begin</div>;

        case 'recording':
            return (
                <div className={`${base} bg-red-900/60 text-red-300 flex items-center gap-3`}>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    Recording — {formatTime(elapsed)}
                </div>
            );

        case 'uploading':
            return <div className={`${base} bg-yellow-900/60 text-yellow-300`}>⏫ Uploading &amp; finalizing…</div>;

        case 'done':
            return (
                <div className={`${base} bg-green-900/60 text-green-300`}>
                    ✔ Done — <span className="font-mono">{status.fileName}</span>
                </div>
            );

        case 'error':
            return (
                <div className={`${base} bg-red-950 text-red-400`}>
                    ✖ Error: {status.message}
                </div>
            );
    }
}
