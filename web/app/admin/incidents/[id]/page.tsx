// // app/incidents/[id]/page.tsx
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { incidentsApi } from '@/lib/api/incidents'; // your client API
// // import { formatDate } from '@/lib/utils/date'; // optional, or inline formatter
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/components/ui/toast';

// export default function IncidentDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { showToast } = useToast();

//   const id = params?.id as string | undefined;

//   const [incident, setIncident] = useState<any | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   useEffect(() => {
//     if (!id) return;

//     const load = async () => {
//       setLoading(true);
//       setNotFound(false);
//       try {
//         const res = await incidentsApi.getById(id); // should call GET /incidents/:id
//         if (!res) {
//           setNotFound(true);
//           return;
//         }
//         if (res?.success && res.data) {
//           setIncident(res.data);
//         } else {
//           // maybe backend returns { success: false, message: 'Not found' }
//           setNotFound(true);
//         }
//       } catch (err: any) {
//         console.error('Failed to load incident:', err);
//         if (err?.status === 404) setNotFound(true);
//         showToast(err?.message || 'Failed to load incident', 'error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, [id, showToast]);

//   if (!id) {
//     return (
//       <div className="p-6">
//         <Card className="p-6">
//           <h2 className="text-lg font-bold">Invalid incident id</h2>
//           <p className="mt-2 text-sm text-gray-600">No id provided in URL.</p>
//           <div className="mt-4">
//             <Button onClick={() => router.back()}>Go Back</Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="p-6">
//         <Card className="p-6">
//           <p>Loading incident...</p>
//         </Card>
//       </div>
//     );
//   }

//   if (notFound || !incident) {
//     return (
//       <div className="p-6">
//         <Card className="p-6">
//           <h2 className="text-lg font-bold">404 — Incident not found</h2>
//           <p className="mt-2 text-sm text-gray-600">This incident doesn't exist or you don't have access.</p>
//           <div className="mt-4 flex gap-2">
//             <Button onClick={() => router.push('/incidents')}>Back to list</Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   // Render details
//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <Card className="p-6 space-y-4">
//         <div className="flex items-start justify-between">
//           <div>
//             <h1 className="text-2xl font-bold">{(incident.type || 'Incident').toString().toUpperCase()}</h1>
//             <p className="text-sm text-gray-500">{incident._id}</p>
//           </div>
//           <div className="text-right">
//             <div className="text-sm text-gray-500">Status</div>
//             <div className="font-medium">{incident.status || 'N/A'}</div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <div className="text-xs text-gray-500">Severity</div>
//             <div className="font-semibold">{incident.severity || 'N/A'}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">Source</div>
//             <div className="font-semibold">{incident.source || 'system'}</div>
//           </div>
// {/* 
//           <div>
//             <div className="text-xs text-gray-500">When</div>
//             <div className="font-semibold">{formatDate(incident.createdAt || incident.historicalDate)}</div>
//           </div> */}

//           <div>
//             <div className="text-xs text-gray-500">Location</div>
//             <div className="font-semibold">{incident.location || 'School Premises'}</div>
//           </div>
//         </div>

//         <div>
//           <div className="text-xs text-gray-500">Description</div>
//           <div className="mt-2 text-sm text-gray-700">{incident.description || 'No description provided'}</div>
//         </div>

//         <div className="flex justify-end gap-2">
//           <Button variant="outline" onClick={() => router.push('/admin/incidents')}>Back</Button>
//         </div>
//       </Card>
//     </div>
//   );
// }

















// // app/admin/incidents/[id]/page.tsx
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useAuthStore } from '@/lib/store/auth-store';
// import { incidentsApi } from '@/lib/api/incidents';
// import { apiClient } from '@/lib/api/client';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { useToast } from '@/components/ui/toast';
// import {
//   Users,
//   Clock,
//   MapPin,
//   AlertTriangle,
//   History
// } from 'lucide-react';

// // --- helpers ---

// function parseMaybeMongoExtended(value: any): any {
//   if (!value || typeof value !== 'object') return value;

//   if ('$date' in value) {
//     const d = value.$date;
//     if (typeof d === 'string') return new Date(d).toISOString();
//     if (typeof d === 'object' && d.$numberLong) return new Date(parseInt(d.$numberLong, 10)).toISOString();
//     return new Date(d).toISOString();
//   }
//   if ('$oid' in value) {
//     return value.$oid;
//   }
//   if (Array.isArray(value)) {
//     return value.map(v => parseMaybeMongoExtended(v));
//   }
//   const out: any = {};
//   for (const k of Object.keys(value)) out[k] = parseMaybeMongoExtended(value[k]);
//   return out;
// }

