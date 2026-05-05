// src/components/admin/TestBenchmark.tsx
// Fully client-side benchmark — no backend /test route dependency.
// POSTs SVG directly to each node; HTTP nodes (Spaceify) are skipped due
// to mixed-content browser restrictions.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag }  from '@/components/shared/primitives';

const API_BASE   = 'https://api.spicydevs.xyz';
const TIMEOUT_MS = 12_000;

const CH = {
  amber: '#c47c2e', gold: '#d4a245', cream: '#f0e6cc',
  green: '#4ade80', red: '#f87171', orange: '#fb923c',
  yellow: '#facc15', blue: '#60a5fa', purple: '#a78bfa',
  teal: '#2dd4bf', ghost: 'rgba(140,130,112,0.45)',
  dim: 'rgba(180,168,148,0.65)',
};

// ── Node registry (mirrors nodes.config.js inTest:true) ──────────────────────
const NODES = [
  { id:'washington', label:'US East', url:'https://us-r-vercel.vercel.app',       apiPath:'/api/rasterize', tier:1, tag:'vercel',   region:'Virginia, US',  health:true,  http:false },
  { id:'london',     label:'London',  url:'https://uk-r-vercel.vercel.app',       apiPath:'/api/rasterize', tier:1, tag:'vercel',   region:'London, UK',    health:true,  http:false },
  { id:'tokyo',      label:'Tokyo',   url:'https://jp-r-vercel.vercel.app',       apiPath:'/api/rasterize', tier:1, tag:'vercel',   region:'Tokyo, JP',     health:true,  http:false },
  { id:'mumbai',     label:'Mumbai',  url:'https://rasterize-node.vercel.app',   apiPath:'/api/rasterize', tier:1, tag:'vercel',   region:'Mumbai, IN',    health:true,  http:false },
  { id:'ohio',       label:'Ohio',    url:'https://r-netlify.netlify.app',        apiPath:'/api/rasterize', tier:1, tag:'netlify',  region:'Ohio, US',      health:true,  http:false },
  { id:'france',     label:'FR 1',    url:'http://fr1.spaceify.eu:25980',        apiPath:'',              tier:2, tag:'spaceify', region:'France',         health:true,  http:true  },
  { id:'germany',    label:'DE 20',   url:'http://de20.spaceify.eu:26100',       apiPath:'',              tier:2, tag:'spaceify', region:'Germany',        health:true,  http:true  },
  { id:'cf_worker',  label:'Simple',  url:'https://r-cf.spicydevs.xyz',          apiPath:'',              tier:3, tag:'worker',   region:'Global',         health:false, http:false },
  { id:'render_eu',  label:'EUC',     url:'https://euc-r-render.onrender.com',   apiPath:'',              tier:3, tag:'render',   region:'EU Central',     health:true,  http:false },
] as const;

const TIER_META: Record<number,{title:string;color:string}> = {
  1:{title:'Serverless',color:CH.teal},
  2:{title:'Dedicated', color:CH.blue},
  3:{title:'Legacy',    color:CH.ghost},
};
const TAG_COLOR: Record<string,string> = {
  vercel:CH.blue, netlify:CH.purple, spaceify:CH.teal, render:CH.orange, worker:CH.yellow,
};

