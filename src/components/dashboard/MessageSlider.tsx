import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import { TriangleAlert, Info } from 'lucide-react';
import type { ImportantMessage } from '../../types';

interface MessageSliderProps {
    messages: ImportantMessage[];
}

export const MessageSlider: React.FC<MessageSliderProps> = ({ messages }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (messages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [messages.length]);

    if (messages.length === 0) {
        return (
            <Card className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Pesan Penting</h4>
                <p className="text-[10px] text-slate-400 italic">Tidak ada pesan baru.</p>
            </Card>
        );
    }

    const currentMessage = messages[currentIndex];

    return (
        <Card className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Pesan Penting</h4>
            <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 min-h-[100px] transition-all duration-500 ease-in-out">
                    <div className="flex gap-4">
                        {currentMessage.type === 'warning' && <TriangleAlert className="text-accent-amber shrink-0" size={20} />}
                        {currentMessage.type === 'alert' && <TriangleAlert className="text-accent-rose shrink-0" size={20} />}
                        {currentMessage.type === 'info' && <Info className="text-accent-indigo shrink-0" size={20} />}
                        <div>
                            <p className="text-xs font-bold mb-1">{currentMessage.title}</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{currentMessage.message}</p>
                        </div>
                    </div>
                </div>

                {messages.length > 1 && (
                    <div className="flex justify-center gap-1.5 pt-2">
                        {messages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    currentIndex === idx ? "bg-accent-indigo w-3" : "bg-slate-700 hover:bg-slate-600"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};
