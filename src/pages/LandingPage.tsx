import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050b18] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Waves - CSS Implementation of the reference image style */}
            <div className="absolute inset-0 z-0">
                {/* Blue Wave */}
                <div
                    className="absolute top-[20%] left-[-20%] w-[140%] h-[60%] opacity-40 blur-[80px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, #00d2ff 0%, transparent 70%)',
                        transform: 'rotate(-15deg) skewX(-20deg)',
                    }}
                />
                <div
                    className="absolute top-[30%] left-[-10%] w-[120%] h-[40%] opacity-30 blur-[60px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #0091ff, transparent)',
                        transform: 'rotate(-10deg)',
                    }}
                />

                {/* Orange/Purple Wave */}
                <div
                    className="absolute top-[10%] right-[-20%] w-[140%] h-[60%] opacity-30 blur-[80px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, #ff8a00 0%, #7e22ce 50%, transparent 70%)',
                        transform: 'rotate(15deg) skewX(20deg)',
                    }}
                />
                <div
                    className="absolute top-[15%] right-[-10%] w-[120%] h-[30%] opacity-20 blur-[60px]"
                    style={{
                        background: 'linear-gradient(270deg, transparent, #ff4d00, transparent)',
                        transform: 'rotate(12deg)',
                    }}
                />
            </div>

            {/* Content Area */}
            <div className="relative z-10 text-center space-y-4 px-6 max-w-4xl">
                <p className="text-lg md:text-xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
                    Sistem Layanan Integrasi Sterilisasi (LINTAS)
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-[#22d3ee] drop-shadow-xl">
                    Rumah Sakit Menur Provinsi Jawa Timur
                </h1>

                <div className="pt-12">
                    <Button
                        size="lg"
                        onClick={() => navigate('/login')}
                        className="bg-[#22d3ee] hover:bg-[#06b6d4] text-[#050b18] font-black px-12 h-14 rounded-full text-lg shadow-2xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        MASUK KE SISTEM
                    </Button>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
                    © 2026 Lintas V2 • Intelligent CSSD Management
                </p>
            </div>
        </div>
    );
};