const EXAMPLES = [
  {label:'Inception',       type:'movie',id:'tt1375666', params:'r=imdb,rt'},
  {label:'Breaking Bad',    type:'tv',   id:'tt0903747', params:'r=imdb,tmdb'},
  {label:'Attack on Titan', type:'anime',id:'16498',     params:'r=mal,anilist'},
  {label:'Dune: Part Two',  type:'movie',id:'tt15239678',params:'r=imdb,rt,age'},
  {label:'The Bear',        type:'tv',   id:'136315',    params:'r=imdb,tmdb,rt'},
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeResult {
  id:string; label:string; tier:number; tag:string; region:string;
  ok:boolean; ms:number; status:number; note:string;
  health:Record<string,any>|null; skipped:boolean;
}
interface Benchmark {
  inputType:string; rawId:string; queryParams:string; svgUrl:string;
  svgFetchOk:boolean; svgFetchMs:number; svgSizeKb:number;
  nodes:NodeResult[];
  wsrv:{ok:boolean;ms:number;status:number;note:string};
  summary:{fastestMs:number|null;avgMs:number|null;successCount:number;totalCount:number};
  timestamp:string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMs = (ms:number|null|undefined) =>
  ms==null||ms<0 ? '—' : ms>=1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`;

const msColor = (ms:number|null|undefined) => {
  if(!ms) return CH.ghost;
  if(ms<500)  return CH.green;
  if(ms<1200) return CH.yellow;
  if(ms<3000) return CH.orange;
  return CH.red;
};

// ── Benchmark engine ──────────────────────────────────────────────────────────
async function benchNode(node:typeof NODES[number], svgText:string): Promise<NodeResult> {
  if (node.http) return {
    id:node.id, label:node.label, tier:node.tier, tag:node.tag, region:node.region,
    ok:false, ms:0, status:0, note:'HTTP — blocked by browser', health:null, skipped:true,
  };

  const url = `${node.url}${node.apiPath}?format=png`;
  const t0  = performance.now();
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method:'POST', body:svgText,
      headers:{'Content-Type':'image/svg+xml','X-Format':'png'},
      signal:ac.signal,
    });
    clearTimeout(tm);
    const ms = Math.round(performance.now() - t0);
    await res.body?.cancel().catch(()=>{});
    return { id:node.id, label:node.label, tier:node.tier, tag:node.tag, region:node.region,
      ok:res.ok, ms, status:res.status, note:res.ok?'':`HTTP ${res.status}`, health:null, skipped:false };
  } catch(e:any) {
    return { id:node.id, label:node.label, tier:node.tier, tag:node.tag, region:node.region,
      ok:false, ms:Math.round(performance.now()-t0), status:0,
      note:e.name==='AbortError'?`Timeout ${TIMEOUT_MS}ms`:e.message, health:null, skipped:false };
  }
}

async function benchWsrv(svgUrl:string) {
  const wsrvUrl=`https://wsrv.nl/?url=${encodeURIComponent(svgUrl)}&output=png&q=100`;
  const t0=performance.now();
  try {
    const ac=new AbortController();
    const tm=setTimeout(()=>ac.abort(),TIMEOUT_MS);
    const res=await fetch(wsrvUrl,{signal:ac.signal});
    clearTimeout(tm);
    const ms=Math.round(performance.now()-t0);
    await res.body?.cancel().catch(()=>{});
    return {ok:res.ok,ms,status:res.status,note:res.ok?'':`HTTP ${res.status}`};
  } catch(e:any) {
    return {ok:false,ms:Math.round(performance.now()-t0),status:0,note:e.name==='AbortError'?'Timeout':e.message};
  }
}

async function fetchHealth(node:typeof NODES[number]) {
  if(!node.health||node.http) return null;
  try {
    const res=await fetch(`${node.url}/health`,{signal:AbortSignal.timeout(3500)});
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function runBenchmark(
  inputType:string, rawId:string, params:string,
  onStep:(s:string)=>void,
): Promise<Benchmark> {
  const cb=Date.now();
  const qs=params?`${params}&cb=${cb}`:`cb=${cb}`;
  const svgUrl=`${API_BASE}/${inputType}/${rawId}.svg?${qs}`;

  onStep('Fetching SVG from API…');
  let svgText='', svgFetchOk=false, svgFetchMs=0, svgSizeKb=0;
  try {
    const t0=performance.now();
    const res=await fetch(svgUrl,{signal:AbortSignal.timeout(8000)});
    svgFetchMs=Math.round(performance.now()-t0);
    if(res.ok){svgText=await res.text();svgFetchOk=true;svgSizeKb=Math.round(new Blob([svgText]).size/1024);}
  } catch {}

  onStep('Testing rasterizer nodes…');
  const nodeResults=await Promise.all(
    NODES.map(n=>svgText?benchNode(n,svgText):Promise.resolve({
      id:n.id,label:n.label,tier:n.tier,tag:n.tag,region:n.region,
      ok:false,ms:0,status:0,note:'SVG unavailable',health:null,skipped:true,
    }))
  );

  onStep('Testing wsrv.nl…');
  const wsrv=await benchWsrv(svgUrl);

  onStep('Fetching /health from nodes…');
  const health=await Promise.all(NODES.map(n=>fetchHealth(n)));
  health.forEach((h,i)=>{nodeResults[i].health=h;});

  onStep('Compiling results…');
  const okMs=nodeResults.filter(n=>n.ok).map(n=>n.ms);
  return {
    inputType,rawId,queryParams:params,svgUrl,
    svgFetchOk,svgFetchMs,svgSizeKb,
    nodes:nodeResults,wsrv,
    summary:{
      fastestMs:okMs.length?Math.min(...okMs):null,
      avgMs:okMs.length?Math.round(okMs.reduce((a,b)=>a+b,0)/okMs.length):null,
      successCount:nodeResults.filter(n=>n.ok).length,
      totalCount:nodeResults.filter(n=>!n.skipped).length,
    },
    timestamp:new Date().toISOString(),
  };
}

// ── UI sub-components ─────────────────────────────────────────────────────────
const FilmTip=({active,payload,label}:any)=>{
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:'var(--film-dark)',border:'1px solid var(--film-border)',borderRadius:8,padding:'8px 12px',fontFamily:'JetBrains Mono,monospace',fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,0.7)'}}>
      <div style={{color:CH.amber,marginBottom:4,fontWeight:700}}>{label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color??CH.cream}}>{p.value!=null?`${p.value}ms`:'—'}</div>
      ))}
    </div>
  );
};

