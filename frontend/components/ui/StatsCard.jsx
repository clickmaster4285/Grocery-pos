import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const StatsCard = ({ title, value, icon, description, color = "primary" }) => {
    const variants = {
        primary: "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10",
        sky: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
        rose: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
        amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    };

    const iconVariants = {
        primary: "bg-primary text-primary-foreground",
        sky: "bg-sky-500 text-white",
        emerald: "bg-emerald-500 text-white",
        rose: "bg-rose-500 text-white",
        amber: "bg-amber-500 text-white",
    };

    return (
        <Card className={cn("transition-all duration-300 border-2", variants[color])}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                            {title}
                        </p>
                        <h3 className="text-3xl font-black tracking-tighter">
                            {value}
                        </h3>
                        {description && (
                            <p className="text-[10px] font-bold opacity-60 italic">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-2xl shadow-lg", iconVariants[color])}>
                        {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatsCard;