// function pretty(val: any) {
//   if (!val && val !== 0) return 'N/A';
//   try {
//     if (typeof val === 'string') {
//       const d = new Date(val);
//       if (!isNaN(d.getTime())) return d.toLocaleString();
//       return val;
//     }
//     if (val instanceof Date) return val.toLocaleString();
//     if (typeof val === 'number') return String(val);
//     return String(val);
//   } catch {
//     return String(val);
//   }
// }

// /**
//  * Render a value safely:
//  * - primitives -> as is
//  * - objects with typical user fields -> "Name (email)" or "Name"
//  * - objects otherwise -> short JSON
//  */
// function renderSafe(value: any) {
//   if (value === null || value === undefined) return 'N/A';
//   if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);

//   // If it's an object that looks like a user/person
//   const maybeName = value.name || value.fullName || value.displayName || value.username;
//   const maybeEmail = value.email || value.mail;
//   const maybeId = value.id || value._id || value.$oid;

//   if (maybeName || maybeEmail) {
//     if (maybeEmail) return ${maybeName || maybeEmail} (${maybeEmail});
//     return ${maybeName};
//   }

//   // If it's an object with id only
//   if (maybeId) return String(maybeId);

//   // Fall back to short JSON (avoid very long outputs)
//   try {
//     const s = JSON.stringify(value);
//     if (s.length > 200) return s.slice(0, 200) + '...';
//     return s;
//   } catch {
//     return String(value);
//   }
// }

// // --- page component ---

// export default function IncidentDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { showToast } = useToast();
//   const { accessToken, isAuthenticated } = useAuthStore();

//   const id = params?.id as string | undefined;

//   const [incident, setIncident] = useState<any | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   useEffect(() => {
//     if (!accessToken) return;
//     if (apiClient && typeof (apiClient as any).setToken === 'function') {
//       (apiClient as any).setToken(accessToken);
//     } else {
//       try {
//         (apiClient as any).defaults = (apiClient as any).defaults || {};
//         (apiClient as any).defaults.headers = (apiClient as any).defaults.headers || {};
//         (apiClient as any).defaults.headers.common = (apiClient as any).defaults.headers.common || {};
//         (apiClient as any).defaults.headers.common['Authorization'] = Bearer ${accessToken};
//       } catch (e) {
//         // ignore
//       }
//     }
//   }, [accessToken]);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push('/login');
//       return;
//     }
//     if (!id) return;

//     const load = async () => {
//       setLoading(true);
//       setNotFound(false);
//       try {
//         let res: any = null;
//         if (incidentsApi && typeof (incidentsApi as any).getById === 'function') {
//           try {
//             res = await (incidentsApi as any).getById(id);
//             if (res?.success && res.data) {
//               const parsed = parseMaybeMongoExtended(res.data);
//               setIncident(parsed);
//               setLoading(false);
//               return;
//             }
//             if (res && !res.success && res.data) {
//               const parsed = parseMaybeMongoExtended(res.data);
//               setIncident(parsed);
//               setLoading(false);
//               return;
//             }
//           } catch (err: any) {
//             console.error('incidentsApi.getById error', err);
//             if (err?.response?.status === 404) {
//               setNotFound(true);
//               setLoading(false);
//               return;
//             }
//           }
//         }

//         const fallbackUrl = ${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/admin/incidents/${encodeURIComponent(id)};
//         const headers: Record<string, string> = { 'Content-Type': 'application/json' };
//         if (accessToken) headers['Authorization'] = Bearer ${accessToken};
//         const fetchRes = await fetch(fallbackUrl, { method: 'GET', headers });
//         if (fetchRes.status === 404) {
//           setNotFound(true);
//           setLoading(false);
//           return;
//         }
//         if (!fetchRes.ok) throw new Error(Failed to fetch: ${fetchRes.status});
//         const json = await fetchRes.json();
//         const payload = (json?.data && typeof json.data === 'object') ? json.data : (json?.data || json);
//         const parsed = parseMaybeMongoExtended(payload);
//         setIncident(parsed);
//       } catch (err: any) {
//         console.error('Failed to load incident details', err);
//         showToast(err?.message || 'Failed to load incident details', 'error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id, isAuthenticated, accessToken]);