const StatCard=({label,value,color=CH.amber}:{label:string;value:string;color?:string})=>(
  <div style={{padding:'12px 14px',background:'var(--film-char)',border:'1px solid var(--film-border)',borderRadius:8,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}}/>
    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.16em',textTransform:'uppercase' as const,marginBottom:6}}>{label}</div>
    <div className="poster-font" style={{fontSize:28,color,lineHeight:1,letterSpacing:'0.04em'}}>{value}</div>
  </div>
);

const NodeCard=({result,fastest}:{result:NodeResult;fastest:number|null})=>{
  const isFastest=!result.skipped&&result.ok&&fastest!=null&&result.ms===fastest;
  const tagC=TAG_COLOR[result.tag]??CH.ghost;
  const healthLine=(()=>{
    if(result.skipped) return 'HTTP — browser blocked (mixed content)';
    const h=result.health;
    if(!h) return result.region;
    const pts:string[]=[];
    if(h.activeJobs!=null) pts.push(`active:${h.activeJobs}`);
    if(h.queuedJobs!=null) pts.push(`queue:${h.queuedJobs}`);
    if(h.uptime!=null)     pts.push(`up:${Math.floor(h.uptime/3600)}h`);
    if(h.iconCache?.loaded)pts.push(`icons:${h.iconCache.iconCount}`);
    return pts.length?pts.join(' · '):result.region;
  })();
  return (
    <div style={{background:'var(--film-char)',border:`1px solid ${isFastest?'rgba(196,124,46,0.4)':'var(--film-border)'}`,borderLeft:`3px solid ${result.skipped?CH.ghost:result.ok?tagC:'rgba(248,113,113,0.4)'}`,borderRadius:8,padding:'12px 14px',position:'relative',opacity:result.skipped?0.45:1}}>
      {isFastest&&<div style={{position:'absolute',top:8,right:8,fontSize:8,fontFamily:'Syne,sans-serif',fontWeight:700,color:CH.gold,background:'rgba(196,124,46,0.12)',border:'1px solid rgba(196,124,46,0.25)',borderRadius:3,padding:'2px 6px',letterSpacing:'0.06em'}}>⚡ FASTEST</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700,color:'var(--film-cream)'}}>{result.label}</div>
          <div style={{fontSize:9,color:CH.ghost,fontFamily:'JetBrains Mono,monospace',marginTop:2,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{healthLine}</div>
        </div>
        <span style={{fontSize:7,fontWeight:700,fontFamily:'Syne,sans-serif',color:TIER_META[result.tier]?.color??CH.ghost,background:`${TIER_META[result.tier]?.color??CH.ghost}18`,border:`1px solid ${TIER_META[result.tier]?.color??CH.ghost}28`,borderRadius:3,padding:'2px 5px',flexShrink:0}}>T{result.tier}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.ghost}}>{result.skipped?'skipped':result.ok?'✓ rendered':'✗ failed'}</span>
        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:700,color:result.skipped?CH.ghost:result.ok?msColor(result.ms):CH.red}}>
          {result.skipped?'—':result.ok?fmtMs(result.ms):result.note.slice(0,22)||'✗'}
        </span>
      </div>
      {!result.skipped&&result.ok&&(
        <div style={{marginTop:6,height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
          <div style={{height:'100%',background:msColor(result.ms),width:`${Math.min((result.ms/4000)*100,100)}%`,borderRadius:2,transition:'width 0.5s ease'}}/>
        </div>
      )}
    </div>
  );
};

