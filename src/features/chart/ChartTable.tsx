import React from 'react';
import { RANKS } from '../../shared/lib/constants';
import type { MatrixCell } from '../../entities/chart/types';

interface ChartTableProps {
  matrix: MatrixCell[][];
}

export const ChartTable: React.FC<ChartTableProps> = ({ matrix }) => {
  return (
    <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-zinc-900/80 backdrop-blur px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800">
                핸드
              </th>
              {RANKS.map(r => (
                <th 
                  key={`top-${r}`} 
                  className="px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800 bg-zinc-900/60"
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RANKS.map((row, i) => (
              <tr key={`row-${row}`}>
                <td className="bg-zinc-900/80 backdrop-blur px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800">
                  {row}
                </td>
                {matrix[i].map(cell => (
                  <td
                    key={cell.key}
                    title={`${cell.label} • ${cell.reason}\n\n${cell.detailedReason}\n\n예시:\n${cell.examples.join('\n')}`}
                    className={`h-8 text-[10px] text-center border-b border-r border-zinc-800 cursor-default hover:scale-105 transition-transform ${getActionStyle(cell.action)}`}
                  >
                    {cell.label}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getActionStyle = (action: string) => {
  const styles = {
    R: 'bg-emerald-500/80 hover:bg-emerald-500',
    C: 'bg-indigo-500/80 hover:bg-indigo-500',
    F: 'bg-zinc-700/70 hover:bg-zinc-700',
    M: 'bg-amber-500/80 hover:bg-amber-500'
  };
  return styles[action as keyof typeof styles] || 'bg-zinc-700/70';
};
