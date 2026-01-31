// components/staff/StatsCard.jsx
'use client';

import { Card, CardContent } from "@/components/ui/card";

export const StatsCard = ({ label, value, border, bg, iconColor, Icon }) => {
   // Make sure Icon is a valid component
   if (!Icon) {
      console.error('Icon prop is undefined for StatsCard');
      return null;
   }

   return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
         <CardContent className="p-6">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-2">{value}</p>
               </div>
               <div className={`p-3 rounded-full ${bg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
               </div>
            </div>
            <div className={`mt-4 h-1 ${border} rounded-full`} />
         </CardContent>
      </Card>
   );
};