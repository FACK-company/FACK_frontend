'use client' 

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex gap-6">
                <Link href="/test/recording_page">
                    <button className="px-6 py-3 text-white font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 transition">
                        Go to Recording Page
                    </button>
                </Link>
                <Link href="/test/records_dashboard">
                    <button className="px-6 py-3 text-white font-semibold rounded-lg bg-green-500 hover:bg-green-600 transition">
                        Go to Recordings Dashboard Page
                    </button>
                </Link>
            </div>
        </div>
    );
}
