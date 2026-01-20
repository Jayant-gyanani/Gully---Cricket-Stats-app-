
import React from 'react';
import { BallRecord } from '../types';

interface OverVisualProps {
  balls: BallRecord[];
  isDark?: boolean;
}

const OverVisual: React.FC<OverVisualProps> = ({ balls, isDark = true }) => {
  const compressed: { type: string; count: number; labels: string[] }[] = [];
  
  balls.forEach((ball) => {
    const last = compressed[compressed.length - 1];
    if (ball.type === 'WIDE') {
      if (last && last.type === 'WIDE') {
        last.count++;
      } else {
        compressed.push({ type: 'WIDE', count: 1, labels: [] });
      }
    } else if (ball.type === 'NB') {
      const outcome = ball.nbValue ? ball.nbValue : (ball.runs > 0 ? ball.runs.toString() : '.');
      if (last && last.type === 'NB') {
        last.count++;
        last.labels.push(outcome);
      } else {
        compressed.push({ type: 'NB', count: 1, labels: [outcome] });
      }
    } else {
      compressed.push({ 
        type: ball.type, 
        count: 1, 
        labels: [ball.type === 'DOT' ? '.' : (ball.type === 'OUT' ? 'OUT' : ball.runs.toString())] 
      });
    }
  });

  const legalBallsCount = balls.filter(b => b.type !== 'WIDE' && b.type !== 'NB').length;
  const remaining = Math.max(0, 6 - legalBallsCount);

  return (
    <div className={`flex flex-wrap gap-2 justify-center p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {compressed.map((item, idx) => {
        let text = "";
        let colorClass = isDark ? "border-slate-700" : "border-slate-300";
        let fillClass = "";
        let subText = "";

        if (item.type === 'WIDE') {
          text = item.count > 1 ? `${item.count}WD` : "WD";
          colorClass = "border-amber-500 text-amber-500";
        } else if (item.type === 'NB') {
          text = item.count > 1 ? `${item.count}NB` : "NB";
          colorClass = "border-amber-500 text-amber-500";
          subText = `(${item.labels.join(',')})`;
        } else if (item.type === 'OUT') {
          text = "OUT";
          fillClass = "bg-red-500 border-red-500 text-white";
        } else {
          text = item.labels[0];
          fillClass = isDark ? "bg-white text-slate-900 border-white" : "bg-white text-slate-900 border-slate-200 shadow-sm";
        }

        return (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs ${colorClass} ${fillClass}`}>
              {text}
            </div>
            {subText && <span className="text-[10px] text-amber-400 mt-1 font-bold">{subText}</span>}
          </div>
        );
      })}
      {Array.from({ length: remaining }).map((_, i) => (
        <div key={`empty-${i}`} className={`w-10 h-10 rounded-full border-2 ${isDark ? 'border-slate-800' : 'border-slate-200 border-dashed'}`}></div>
      ))}
    </div>
  );
};

export default OverVisual;
