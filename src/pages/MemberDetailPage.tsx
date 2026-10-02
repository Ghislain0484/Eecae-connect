import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Briefcase, Heart, Church, Download, QrCode, Sparkles, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { useMember, useSpiritualFamilies } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { Card, CardHeader, Badge, Avatar, Button, EmptyState, Skeleton, Modal } from '../components/ui';
import { MemberQrCard } from '../components/members/MemberQrCard';
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_COLORS } from '../types/constants';
import { calculateAge, ageCategoryLabel, ageCategory, formatDate, formatDateLong } from '../lib/utils';

export function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeChurch } = useAuth();
  const { branding } = useBranding();
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: families, isLoading: familiesLoading } = useSpiritualFamilies(member?.church_id);
  const [showQrModal, setShowQrModal] = useState(false);

  const isLoading = memberLoading || familiesLoading;
  const spiritualFamily = families?.find((f) => f.id === member?.spiritual_family_id);

  const badgeStyles: Record<string, string> = {
    blanc: 'bg-ink-100 text-ink-800 border border-ink-300 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700',
    jaune: 'bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    vert: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    rouge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    bleu: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!member) {
    return (
      <Card>
        <EmptyState
          title="Membre introuvable"
          description="Ce membre n'existe pas ou a été archivé."
          action={<Button onClick={() => navigate('/members')}>Retour à la liste</Button>}
        />
      </Card>
    );
  }

  const age = calculateAge(member.birth_date);
  const cat = ageCategory(member.birth_date);

  // Spiritual Journey Milestones (Passeport 360)
  const milestones = [
    { title: 'Première Visite', date: member.first_visit_date, completed: !!member.first_visit_date },
    { title: 'Conversion à Christ', date: member.conversion_date, completed: !!member.conversion_date },
    { title: 'Baptême d\'Eau', date: member.water_baptism_date, completed: !!member.water_baptism_date },
    { title: 'Baptême du Saint-Esprit', date: member.holy_spirit_baptism_date, completed: !!member.holy_spirit_baptized },
    { title: 'Intégration en Famille Spirituelle', date: member.integration_date, completed: !!member.spiritual_family_id },
    { title: 'Engagement en Département / Ministère', date: null, completed: !!(member.function || member.ministry) },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <Button
        variant="ghost"
        icon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => navigate('/members')}
        className="mb-2"
      >
        Retour aux Membres
      </Button>

      {/* Profile Hero Header */}
      <Card className="overflow-hidden border border-brand-primary/20">
        <div
          className="h-28 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${branding.primaryColor} 0%, #14161c 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Sparkles className="h-32 w-32 text-white" />
          </div>
        </div>

        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar
                firstName={member.first_name}
                lastName={member.last_name}
                src={member.photo_url ?? undefined}
                size="lg"
                className="ring-4 ring-white dark:ring-ink-900 shadow-lg"
              />
              <div className="flex-1">
                <h1 className="font-serif text-2xl font-bold text-ink-900 dark:text-white">
                  {member.last_name} {member.first_name}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={MEMBER_STATUS_COLORS[member.status]}>
                    {MEMBER_STATUS_LABELS[member.status]}
                  </Badge>
                  {spiritualFamily && (
                    <Badge className={badgeStyles[spiritualFamily.color_name] ?? 'bg-ink-100 text-ink-700'}>
                      Famille {spiritualFamily.name}
                    </Badge>
                  )}
                  <span className="text-xs font-mono font-semibold text-ink-500">
                    Matricule: {member.matricule ?? 'Sans matricule'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {member.phone_whatsapp && (
                <a
                  href={`https://wa.me/${member.phone_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                </a>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<QrCode className="h-4 w-4" />}
                onClick={() => setShowQrModal(true)}
              >
                Carte de Membre & QR
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Details + Spiritual Passport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info */}
        <Card className="lg:col-span-1">
          <CardHeader title="Informations Personnelles" />
          <div className="p-5 space-y-3.5">
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date de Naissance" value={member.birth_date ? `${formatDateLong(member.birth_date)} (${age} ans)` : '—'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Habitation / Localisation" value={[member.address, member.neighborhood, member.city].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Numéro Principal" value={member.phone_main ?? '—'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={member.phone_whatsapp ?? '—'} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Adresse E-mail" value={member.email ?? '—'} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Profession / Métier" value={member.profession ?? '—'} />
            <InfoRow icon={<Heart className="h-4 w-4" />} label="Statut Matrimonial" value={member.marital_status ?? '—'} />
            <InfoRow icon={<Church className="h-4 w-4" />} label="Tranche Démographique" value={ageCategoryLabel(cat)} />
          </div>
        </Card>

        {/* Spiritual Passport & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-serif text-base font-bold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Passeport Spirituel & Étapes de Foi (Fiche 360°)
            </h3>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    m.completed
                      ? 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-ink-50/50 border-ink-100 dark:bg-ink-800/20 dark:border-ink-800 text-ink-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-ink-300 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold leading-snug">{m.title}</p>
                      <p className="text-[11px] opacity-80">
                        {m.date ? formatDateLong(m.date) : m.completed ? 'Validé' : 'Non renseigné'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      m.completed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-800'
                    }`}
                  >
                    {m.completed ? 'Validé' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Ecclesiastical Info Grid */}
          <Card>
            <CardHeader title="Informations & Responsabilités Ecclésiastiques" />
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBlock label="Famille Spirituelle" value={spiritualFamily ? `Famille ${spiritualFamily.name}` : '—'} />
              <InfoBlock label="Cellule de Maison" value={member.cell_id ?? 'Non affecté'} />
              <InfoBlock label="Département Actif" value={member.function ?? '—'} />
              <InfoBlock label="Ministère / Charge" value={member.ministry ?? '—'} />
              <InfoBlock label="Don Spirituel Identifié" value={member.spiritual_gift ?? '—'} />
              <InfoBlock label="Disponible pour le Service" value={member.available_for_service ? 'Oui (Actif)' : 'Non'} />
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Digital Badge Modal */}
      {showQrModal && (
        <Modal
          open
          onClose={() => setShowQrModal(false)}
          title="Carte Numérique & QR Code Officiel"
        >
          <div className="py-2">
            <MemberQrCard
              member={member}
              churchName={activeChurch?.name}
              spiritualFamilyName={spiritualFamily?.name}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-ink-400 mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-ink-100 break-words mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50/80 dark:bg-ink-800/40 p-3.5 border border-ink-100 dark:border-ink-800">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="text-sm font-semibold mt-1 text-ink-900 dark:text-ink-100">{value}</p>
    </div>
  );
}