//   if (loading) {
//     return (
//       <div className="p-6 max-w-4xl mx-auto">
//         <Card className="p-6">
//           <div>Loading incident details…</div>
//         </Card>
//       </div>
//     );
//   }

//   if (!id || notFound || !incident) {
//     return (
//       <div className="p-6 max-w-4xl mx-auto">
//         <Card className="p-6">
//           <h2 className="text-lg font-bold">Incident not found</h2>
//           <p className="mt-2 text-sm text-gray-600">This incident either does not exist or you don't have access.</p>
//           <div className="mt-4">
//             <Button onClick={() => router.push('/admin/incidents')}>Back to list</Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   const src = incident.source || 'N/A';
//   const severity = incident.severity || incident.raw?.severity || 'N/A';
//   const type = incident.type || incident.raw?.type || 'N/A';

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <Card className="p-6 space-y-4">
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-bold">{(type || 'Incident').toString().toUpperCase()} {incident.isHistorical ? <span className="text-sm text-purple-600"> (Historical)</span> : null}</h1>
//             <p className="text-sm text-gray-500 mt-1">{renderSafe(incident._id || incident.id || incident.raw?._id || incident.raw?.id || '—')}</p>
//           </div>

//           <div className="text-right">
//             <div className="text-xs text-gray-500">Status</div>
//             <div className="font-semibold">{renderSafe(incident.status || 'N/A').toString().toUpperCase()}</div>
//             <div className="mt-2 text-xs text-gray-500">Severity</div>
//             <div className="font-semibold">{renderSafe(severity || 'N/A').toString().toUpperCase()}</div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <div className="text-xs text-gray-500">Title</div>
//             <div className="font-semibold">{renderSafe(incident.metadata?.title || incident.raw?.metadata?.title || 'N/A')}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">Source</div>
//             <div className="font-semibold">{renderSafe(src)}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">When (historical)</div>
//             <div className="font-semibold">{pretty(incident.historicalDate || incident.raw?.historicalDate)}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">Created / Added at</div>
//             <div className="font-semibold">{pretty(incident.createdAt || incident.addedAt || incident.raw?.createdAt || incident.raw?.addedAt)}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">Location / Affected Area</div>
//             <div className="font-semibold">{renderSafe(incident.location || incident.impact?.affectedArea || incident.raw?.impact?.affectedArea || 'N/A')}</div>
//           </div>

//           <div>
//             <div className="text-xs text-gray-500">Affected (people)</div>
//             <div className="font-semibold">{Array.isArray(incident.affectedUsers) ? incident.affectedUsers.length : (incident.impact?.casualties ? fatal: ${incident.impact.casualties.fatal}, injured: ${incident.impact.casualties.injured} : 0)}</div>
//           </div>
//         </div>

//         <div>
//           <div className="text-xs text-gray-500">Description</div>
//           <div className="mt-2 text-sm text-gray-700">{renderSafe(incident.metadata?.description || incident.description || incident.raw?.metadata?.description || 'N/A')}</div>
//         </div>

//         {/* show addedBy / resolvedBy safely */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
//           <div><strong>Added By:</strong> {renderSafe(incident.addedBy || incident.raw?.addedBy || 'N/A')}</div>
//           <div><strong>Resolved By:</strong> {renderSafe(incident.resolvedBy || incident.raw?.resolvedBy || 'N/A')}</div>
//         </div>

