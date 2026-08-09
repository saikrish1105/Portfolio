'use client';
import { useState } from 'react';
import { PORTFOLIO_DATA } from '@/data/portfolio';
import type { Zone } from '@/lib/track';
import {
  FileText,
  Trophy,
  Award,
  Music,
  Clapperboard,
  ExternalLink,
  MapPin,
  CalendarDays,
  GraduationCap,
  Briefcase,
  Globe,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';

interface Props {
  zone: Zone | null;
}

const d = PORTFOLIO_DATA;

function Chips({ items }: { items: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="border border-edge bg-black/40 px-2 py-0.5 font-mono2 text-[10px] tracking-wider text-modena">
          {t}
        </span>
      ))}
    </div>
  );
}

function PanelShell({ children, side = 'right', accent = '#FF2800' }: { children: React.ReactNode; side?: 'left' | 'right'; accent?: string }) {
  return (
    <div
      className={`panel-in pointer-events-auto fixed top-1/2 z-30 w-[min(440px,94vw)] max-h-[68vh] -translate-y-1/2 overflow-y-auto border bg-card/90 p-5 backdrop-blur-md ${
        side === 'right' ? 'right-3 sm:right-6' : 'left-3 sm:left-6'
      }`}
      style={{
        borderColor: accent,
        clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))',
        boxShadow: `0 0 30px ${accent}33`,
      }}
    >
      {children}
    </div>
  );
}

function SectionTag({ text, color = '#FF2800' }: { text: string; color?: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-block h-2 w-2" style={{ background: color }} />
      <span className="font-display text-[10px] tracking-[0.35em]" style={{ color }}>
        {text}
      </span>
      <span className="h-px flex-1" style={{ background: `${color}55` }} />
    </div>
  );
}

function linkIcon(type?: string) {
  if (type === 'github') return <GithubIcon size={13} />;
  if (type === 'live') return <Globe size={13} />;
  return <Link2 size={13} />;
}

