import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Shield, Sparkles } from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';
import { Button } from '../ui';
import type { Member } from '../../types';

interface MemberQrCardProps {
  member: Member;
  churchName?: string;
  spiritualFamilyName?: string;
}

export function MemberQrCard({ member, churchName, spiritualFamilyName }: MemberQrCardProps) {
  const { branding } = useBranding();
  const cardRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    id: member.id,
    matricule: member.matricule || 'M-0000',
    name: `${member.first_name} ${member.last_name}`,
    church: churchName || branding.shortName,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Visual Digital Badge / Physical Card Representation */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 text-white bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-6 flex flex-col justify-between aspect-[1.586/1] relative"
        style={{
          background: `linear-gradient(135deg, #14161c 0%, ${branding.primaryColor}80 60%, #14161c 100%)`,
        }}
      >
        {/* Subtle watermark logo & glow */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full opacity-20 bg-white blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: branding.accentColor }} />

        {/* Card Header */}
        <div className="flex items-center justify-between z-10 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={branding.logoUrl || '/Logo_CAE.png'}
              alt="Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/Logo_CAE.png';
              }}
              className="h-8 w-8 rounded-lg object-contain bg-white/90 p-0.5"
            />
            <div>
              <p className="font-serif font-bold text-xs tracking-wider uppercase leading-tight text-white">
                {branding.shortName}
              </p>
              <p className="text-[9px] text-white/70 font-medium truncate max-w-[170px]">
                {churchName || branding.tagline}
              </p>
            </div>
          </div>

          <span
            className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/20 shadow-xs"
            style={{ backgroundColor: `${branding.accentColor}30`, color: branding.accentColor }}
          >
            CARTE DE MEMBRE
          </span>
        </div>

        {/* Card Body */}
        <div className="flex items-center gap-4 my-auto z-10 py-2">
          {/* Avatar / Photo */}
          <div className="h-16 w-16 rounded-2xl border-2 border-white/30 overflow-hidden shadow-md shrink-0 bg-white/10 flex items-center justify-center text-xl font-bold text-white">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.first_name} className="h-full w-full object-cover" />
            ) : (
              <span>{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base font-bold text-white tracking-tight leading-snug truncate">
              {member.last_name} {member.first_name}
            </h3>
            <p className="text-[11px] font-mono text-white/80 mt-0.5">
              Matricule : <span className="font-bold text-amber-300">{member.matricule || 'N/A'}</span>
            </p>
            {spiritualFamilyName && (
              <p className="text-[10px] text-emerald-300 font-semibold mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Famille {spiritualFamilyName}
              </p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="p-1.5 rounded-xl bg-white shadow-lg shrink-0">
            <QRCodeSVG value={qrData} size={58} level="M" />
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between z-10 text-[9px] text-white/60 pt-2 border-t border-white/10">
          <span>Passeport Numérique Fidèle</span>
          <span>Valide · EECAE Connect Pro</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Printer className="h-4 w-4" />}
          onClick={handlePrint}
        >
          Imprimer la Carte
        </Button>
      </div>
    </div>
  );
}