//         {/* Historical details */}
//         {(incident.historicalDetails || incident.raw?.historicalDetails) && (
//           <div>
//             <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
//               <History className="h-4 w-4" />
//               Historical Details
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
//               <div><strong>Original Source:</strong> {renderSafe(incident.historicalDetails?.originalSource || incident.raw?.historicalDetails?.originalSource || 'N/A')}</div>
//               <div><strong>Verified By:</strong> {renderSafe(incident.historicalDetails?.verifiedBy || incident.raw?.historicalDetails?.verifiedBy || 'N/A')}</div>
//               <div><strong>Verification Date:</strong> {pretty(incident.historicalDetails?.verificationDate || incident.raw?.historicalDetails?.verificationDate)}</div>
//               <div><strong>Documentation:</strong> {Array.isArray(incident.historicalDetails?.documentation || incident.raw?.historicalDetails?.documentation) ? (incident.historicalDetails?.documentation || incident.raw?.historicalDetails?.documentation).map((u:any,i:number)=>(<div key={i}><a className="text-blue-600 underline" href={u} target="_blank" rel="noreferrer">{u}</a></div>)) : 'N/A'}</div>
//               <div><strong>Lessons Learned:</strong> {renderSafe(incident.historicalDetails?.lessonsLearned || incident.raw?.historicalDetails?.lessonsLearned || 'N/A')}</div>
//               <div><strong>Precautions Taken:</strong> {renderSafe(incident.historicalDetails?.precautionsTaken || incident.raw?.historicalDetails?.precautionsTaken || 'N/A')}</div>
//               <div><strong>Improvements Made:</strong> {renderSafe(incident.historicalDetails?.improvementsMade || incident.raw?.historicalDetails?.improvementsMade || 'N/A')}</div>
//             </div>
//           </div>
//         )}

//         {/* Impact */}
//         {(incident.impact || incident.raw?.impact) && (
//           <div>
//             <div className="text-sm font-medium text-gray-700 mb-2">Impact</div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
//               <div>
//                 <div><strong>Fatal:</strong> {incident.impact?.casualties?.fatal ?? incident.raw?.impact?.casualties?.fatal ?? 0}</div>
//                 <div><strong>Injured:</strong> {incident.impact?.casualties?.injured ?? incident.raw?.impact?.casualties?.injured ?? 0}</div>
//                 <div><strong>Evacuated:</strong> {incident.impact?.casualties?.evacuated ?? incident.raw?.impact?.casualties?.evacuated ?? 0}</div>
//               </div>
//               <div>
//                 <div><strong>Property Damage (severity):</strong> {renderSafe(incident.impact?.propertyDamage?.severity ?? incident.raw?.impact?.propertyDamage?.severity ?? 'N/A')}</div>
//                 <div><strong>Estimated Cost:</strong> {renderSafe(incident.impact?.propertyDamage?.estimatedCost ?? incident.raw?.impact?.propertyDamage?.estimatedCost ?? 'N/A')}</div>
//                 <div><strong>Duration (hrs):</strong> {renderSafe(incident.impact?.duration ?? incident.raw?.impact?.duration ?? 'N/A')}</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Response */}
//         {(incident.response || incident.raw?.response) && (
//           <div>
//             <div className="text-sm font-medium text-gray-700 mb-2">Response</div>
//             <div className="text-sm text-gray-700">
//               <div><strong>Response time (mins):</strong> {renderSafe(incident.response?.responseTime ?? incident.raw?.response?.responseTime ?? 'N/A')}</div>
//               <div><strong>Response Team:</strong> {Array.isArray(incident.response?.responseTeam || incident.raw?.response?.responseTeam) ? (incident.response?.responseTeam || incident.raw?.response?.responseTeam).join(', ') : renderSafe(incident.response?.responseTeam || incident.raw?.response?.responseTeam || 'N/A')}</div>
//               <div><strong>Actions Taken:</strong> {Array.isArray(incident.response?.actionsTaken || incident.raw?.response?.actionsTaken) ? (incident.response?.actionsTaken || incident.raw?.response?.actionsTaken).join(', ') : renderSafe(incident.response?.actionsTaken || incident.raw?.response?.actionsTaken || 'N/A')}</div>
//               <div><strong>Effectiveness:</strong> {renderSafe(incident.response?.effectiveness || incident.raw?.response?.effectiveness || 'N/A')}</div>
//             </div>
//           </div>
//         )}

