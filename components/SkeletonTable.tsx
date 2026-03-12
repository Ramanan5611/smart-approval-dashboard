import React from 'react';

interface Props {
    columns?: number;
    rows?: number;
}

const SkeletonTable: React.FC<Props> = ({ columns = 5, rows = 5 }) => {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={`th-${i}`} className="p-4 font-semibold">
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={`tr-${rowIndex}`} className="bg-white">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={`td-${rowIndex}-${colIndex}`} className="p-4">
                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[200px]"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SkeletonTable;