function Contracts({ contracts }: { contracts: { name: string; address: string; url: string }[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (name: string, addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = addr;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(name);
    window.setTimeout(() => setCopied(null), 1600);
  };
  return (
    <div className="mt-4 space-y-2">
      {contracts.map((c) => (
        <div key={c.address} className="flex flex-wrap items-center gap-2 border border-edge bg-black/40 px-3 py-2">
          <span className="font-mono2 text-[11px] text-white">{c.name}</span>
          <code className="min-w-0 flex-1 truncate font-mono2 text-[10px] text-sub">{c.address}</code>
          <button
            onClick={() => copy(c.name, c.address)}
            className="clip-card border border-edge p-1.5 text-sub hover:border-modena hover:text-modena"
            aria-label={`copy ${c.name} address`}
          >
            {copied === c.name ? <Check size={13} className="text-[#00ff6a]" /> : <Copy size={13} />}
          </button>
          <a href={c.url} target="_blank" rel="noreferrer" className="clip-card border border-edge p-1.5 text-sub hover:border-sector hover:text-sector" aria-label="view on etherscan">
            <Link2 size={13} />
          </a>
        </div>
      ))}
    </div>
  );
}

export default function SectorPanels({ zone }: Props) {
  if (!zone) return null;

  /* ---------------- HERO / STARTING GRID ---------------- */
  if (zone.kind === 'hero') {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-[26%] z-30 flex justify-center px-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
          <a href={d.driver.socials.github} target="_blank" rel="noreferrer" className="neon-btn">
            <GithubIcon size={15} /> GITHUB
          </a>
          <a href={d.driver.socials.linkedin} target="_blank" rel="noreferrer" className="neon-btn">
            <LinkedinIcon size={15} /> LINKEDIN
          </a>
          <a href={d.driver.socials.resume} target="_blank" rel="noreferrer" className="neon-btn neon-btn-yellow">
            <FileText size={15} /> RESUME
          </a>
        </div>
      </div>
    );
  }

  /* ---------------- PROJECTS ---------------- */
  if (zone.kind === 'project') {
    const p = d.sector1_projects[zone.index];
    return (
      <PanelShell side="right">
        <SectionTag text={`PROJECT ${zone.index + 1}`} />
        <div className="font-mono2 text-[10px] tracking-[0.25em] text-modena">[{p.category}]</div>
        <h2 className="mt-1 font-display text-xl font-bold italic text-white">{p.title}</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-sub">{p.detailedDescription}</p>
        <Chips items={p.techStack} />
        {p.contractAddresses && p.contractAddresses.length > 0 && <Contracts contracts={p.contractAddresses} />}
        {p.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="link-btn">
                {linkIcon(l.type)} {l.label}
              </a>
            ))}
          </div>
        )}
      </PanelShell>
    );
  }

  /* ---------------- EDUCATION ---------------- */
  if (zone.kind === 'education') {
    const e = d.sector2_experience.education;
    return (
      <PanelShell side="left" accent="#FFF200">
        <SectionTag text="EDUCATION" color="#FFF200" />
        <div className="flex items-center gap-2 text-modena">
          <GraduationCap size={16} />
          <span className="font-mono2 text-[11px] tracking-widest">{e.period}</span>
        </div>
        <h2 className="mt-1 font-display text-xl font-bold italic text-white">{e.institution}</h2>
        <div className="mt-1 text-[13px] text-sub">{e.degree}</div>
        <div className="mt-3 border-l-2 border-modena pl-3 text-[12px] leading-relaxed text-sub">{e.leadership}</div>
      </PanelShell>
    );
  }

  /* ---------------- INTERNSHIPS ---------------- */
  if (zone.kind === 'internship') {
    const it = d.sector2_experience.internships[zone.index];
    return (
      <PanelShell side="left" accent="#FFF200">
        <SectionTag text={`INTERNSHIP ${zone.index + 1}`} color="#FFF200" />
        <div className="flex items-center gap-2 font-mono2 text-[11px] text-sub">
          <Briefcase size={13} className="text-modena" /> {it.role}
          <MapPin size={12} className="ml-2 text-sub" /> {it.location}
        </div>
        <h2 className="mt-1 font-display text-lg font-bold italic leading-snug text-white">{it.company}</h2>
        <div className="mt-1 flex items-center gap-2 font-mono2 text-[11px] text-modena">
          <CalendarDays size={12} /> {it.period}
        </div>
        <ul className="mt-3 space-y-2">
          {it.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-sub">
              <span className="mt-0.5 text-rosso">▸</span> {h}
            </li>
          ))}
        </ul>
        <Chips items={it.techStack} />
      </PanelShell>
    );
  }

  /* ---------------- ACHIEVEMENTS + CREATIVE ---------------- */
  if (zone.kind === 'hackathon') {
    const h = d.sector3_achievements.hackathons[zone.index];
    return (
      <PanelShell side="right" accent="#B100E8">
        <SectionTag text="HACKATHON" color="#B100E8" />
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-modena" />
          <h2 className="font-display text-lg font-bold italic text-white">{h.title}</h2>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-sub">{h.description}</p>
        {h.link && (
          <div className="mt-3 flex gap-2">
            <a href={h.link} target="_blank" rel="noreferrer" className="link-btn">
              <GithubIcon size={13} /> SOURCE
            </a>
          </div>
        )}
      </PanelShell>
    );
  }

  if (zone.kind === 'certification') {
    const c = d.sector3_achievements.certifications[zone.index];
    return (
      <PanelShell side="right" accent="#B100E8">
        <SectionTag text="CERTIFICATION" color="#B100E8" />
        <div className="flex items-center gap-2">
          <Award size={20} className="text-sector" />
          <h2 className="font-display text-lg font-bold italic text-white">{c.title}</h2>
        </div>
        <div className="mt-1 font-mono2 text-[11px] tracking-widest text-modena">{c.issuer}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-sub">{c.description}</p>
      </PanelShell>
    );
  }

  if (zone.kind === 'creative') {
    const c = d.sector3_achievements.creative[zone.index];
    return (
      <PanelShell side="right" accent="#B100E8">
        <SectionTag text="CREATIVE" color="#B100E8" />
        <div className="flex items-center gap-2">
          {c.mediaType === 'video' ? <Clapperboard size={18} className="text-rosso" /> : <Music size={18} className="text-sector" />}
          <h2 className="font-display text-lg font-bold italic text-white">{c.title}</h2>
        </div>
        <div className="mt-1 font-mono2 text-[12px] text-modena">{c.subtitle}</div>
        <p className="mt-2 text-[12px] leading-relaxed text-sub">{c.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {c.links?.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="link-btn">
              <ExternalLink size={13} /> {l.label}
            </a>
          ))}
        </div>
      </PanelShell>
    );
  }

  return null;
}