//         {/* Actions log */}
//         {Array.isArray(incident.actions || incident.raw?.actions) && (
//           <div>
//             <div className="text-sm font-medium text-gray-700 mb-2">Actions</div>
//             <div className="space-y-2 text-sm text-gray-700">
//               {(incident.actions || incident.raw?.actions || []).map((a: any, idx: number) => {
//                 const act = parseMaybeMongoExtended(a);
//                 return (
//                   <div key={idx} className="p-3 border rounded-md bg-gray-50">
//                     <div><strong>Action:</strong> {renderSafe(act.action)}</div>
//                     <div><strong>User:</strong> {renderSafe(act.userId)}</div>
//                     <div><strong>When:</strong> {pretty(act.timestamp || act.date || act._id?.getTimestamp?.() || act.timestamp)}</div>
//                     <div><strong>Details:</strong> <pre className="whitespace-pre-wrap text-xs">{renderSafe(act.details || act)}</pre></div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         <div className="flex justify-between items-center">
//           <div className="text-xs text-gray-500">Updated: {pretty(incident.updatedAt || incident.raw?.updatedAt)}</div>
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={() => router.push('/admin/incidents')}>Back</Button>
//             <Button onClick={() => {
//               const blob = new Blob([JSON.stringify(incident.raw || incident, null, 2)], { type: 'application/json' });
//               const url = URL.createObjectURL(blob);
//               const a = document.createElement('a');
//               a.href = url;
//               a.download = incident-${incident._id || id}.json;
//               document.body.appendChild(a);
//               a.click();
//               document.body.removeChild(a);
//               URL.revokeObjectURL(url);
//             }}>Download JSON</Button>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }











// app/admin/incidents/[id]/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { incidentsApi } from '@/lib/api/incidents';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { History, MessageSquare, Copy, Send } from 'lucide-react';
import { aiApi } from '@/lib/api/ai';

// dynamic imports for PDF libs (only run in browser)
// These are optional dependencies - install with: npm install html2canvas jspdf
let html2canvas: any = null;
let jsPDF: any = null;

// --- helpers ---
function parseMaybeMongoExtended(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if ('$date' in value) {
    const d = value.$date;
    if (typeof d === 'string') return new Date(d).toISOString();
    if (typeof d === 'object' && d.$numberLong) return new Date(parseInt(d.$numberLong, 10)).toISOString();
    return new Date(d).toISOString();
  }
  if ('$oid' in value) return value.$oid;
  if (Array.isArray(value)) return value.map(v => parseMaybeMongoExtended(v));
  const out: any = {};
  for (const k of Object.keys(value)) out[k] = parseMaybeMongoExtended(value[k]);
  return out;
}
function pretty(val: any) {
  if (!val && val !== 0) return 'N/A';
  try {
    if (typeof val === 'string') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return val;
    }
    if (val instanceof Date) return val.toLocaleString();
    if (typeof val === 'number') return String(val);
    return String(val);
  } catch { return String(val); }
}
function renderSafe(value: any) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  const maybeName = value.name || value.fullName || value.displayName || value.username;
  const maybeEmail = value.email || value.mail;
  const maybeId = value.id || value._id || value.$oid;
  if (maybeName || maybeEmail) {
    if (maybeEmail) return `${maybeName || maybeEmail} (${maybeEmail})`;
    return `${maybeName}`;
  }
  if (maybeId) return String(maybeId);
  try {
    const s = JSON.stringify(value);
    if (s.length > 200) return s.slice(0, 200) + '...';
    return s;
  } catch { return String(value); }
}

// PDF libs loader
async function ensurePdfLibs() {
  if (!html2canvas || !jsPDF) {
    try {
      // @ts-ignore - Optional dependency
      html2canvas = (await import('html2canvas')).default;
      // @ts-ignore - Optional dependency
      const jspdfModule = await import('jspdf');
      jsPDF = (jspdfModule as any).jsPDF ?? jspdfModule.default;
    } catch (err) {
      console.warn('PDF libraries not available:', err);
      throw new Error('PDF generation requires html2canvas and jspdf packages. Please install them: npm install html2canvas jspdf');
    }
  }
}

async function exportElementToPdf(element: HTMLElement, fileName = 'incident.pdf') {
  await ensurePdfLibs();
  if (!element) throw new Error('Element not found');

  // OPTIONAL: hide elements marked .pdf-hidden inside the element during capture
  const hiddenEls = Array.from(element.querySelectorAll<HTMLElement>('.pdf-hidden'));
  const prevDisplays = hiddenEls.map(el => ({ el, prev: el.style.display }));
  hiddenEls.forEach(el => (el.style.display = 'none'));

  const scale = 2;
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  });
  // restore hidden elements
  prevDisplays.forEach(h => (h.el.style.display = h.prev));

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const ratio = canvasW / canvasH;
  const imgW = pdfW;
  const imgH = imgW / ratio;

  if (imgH <= pdfH) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
  } else {
    // slice into pages
    const pageHeightPx = Math.floor(canvasW / (pdfW / pdfH));
    let remaining = canvasH;
    let posY = 0;
    while (remaining > 0) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasW;
      pageCanvas.height = Math.min(pageHeightPx, remaining);
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) break;
      ctx.drawImage(canvas, 0, posY, canvasW, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
      const pageData = pageCanvas.toDataURL('image/png');
      const pageImgH = (pageCanvas.height * imgW) / pageCanvas.width;
      if (posY > 0) pdf.addPage();
      pdf.addImage(pageData, 'PNG', 0, 0, imgW, pageImgH);
      remaining -= pageCanvas.height;
      posY += pageCanvas.height;
    }
  }

  pdf.save(fileName);
}

