import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import Link from "next/link";

interface StatsCardProps {
    title: string;
    value: string;
    icon?: LucideIcon;
    subtext?: string;
    trend?: string;
    trendPositive?: boolean;
    className?: string;
    iconClassName?: string;
    href?: string;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    subtext,
    trend,
    trendPositive = true,
    className,
    iconClassName,
    href,
}: StatsCardProps) {
    const Content = (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition-all hover:shadow-md flex flex-col justify-between h-full",
                className,
                href && "cursor-pointer group"
            )}
        >
            <div className="flex items-start justify-between">
                <h3 className={cn("text-sm font-medium text-zinc-500", href && "group-hover:text-blue-600 transition-colors")}>{title}</h3>
                {Icon && (
                    <div
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            iconClassName
                        )}
                    >
                        <Icon size={16} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900">{value}</span>
                {trend && (
                    <span
                        className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            trendPositive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        )}
                    >
                        {trend}
                    </span>
                )}
            </div>

            {subtext && <p className="mt-2 text-sm text-zinc-500">{subtext}</p>}
        </div>
    );

    if (href) {
        return <Link href={href} className="block h-full">{Content}</Link>;
    }

    return Content;
}
