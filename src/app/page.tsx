import Link from 'next/link';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">FACK</h1>
                    <div className="space-x-4">
                        <Link href="#features" className="text-gray-600 hover:text-blue-600">
                            Features
                        </Link>
                        <Link href="#about" className="text-gray-600 hover:text-blue-600">
                            About
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-4">
                    Welcome to FACK
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                    Build something amazing with our platform
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                    Get Started
                </Link>
            </section>

            <section id="features" className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
                    <div className="grid grid-cols-3 gap-8">
                        <div className="p-6 border rounded-lg">
                            <h4 className="font-bold text-lg mb-2">Fast</h4>
                            <p className="text-gray-600">Lightning quick performance</p>
                        </div>
                        <div className="p-6 border rounded-lg">
                            <h4 className="font-bold text-lg mb-2">Reliable</h4>
                            <p className="text-gray-600">Built to scale</p>
                        </div>
                        <div className="p-6 border rounded-lg">
                            <h4 className="font-bold text-lg mb-2">Modern</h4>
                            <p className="text-gray-600">Latest technologies</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-900 text-white py-8 text-center">
                <p>&copy; 2024 FACK. All rights reserved.</p>
            </footer>
        </main>
    );
}