// --- component ---
export default function IncidentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { accessToken, isAuthenticated } = useAuthStore();
  const id = params?.id as string | undefined;

  const [incident, setIncident] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [parentMessageModal, setParentMessageModal] = useState<{ open: boolean; message?: string; loading?: boolean }>({ open: false });

  // Printable wrapper ref: only the content to capture
  const printableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    if (apiClient && typeof (apiClient as any).setToken === 'function') {
      (apiClient as any).setToken(accessToken);
    } else {
      try {
        (apiClient as any).defaults = (apiClient as any).defaults || {};
        (apiClient as any).defaults.headers = (apiClient as any).defaults.headers || {};
        (apiClient as any).defaults.headers.common = (apiClient as any).defaults.headers.common || {};
        (apiClient as any).defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      } catch {}
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        if (incidentsApi && typeof (incidentsApi as any).getById === 'function') {
          try {
            const res = await (incidentsApi as any).getById(id);
            if (res?.success && res.data) {
              setIncident(parseMaybeMongoExtended(res.data));
              setLoading(false);
              return;
            }
            if (res && !res.success && res.data) {
              setIncident(parseMaybeMongoExtended(res.data));
              setLoading(false);
              return;
            }
          } catch (err: any) {
            console.error('incidentsApi.getById error', err);
            if (err?.response?.status === 404) {
              setNotFound(true);
              setLoading(false);
              return;
            }
          }
        }

        const fallbackUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/admin/incidents/${encodeURIComponent(id)}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const fetchRes = await fetch(fallbackUrl, { method: 'GET', headers });
        if (fetchRes.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!fetchRes.ok) throw new Error(`Failed to fetch: ${fetchRes.status}`);
        const json = await fetchRes.json();
        const payload = (json?.data && typeof json.data === 'object') ? json.data : (json?.data || json);
        setIncident(parseMaybeMongoExtended(payload));
      } catch (err: any) {
        console.error('Failed to load incident details', err);
        showToast(err?.message || 'Failed to load incident details', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, accessToken]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6">Loading incident details…</Card>
      </div>
    );
  }
  if (!id || notFound || !incident) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6">
          <h2 className="text-lg font-bold">Incident not found</h2>
          <p className="mt-2 text-sm text-gray-600">This incident either does not exist or you don&apos;t have access.</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/admin/incidents')}>Back to list</Button>
          </div>
        </Card>
      </div>
    );
  }

  const src = incident.source || 'N/A';
  const severity = incident.severity || incident.raw?.severity || 'N/A';
  const type = incident.type || incident.raw?.type || 'N/A';

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(incident.raw || incident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-${incident._id || id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfGenerating(true);
      showToast('Generating PDF — please wait...', 'info');
      const node = printableRef.current;
      if (!node) throw new Error('Printable element not found');
      const filename = `incident-${incident._id || id}-${Date.now()}.pdf`;
      await exportElementToPdf(node, filename);
      showToast('PDF downloaded successfully', 'success');
    } catch (err: any) {
      console.error('PDF generation failed', err);
      showToast(err?.message || 'Failed to generate PDF', 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  const oneLineDesc = (incident.metadata?.description || incident.description || incident.raw?.metadata?.description || incident.title || '').toString().slice(0, 200);
  const handleDraftParentMessage = async () => {
    setParentMessageModal({ open: true, loading: true });
    try {
      const result = await aiApi.draftCrisisParentMessage({
        incidentType: type,
        severity,
        oneLineDescription: oneLineDesc || 'Incident at school',
      });
      const message = (result as any)?.message ?? result?.data?.message ?? '';
      setParentMessageModal({ open: true, message, loading: false });
    } catch (err: any) {
      showToast(err?.message || 'Failed to draft parent message', 'error');
      setParentMessageModal({ open: false });
    }
  };

  const copyParentMessage = () => {
    if (parentMessageModal.message) {
      navigator.clipboard.writeText(parentMessageModal.message);
      showToast('Copied to clipboard', 'success');
    }
  };

  const sendViaBroadcast = () => {
    if (parentMessageModal.message) {
      const encoded = encodeURIComponent(parentMessageModal.message);
      router.push(`/broadcast?message=${encoded}`);
      setParentMessageModal({ open: false });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* PRINTABLE: only this div is captured */}
      <div ref={printableRef}>
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{(type || 'Incident').toString().toUpperCase()}{incident.isHistorical ? <span className="text-sm text-purple-600"> (Historical)</span> : null}</h1>
              <p className="text-sm text-gray-500 mt-1">{renderSafe(incident._id || incident.id || incident.raw?._id || incident.raw?.id || '—')}</p>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-semibold">{renderSafe(incident.status || 'N/A').toString().toUpperCase()}</div>
              <div className="mt-2 text-xs text-gray-500">Severity</div>
              <div className="font-semibold">{renderSafe(severity || 'N/A').toString().toUpperCase()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Title</div>
              <div className="font-semibold">{renderSafe(incident.metadata?.title || incident.raw?.metadata?.title || 'N/A')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Source</div>
              <div className="font-semibold">{renderSafe(src)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">When (historical)</div>
              <div className="font-semibold">{pretty(incident.historicalDate || incident.raw?.historicalDate)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Created / Added at</div>
              <div className="font-semibold">{pretty(incident.createdAt || incident.addedAt || incident.raw?.createdAt || incident.raw?.addedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Location / Affected Area</div>
              <div className="font-semibold">{renderSafe(incident.location || incident.impact?.affectedArea || incident.raw?.impact?.affectedArea || 'N/A')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Affected (people)</div>
              <div className="font-semibold">{Array.isArray(incident.affectedUsers) ? incident.affectedUsers.length : (incident.impact?.casualties ? `fatal: ${incident.impact.casualties.fatal}, injured: ${incident.impact.casualties.injured}` : 0)}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Description</div>
            <div className="mt-2 text-sm text-gray-700">{renderSafe(incident.metadata?.description || incident.description || incident.raw?.metadata?.description || 'N/A')}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div><strong>Added By:</strong> {renderSafe(incident.addedBy || incident.raw?.addedBy || 'N/A')}</div>
            <div><strong>Resolved By:</strong> {renderSafe(incident.resolvedBy || incident.raw?.resolvedBy || 'N/A')}</div>
          </div>

          {(incident.historicalDetails || incident.raw?.historicalDetails) && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <History className="h-4 w-4" />
                Historical Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div><strong>Original Source:</strong> {renderSafe(incident.historicalDetails?.originalSource || incident.raw?.historicalDetails?.originalSource || 'N/A')}</div>
                <div><strong>Verified By:</strong> {renderSafe(incident.historicalDetails?.verifiedBy || incident.raw?.historicalDetails?.verifiedBy || 'N/A')}</div>
                <div><strong>Verification Date:</strong> {pretty(incident.historicalDetails?.verificationDate || incident.raw?.historicalDetails?.verificationDate)}</div>
                <div><strong>Documentation:</strong> {Array.isArray(incident.historicalDetails?.documentation || incident.raw?.historicalDetails?.documentation) ? (incident.historicalDetails?.documentation || incident.raw?.historicalDetails?.documentation).map((u:any,i:number)=>(<div key={i}><a className="text-blue-600 underline" href={u} target="_blank" rel="noreferrer">{u}</a></div>)) : 'N/A'}</div>
                <div><strong>Lessons Learned:</strong> {renderSafe(incident.historicalDetails?.lessonsLearned || incident.raw?.historicalDetails?.lessonsLearned || 'N/A')}</div>
                <div><strong>Precautions Taken:</strong> {renderSafe(incident.historicalDetails?.precautionsTaken || incident.raw?.historicalDetails?.precautionsTaken || 'N/A')}</div>
                <div><strong>Improvements Made:</strong> {renderSafe(incident.historicalDetails?.improvementsMade || incident.raw?.historicalDetails?.improvementsMade || 'N/A')}</div>
              </div>
            </div>
          )}

          {(incident.impact || incident.raw?.impact) && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Impact</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <div><strong>Fatal:</strong> {incident.impact?.casualties?.fatal ?? incident.raw?.impact?.casualties?.fatal ?? 0}</div>
                  <div><strong>Injured:</strong> {incident.impact?.casualties?.injured ?? incident.raw?.impact?.casualties?.injured ?? 0}</div>
                  <div><strong>Evacuated:</strong> {incident.impact?.casualties?.evacuated ?? incident.raw?.impact?.casualties?.evacuated ?? 0}</div>
                </div>
                <div>
                  <div><strong>Property Damage (severity):</strong> {renderSafe(incident.impact?.propertyDamage?.severity ?? incident.raw?.impact?.propertyDamage?.severity ?? 'N/A')}</div>
                  <div><strong>Estimated Cost:</strong> {renderSafe(incident.impact?.propertyDamage?.estimatedCost ?? incident.raw?.impact?.propertyDamage?.estimatedCost ?? 'N/A')}</div>
                  <div><strong>Duration (hrs):</strong> {renderSafe(incident.impact?.duration ?? incident.raw?.impact?.duration ?? 'N/A')}</div>
                </div>
              </div>
            </div>
          )}

          {(incident.response || incident.raw?.response) && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Response</div>
              <div className="text-sm text-gray-700">
                <div><strong>Response time (mins):</strong> {renderSafe(incident.response?.responseTime ?? incident.raw?.response?.responseTime ?? 'N/A')}</div>
                <div><strong>Response Team:</strong> {Array.isArray(incident.response?.responseTeam || incident.raw?.response?.responseTeam) ? (incident.response?.responseTeam || incident.raw?.response?.responseTeam).join(', ') : renderSafe(incident.response?.responseTeam || incident.raw?.response?.responseTeam || 'N/A')}</div>
                <div><strong>Actions Taken:</strong> {Array.isArray(incident.response?.actionsTaken || incident.raw?.response?.actionsTaken) ? (incident.response?.actionsTaken || incident.raw?.response?.actionsTaken).join(', ') : renderSafe(incident.response?.actionsTaken || incident.raw?.response?.actionsTaken || 'N/A')}</div>
                <div><strong>Effectiveness:</strong> {renderSafe(incident.response?.effectiveness || incident.raw?.response?.effectiveness || 'N/A')}</div>
              </div>
            </div>
          )}

          {Array.isArray(incident.actions || incident.raw?.actions) && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Actions</div>
              <div className="space-y-2 text-sm text-gray-700">
                {(incident.actions || incident.raw?.actions || []).map((a: any, idx: number) => {
                  const act = parseMaybeMongoExtended(a);
                  return (
                    <div key={idx} className="p-3 border rounded-md bg-gray-50">
                      <div><strong>Action:</strong> {renderSafe(act.action)}</div>
                      <div><strong>User:</strong> {renderSafe(act.userId)}</div>
                      <div><strong>When:</strong> {pretty(act.timestamp || act.date || act._id?.getTimestamp?.() || act.timestamp)}</div>
                      <div><strong>Details:</strong> <pre className="whitespace-pre-wrap text-xs">{renderSafe(act.details || act)}</pre></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">Updated: {pretty(incident.updatedAt || incident.raw?.updatedAt)}</div>
        </Card>
      </div>

{/* ACTIONS: buttons are OUTSIDE printable area so they won't appear in PDF */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/incidents')}>Back</Button>
        <Button onClick={handleDraftParentMessage} className="bg-amber-600 hover:bg-amber-700 text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          Draft parent message
        </Button>
        <Button onClick={handleDownloadJson}>Download JSON</Button>
        <Button onClick={handleDownloadPdf} disabled={pdfGenerating}>
          {pdfGenerating ? 'Generating PDF…' : 'Download PDF'}
        </Button>
      </div>

      {/* O7: Draft parent message modal */}
      {parentMessageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !parentMessageModal.loading && setParentMessageModal({ open: false })}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Draft message to parents</h3>
            {parentMessageModal.loading ? (
              <p className="text-gray-600">Generating calm, factual message…</p>
            ) : parentMessageModal.message ? (
              <>
                <p className="text-gray-700 text-sm whitespace-pre-wrap border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">{parentMessageModal.message}</p>
                <div className="flex gap-2">
                  <Button onClick={copyParentMessage} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={sendViaBroadcast} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Send via broadcast
                  </Button>
                </div>
              </>
            ) : null}
            <div className="mt-4">
              <Button variant="outline" onClick={() => setParentMessageModal({ open: false })}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}