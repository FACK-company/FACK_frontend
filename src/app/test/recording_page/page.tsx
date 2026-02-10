// Home page
'use client' 

import { useState } from 'react';

export default function Home() {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const handleStartRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`px-6 py-3 text-white font-semibold rounded-lg transition ${
                    isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
        </div>
    );
}