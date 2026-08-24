'use client';

import { useState } from 'react';
import Image from 'next/image';

const teamMembers = [
  { id: 'farhan', name: 'Farhan', img: '/team/farhan.jpeg' },
  { id: 'manas', name: 'Manas', img: '/team/manas.jpeg' },
  { id: 'om', name: 'Om', img: '/team/om.jpeg' },
];

export default function TeamPreviewPage() {
  // Store adjustments for each member. Default: center center, scale 1
  const [adjustments, setAdjustments] = useState<Record<string, { x: number; y: number; scale: number }>>({
    farhan: { x: 50, y: 50, scale: 1 },
    manas: { x: 50, y: 50, scale: 1 },
    om: { x: 50, y: 50, scale: 1 },
  });

  const updateAdjustments = (id: string, key: 'x' | 'y' | 'scale', value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 font-display text-3xl font-bold text-white">Team Avatar Preview & Crop Tool</h1>
        <p className="mb-10 text-slate-400">
          Adjust the sliders below to perfectly frame the faces inside the rounded containers. 
          When finished, copy the generated code for the <code className="text-teal-400">Team.tsx</code> file.
        </p>

        <div className="grid gap-12">
          {teamMembers.map((member) => {
            const adj = adjustments[member.id];
            
            return (
              <div key={member.id} className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6">
                <div className="flex flex-col items-start gap-8 md:flex-row">
                  
                  {/* Live Preview Container (Matches Team.tsx styling) */}
                  <div className="flex flex-col items-center gap-4">
                    <h2 className="font-display text-xl font-bold text-white">{member.name}</h2>
                    <div className="relative flex-shrink-0">
                      {/* 14x14 = 3.5rem = 56px */}
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 shadow-lg shadow-teal-900/15 ring-1 ring-white/10">
                        <Image
                          src={member.img}
                          alt={member.name}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: `${adj.x}% ${adj.y}%`,
                            transform: `scale(${adj.scale})`,
                          }}
                        />
                      </div>
                    </div>
                    {/* Enlarged Preview just for better visibility */}
                    <p className="text-xs text-slate-500">Enlarged Preview</p>
                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-slate-900 shadow-lg ring-1 ring-white/10">
                        <Image
                          src={member.img}
                          alt={member.name}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: `${adj.x}% ${adj.y}%`,
                            transform: `scale(${adj.scale})`,
                          }}
                        />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <label className="font-medium text-slate-300">X Position (Left/Right)</label>
                        <span className="text-teal-400">{adj.x}%</span>
                      </div>
                      <input
                        type="range"
                        min="0" max="100"
                        value={adj.x}
                        onChange={(e) => updateAdjustments(member.id, 'x', Number(e.target.value))}
                        className="w-full accent-teal-500"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <label className="font-medium text-slate-300">Y Position (Top/Bottom)</label>
                        <span className="text-teal-400">{adj.y}%</span>
                      </div>
                      <input
                        type="range"
                        min="0" max="100"
                        value={adj.y}
                        onChange={(e) => updateAdjustments(member.id, 'y', Number(e.target.value))}
                        className="w-full accent-teal-500"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <label className="font-medium text-slate-300">Zoom (Scale)</label>
                        <span className="text-teal-400">{adj.scale}x</span>
                      </div>
                      <input
                        type="range"
                        min="1" max="3" step="0.05"
                        value={adj.scale}
                        onChange={(e) => updateAdjustments(member.id, 'scale', Number(e.target.value))}
                        className="w-full accent-teal-500"
                      />
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-900 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Style Object Config:</p>
                      <pre className="overflow-x-auto text-sm text-emerald-400">
{`{
  objectPosition: '${adj.x}% ${adj.y}%',
  transform: 'scale(${adj.scale})'
}`}
                      </pre>
                    </div>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}