// ── Loading ───────────────────────────────────────────────────────────────────
const STEPS=['Fetching SVG from API…','Testing rasterizer nodes…','Testing wsrv.nl…','Fetching /health from nodes…','Compiling results…'];

const LoadingView=({type,id,step}:{type:string;id:string;step:string})=>(
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',border:'1px dashed rgba(196,124,46,0.3)',borderRadius:12,marginTop:24,background:'rgba(196,124,46,0.02)'}}>
    <div style={{width:44,height:44,border:'3px solid rgba(255,255,255,0.07)',borderTopColor:CH.amber,borderRadius:'50%',animation:'spin 0.8s linear infinite',marginBottom:20}}/>
    <div className="poster-font" style={{fontSize:20,color:CH.amber,letterSpacing:'0.06em',marginBottom:12}}>{type}/{id}</div>
    <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
      {STEPS.map((s,i)=>{
        const cur=STEPS.indexOf(step);
        return (
          <div key={s} style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,letterSpacing:'0.05em',transition:'color 0.3s',color:i<cur?CH.green:s===step?CH.cream:CH.ghost}}>
            {i<cur?'✓ ':s===step?'› ':'  '}{s}
          </div>
        );
      })}
    </div>
  </div>
);

// ── Results ───────────────────────────────────────────────────────────────────
const ResultsView=({data,onBack,onRerun}:{data:Benchmark;onBack:()=>void;onRerun:()=>void})=>{
  const {summary,nodes,wsrv,svgUrl,svgFetchMs,svgSizeKb,svgFetchOk}=data;

  const tierGroups=useMemo(()=>{
    const g:Record<number,NodeResult[]>={};
    nodes.forEach(n=>{if(!g[n.tier])g[n.tier]=[];g[n.tier].push(n);});
    return Object.entries(g).sort(([a],[b])=>Number(a)-Number(b));
  },[nodes]);

  const chartData=useMemo(()=>
    nodes.filter(n=>!n.skipped).map(n=>({label:n.label.split(' ')[0],ms:n.ok?n.ms:null}))
      .sort((a,b)=>(a.ms??Infinity)-(b.ms??Infinity))
  ,[nodes]);

  // Compression analysis
  const gzipEst  = Math.round(svgSizeKb*0.22); // ~78% gzip ratio typical for SVG
  const rawSaving = svgSizeKb-gzipEst;
  const savingPct = svgSizeKb>0?Math.round((rawSaving/svgSizeKb)*100):0;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <button onClick={onBack} style={{padding:'5px 12px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,color:CH.ghost,fontSize:10,cursor:'pointer',fontFamily:'Syne,sans-serif'}}>← Back</button>
        <div className="poster-font" style={{fontSize:18,color:CH.amber,letterSpacing:'0.06em'}}>{data.inputType}/{data.rawId}</div>
        {data.queryParams&&<code style={{fontSize:9,color:CH.ghost,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:4,padding:'2px 8px'}}>?{data.queryParams}</code>}
        <button onClick={onRerun} style={{marginLeft:'auto',padding:'5px 12px',background:CH.amber,border:'none',borderRadius:6,color:'#070706',fontSize:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700}}>↻ Re-run</button>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
        <StatCard label="Fastest Node" value={fmtMs(summary.fastestMs)} color={msColor(summary.fastestMs)}/>
        <StatCard label="Average" value={fmtMs(summary.avgMs)} color={CH.gold}/>
        <StatCard label="Nodes OK" value={`${summary.successCount}/${summary.totalCount}`} color={summary.successCount===summary.totalCount?CH.green:CH.yellow}/>
        <StatCard label="SVG Fetch" value={fmtMs(svgFetchMs)} color={svgFetchOk?msColor(svgFetchMs):CH.red}/>
        <StatCard label="SVG Size" value={svgSizeKb>0?`${svgSizeKb}KB`:'—'} color={CH.blue}/>
        <StatCard label="wsrv.nl" value={wsrv.ok?fmtMs(wsrv.ms):'✗'} color={wsrv.ok?msColor(wsrv.ms):CH.red}/>
      </div>

      {/* Preview + analysis */}
      <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:14,alignItems:'start'}}>
        {/* SVG preview */}
        <div style={{background:'var(--film-char)',border:'1px solid var(--film-border)',borderRadius:8,overflow:'hidden'}}>
          <div style={{padding:'8px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>SVG Preview</span>
            <a href={svgUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:CH.amber,textDecoration:'none',fontFamily:'Syne,sans-serif',fontWeight:600}}>Raw ↗</a>
          </div>
          <div style={{background:'#000'}}>
            {svgFetchOk
              ?<img src={svgUrl} alt="poster" style={{width:'100%',display:'block'}}/>
              :<div style={{padding:40,textAlign:'center',color:CH.red,fontFamily:'JetBrains Mono,monospace',fontSize:10}}>SVG unavailable</div>
            }
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {/* Payload analysis */}
          {svgSizeKb>0&&(
            <div style={{background:'var(--film-char)',border:'1px solid var(--film-border)',borderRadius:8,padding:14}}>
              <div className="syne-font" style={{fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:CH.amber,marginBottom:12}}>Payload &amp; Compression</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                {[
                  {label:'Raw SVG',    value:`${svgSizeKb}KB`,             color:CH.orange},
                  {label:'Gzip est.',  value:`~${gzipEst}KB`,              color:CH.yellow},
                  {label:'Savings',    value:`~${rawSaving}KB (${savingPct}%)`, color:CH.green},
                ].map(({label,value,color})=>(
                  <div key={label} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.02)',borderRadius:6}}>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,marginBottom:4,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{label}</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:13,color,fontWeight:700}}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.dim,padding:'8px 10px',background:'rgba(196,124,46,0.04)',border:'1px solid rgba(196,124,46,0.1)',borderRadius:5,lineHeight:1.7}}>
                Balancer sends gzip-compressed POST to Spaceify/Render/Netlify nodes (v8).
                USW Vercel uses GET ?url= — zero payload transfer via CF edge cache.
                Spaceify nodes skipped in browser benchmark (HTTP mixed-content block).
              </div>
            </div>
          )}

          {/* Timing chart */}
          <div style={{background:'var(--film-char)',border:'1px solid var(--film-border)',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span className="syne-font" style={{fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:CH.amber}}>Render Timing Comparison</span>
            </div>
            <div style={{padding:14}}>
              {chartData.length>0?(
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{top:4,right:4,bottom:20,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="label" tick={{fill:CH.ghost,fontSize:8}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fill:CH.ghost,fontSize:8}} tickLine={false} axisLine={false} width={50} tickFormatter={v=>`${v}ms`}/>
                    <Tooltip content={<FilmTip/>}/>
                    <Bar dataKey="ms" name="Render time" radius={[3,3,0,0]}>
                      {chartData.map((e,i)=><Cell key={i} fill={e.ms?msColor(e.ms):CH.ghost} opacity={0.85}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ):<div style={{color:CH.ghost,fontFamily:'JetBrains Mono,monospace',fontSize:11,textAlign:'center',padding:40}}>No timing data</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Node cards by tier */}
      {tierGroups.map(([tier,tierNodes])=>(
        <div key={tier}>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:CH.ghost,marginBottom:10,paddingBottom:6,borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:TIER_META[Number(tier)]?.color??CH.ghost}}>{TIER_META[Number(tier)]?.title??`Tier ${tier}`}</span>
            <span style={{color:'rgba(255,255,255,0.15)',fontSize:7}}>·</span>
            <span>{tierNodes.length} nodes</span>
            <span style={{color:'rgba(255,255,255,0.15)',fontSize:7}}>·</span>
            <span style={{color:CH.green}}>{tierNodes.filter(n=>n.ok).length} ok</span>
            {tierNodes.some(n=>n.skipped)&&<><span style={{color:'rgba(255,255,255,0.15)',fontSize:7}}>·</span><span style={{color:CH.ghost}}>{tierNodes.filter(n=>n.skipped).length} skipped</span></>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {tierNodes.map(n=><NodeCard key={n.id} result={n} fastest={summary.fastestMs}/>)}
          </div>
        </div>
      ))}

      {/* wsrv */}
      <div>
        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:CH.ghost,marginBottom:10,paddingBottom:6,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          Third-party · wsrv.nl
        </div>
        <div style={{background:'var(--film-char)',border:`1px solid ${wsrv.ok?'var(--film-border)':'rgba(248,113,113,0.2)'}`,borderLeft:`3px solid ${wsrv.ok?CH.teal:CH.red}`,borderRadius:8,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,fontWeight:700,color:'var(--film-cream)'}}>wsrv.nl</div>
            <div style={{fontSize:9,color:CH.ghost,fontFamily:'JetBrains Mono,monospace',marginTop:2}}>librsvg · GET ?url= · icons embedded by CF Worker</div>
          </div>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:700,color:wsrv.ok?msColor(wsrv.ms):CH.red,flexShrink:0}}>
            {wsrv.ok?fmtMs(wsrv.ms):`✗ ${wsrv.note.slice(0,25)}`}
          </span>
        </div>
      </div>

      {/* Source URL */}
      <div style={{padding:14,background:'var(--film-char)',border:'1px solid var(--film-border)',borderRadius:8}}>
        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6}}>SVG Source URL</div>
        <a href={svgUrl} target="_blank" rel="noreferrer" style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:CH.amber,wordBreak:'break-all' as const,textDecoration:'none',lineHeight:1.6}}>{svgUrl}</a>
      </div>

      <div style={{paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.05)',fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost}}>
        Completed {new Date(data.timestamp).toLocaleTimeString()} · {nodes.filter(n=>!n.skipped).length} nodes tested · client-side timing via performance.now()
      </div>
    </div>
  );
};

