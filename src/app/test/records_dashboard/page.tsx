'use client';
import { useState, useEffect } from 'react';

interface Video {
    id: string;
    title: string;
    duration: number;
    date: string;
    thumbnail?: string;
}

export default function RecordsDashboard() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch recorded videos
        const fetchVideos = async () => {
            try {
                // Replace with your actual API endpoint
                const response = await fetch('/api/videos');
                const data = await response.json();
                setVideos(data);
            } catch (error) {
                console.error('Failed to fetch videos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Recorded Videos</h1>

                {videos.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        No videos recorded yet
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="bg-gray-200 h-40 rounded-t-lg flex items-center justify-center">
                                    {video.thumbnail ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-400">No thumbnail</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h2 className="font-semibold text-lg mb-2 truncate">
                                        {video.title}
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-1">
                                        {new Date(video.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Duration: {formatDuration(video.duration)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}