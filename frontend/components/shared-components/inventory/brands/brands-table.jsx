'use client';
import { Pencil, Trash2, MoreVertical, Globe, Hash, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';

export default function BrandsTable({ brands,
    onEdit,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    const handleRowClick = (brandId) => {
        router.push(`/${userPrimaryRole}/brands/${brandId}`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    console.log(brands)

    return (    
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border bg-muted/20">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Hash className="h-3 w-3" /> Code
                            </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Brand Identity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3" /> Origin
                            </div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                            Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Activity className="h-3 w-3" /> Audit
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {brands.map((brand) => (
                        <tr
                            key={brand._id}
                            className="transition-all hover:bg-muted/30 cursor-pointer group"
                            onClick={() => handleRowClick(brand._id)}
                        >
                            <td className="px-6 py-5">
                                <Badge variant="outline" className="font-mono text-[11px] font-bold border-primary/20 text-primary bg-primary/5 px-2 py-0.5 uppercase">
                                    {brand.brand_code || "N/A"}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center overflow-hidden shrink-0">
                                        {brand.logo ? (
                                            <img 
                                                src={`${API_URL}/${brand.logo}`} 
                                                alt={brand.name} 
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ShieldCheck className="h-5 w-5 text-muted-foreground/30" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                            {brand.name}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-1 max-w-50">
                                            {brand.description || "No descriptive metadata"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-sm text-foreground font-semibold">
                                    {brand.origin || "Global"}
                                </div>
                                {brand.website && (
                                    <div className="text-[10px] text-primary font-medium truncate max-w-37.5">
                                        {brand.website.replace(/^https?:\/\//, '')}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-5 text-center">
                                <Badge
                                    className={`
                                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5
                                        ${brand.status === "ACTIVE"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                            : "bg-muted text-muted-foreground border-transparent"}
                                    `}
                                    variant="outline"
                                >
                                    {brand.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-xs font-bold text-foreground">
                                    {brand.createdBy?.firstName || "System"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                    {formatDate(brand.createdAt)}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-xl border-border/50">
                                            <DropdownMenuItem
                                                onClick={() => onEdit(brand)}
                                                className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg font-semibold"
                                            >
                                                <Pencil className="h-4 w-4 text-primary" />
                                                <span className="text-sm">Edit Brand</span>
                                            </DropdownMenuItem>
                                            
                                            <DropdownMenuSeparator className="my-1.5" />
                                            
                                            <DropdownMenuItem
                                                onClick={() => onDelete(brand._id)}
                                                className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive py-2 px-3 rounded-lg font-semibold"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="text-sm">Delete Brand</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {brands.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <div className="bg-muted/30 p-4 rounded-full">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg">No brands registered</p>
                    <p className="text-sm text-muted-foreground max-w-62.5">
                        Start building your product catalog by registering your first brand node.
                    </p>
                </div>
            )}
        </div>
    );
}
