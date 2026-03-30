"use client";

import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addDays,
    isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    sessionsMap?: Record<string, number>;
}

export function Calendar({ selectedDate, onSelectDate, sessionsMap = {} }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 h-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-zinc-900 capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-4">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-medium text-zinc-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-4">
                {calendarDays.map((dayItem, dayIdx) => {
                    const dayString = format(dayItem, "yyyy-MM-dd");
                    const sessionCount = sessionsMap[dayString] || 0;
                    const isSelected = isSameDay(dayItem, selectedDate);
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);

                    return (
                        <div
                            key={dayItem.toString()}
                            className="flex flex-col items-center justify-center gap-1 cursor-pointer group"
                            onClick={() => onSelectDate(dayItem)}
                        >
                            <div
                                className={cn(
                                    "h-10 w-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all relative",
                                    !isCurrentMonth && "text-zinc-300",
                                    isSelected
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                        : "text-zinc-700 hover:bg-zinc-50",
                                    isToday(dayItem) && !isSelected && "text-blue-600 font-bold"
                                )}
                            >
                                {format(dayItem, "d")}
                            </div>

                            <div className="flex gap-0.5 h-1.5 min-h-[6px]">
                                {sessionCount > 0 && (
                                    <>
                                        {/* Render dots based on session count, max 3 */}
                                        {[...Array(Math.min(sessionCount, 3))].map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    isSelected ? "bg-white/50" : "bg-blue-500"
                                                )}
                                            />
                                        ))}
                                        {sessionCount > 3 && (
                                            <div
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    isSelected ? "bg-white/50" : "bg-blue-300"
                                                )}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
