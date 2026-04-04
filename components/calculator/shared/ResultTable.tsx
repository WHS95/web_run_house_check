"use client";

import React from "react";

interface ResultTableRow {
    label: string;
    value: string;
    highlight?: boolean;
}

interface ResultTableProps {
    headers: [string, string];
    rows: ResultTableRow[];
}

export default function ResultTable({ headers, rows }: ResultTableProps) {
    if (rows.length === 0) return null;

    return (
        <div
            className="overflow-hidden rounded-xl"
            style={{ backgroundColor: "#2B3644" }}
        >
            <div
                className="flex justify-between px-4 py-3"
                style={{ backgroundColor: "#2B3644" }}
            >
                <span
                    className="text-[13px] font-semibold"
                    style={{ color: "#94A3B8" }}
                >
                    {headers[0]}
                </span>
                <span
                    className="text-[13px] font-semibold text-right"
                    style={{ color: "#94A3B8" }}
                >
                    {headers[1]}
                </span>
            </div>

            {rows.map((row, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <div
                            className="h-px"
                            style={{ backgroundColor: "#374151" }}
                        />
                    )}
                    <div className="flex justify-between px-4 py-3.5">
                        <span
                            className={`text-sm text-white ${row.highlight ? "font-semibold" : "font-medium"}`}
                        >
                            {row.label}
                        </span>
                        <span
                            className={`text-sm text-right ${row.highlight ? "font-bold" : "font-semibold"}`}
                            style={{ color: "#669FF2" }}
                        >
                            {row.value}
                        </span>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}
