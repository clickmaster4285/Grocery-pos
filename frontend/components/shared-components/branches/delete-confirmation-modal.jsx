import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    branch,
}) {
    if (!isOpen || !branch) return null;

    const isActive = branch.status === "ACTIVE";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-destructive/10" : "bg-success/10"
                                }`}
                        >
                            {isActive ? (
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-success" />
                            )}
                        </div>

                        <h2 className="text-lg font-semibold text-foreground">
                            {isActive ? "Deactivate Branch" : "Activate Branch"}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to{" "}
                        <span className="font-medium">
                            {isActive ? "deactivate" : "activate"}
                        </span>{" "}
                        <span className="font-medium text-foreground">
                            {branch.branch_name}
                        </span>
                        ?
                    </p>

                    {isActive && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            You can re-activate this branch later if needed.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        variant={isActive ? "destructive" : "default"}
                        onClick={onConfirm}
                        className={
                            isActive ? "bg-destructive hover:bg-destructive/90" : ""
                        }
                    >
                        {isActive ? "Deactivate" : "Activate"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