// ── Search form ───────────────────────────────────────────────────────────────
const SearchForm=({onRun,loading}:{onRun:(t:string,i:string,p:string)=>void;loading:boolean})=>{
  const [type,setType]=useState('movie');
  const [id,setId]=useState('');
  const [params,setParams]=useState('r=imdb,rt');
  const run=()=>id.trim()&&onRun(type,id.trim(),params.trim());
  const inp=(lbl:string,el:React.ReactNode)=>(
    <div>
      <label style={{display:'block',fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.16em',textTransform:'uppercase' as const,marginBottom:5}}>{lbl}</label>
      {el}
    </div>
  );
  const baseStyle:React.CSSProperties={width:'100%',height:38,padding:'0 12px',background:'var(--film-char)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:7,color:'var(--film-cream)',fontSize:12,fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'};
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:540}}>
      <div style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:10}}>
        {inp('Type',<select value={type} onChange={e=>setType(e.target.value)} style={{...baseStyle,cursor:'pointer'}}>
          {['movie','tv','anime','poster'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>)}
        {inp('ID (TMDB / IMDb / MAL)',<input value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()} placeholder="e.g. tt1375666 or 27205" style={baseStyle}/>)}
      </div>
      {inp('Query params (optional)',<input value={params} onChange={e=>setParams(e.target.value)} placeholder="r=imdb,rt&source=fanart" style={baseStyle}/>)}
      <button onClick={run} disabled={loading||!id.trim()} style={{height:42,background:loading?'rgba(196,124,46,0.3)':`linear-gradient(90deg,${CH.amber},${CH.gold})`,color:'#070706',border:'none',borderRadius:8,cursor:loading?'wait':'pointer',fontSize:12,fontWeight:800,fontFamily:'Syne,sans-serif',letterSpacing:'0.12em',textTransform:'uppercase' as const,opacity:loading||!id.trim()?0.6:1}}>
        {loading?'Running…':'Run Benchmark'}
      </button>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {EXAMPLES.map(ex=>(
          <button key={ex.id} onClick={()=>{setType(ex.type);setId(ex.id);setParams(ex.params);}} style={{padding:'5px 10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:5,color:CH.dim,fontSize:9,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600}}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TestBenchmark() {
  const [mode,setMode]=useState<'search'|'loading'|'results'>('search');
  const [bType,setBType]=useState('movie');
  const [bId,setBId]=useState('');
  const [bParams,setBParams]=useState('');
  const [step,setStep]=useState('');
  const [results,setResults]=useState<Benchmark|null>(null);
  const [error,setError]=useState('');

  useEffect(()=>{
    try {
      const sp=new URLSearchParams(window.location.search);
      const t=sp.get('type'),i=sp.get('id'),p=sp.get('params')??'';
      if(t&&i){setBType(t);setBId(i);setBParams(p);go(t,i,p);}
    } catch {}
  },[]);

  const go=useCallback(async(type:string,id:string,params:string)=>{
    setMode('loading');setBType(type);setBId(id);setBParams(params);setError('');setResults(null);
    try{const s=new URLSearchParams({type,id,...(params?{params}:{})});history.pushState({},'',`?${s}`);}catch{}
    try{
      const r=await runBenchmark(type,id,params,setStep);
      setResults(r);setMode('results');
    }catch(e:any){setError(e.message??'Benchmark failed');setMode('search');}
  },[]);

  return (
    <div style={{minHeight:'100dvh',background:'var(--film-black)',color:'var(--film-cream)',paddingTop:56}}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}} .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;fill:rgba(180,168,148,0.65)!important}`}</style>
      <MainNavbar fixed={true} compactLogo/>
      <div style={{position:'sticky',top:56,zIndex:40,background:'rgba(7,7,6,0.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--film-border)',padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
        <div className="poster-font" style={{fontSize:16,color:CH.amber,letterSpacing:'0.06em'}}>Rasterizer Benchmark</div>
        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.12em'}}>
          {mode==='loading'?`TESTING ${bType}/${bId}`:mode==='results'?`RESULTS · ${results?.nodes.filter(n=>!n.skipped).length??0} nodes`:'READY · CLIENT-SIDE'}
        </span>
      </div>
      <main style={{padding:16,maxWidth:1280,margin:'0 auto'}}>
        {error&&<div style={{marginBottom:16,padding:'10px 14px',borderRadius:8,background:'rgba(248,113,113,0.07)',border:'1px solid rgba(248,113,113,0.2)',color:CH.red,fontSize:11,fontFamily:'JetBrains Mono,monospace'}}>✕ {error}</div>}
        {mode==='search'&&(
          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            <AmberTag style={{marginBottom:8}}>Client-Side Node Benchmark</AmberTag>
            <p className="body-font" style={{fontSize:14,color:'var(--film-text-dim)',marginBottom:16}}>
              Fetches the SVG directly from the API and POSTs it to each rasterizer node from your browser. No backend proxy involved.
              HTTP nodes (Spaceify) are skipped due to browser mixed-content restrictions.
            </p>
            <SearchForm onRun={go} loading={false}/>
          </div>
        )}
        {mode==='loading'&&<LoadingView type={bType} id={bId} step={step}/>}
        {mode==='results'&&results&&<ResultsView data={results} onBack={()=>{setMode('search');setResults(null);try{history.pushState({},'',window.location.pathname);}catch{}}} onRerun={()=>go(bType,bId,bParams)}/>}
      </main>
    </div>
  );
}