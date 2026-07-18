import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Briefcase, Heart, Church, Download } from 'lucide-react';
import { useMember, useSpiritualFamilies } from '../hooks/useData';
import { Card, CardHeader, Badge, Avatar, Button, EmptyState, Skeleton } from '../components/ui';
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_COLORS } from '../types/constants';
import { calculateAge, ageCategoryLabel, ageCategory, formatDate, formatDateLong } from '../lib/utils';

export function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading: memberLoading } = useMember(id);
  const { data: families, isLoading: familiesLoading } = useSpiritualFamilies(member?.church_id);

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
    return <div className="space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-64" /></div>;
  }

  if (!member) {
    return (
      <Card>
        <EmptyState title="Membre introuvable" description="Ce membre n'existe pas ou a été archivé." action={<Button onClick={() => navigate('/members')}>Retour à la liste</Button>} />
      </Card>
    );
  }

  const age = calculateAge(member.birth_date);
  const cat = ageCategory(member.birth_date);

  return (
    <div>
      <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/members')} className="mb-4">Retour</Button>

      {/* Profile header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-bordeaux-700 to-bordeaux-600" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar firstName={member.first_name} lastName={member.last_name} src={member.photo_url ?? undefined} size="lg" />
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-100">{member.last_name} {member.first_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={MEMBER_STATUS_COLORS[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
                {spiritualFamily && (
                  <Badge className={badgeStyles[spiritualFamily.color_name] ?? 'bg-ink-100 text-ink-700'}>
                    Famille {spiritualFamily.name}
                  </Badge>
                )}
                <span className="text-sm text-ink-400">· {member.matricule ?? 'Sans matricule'}</span>
              </div>
            </div>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Fiche PDF</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info */}
        <Card className="lg:col-span-1">
          <CardHeader title="Informations personnelles" />
          <div className="p-5 space-y-3">
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Naissance" value={member.birth_date ? `${formatDateLong(member.birth_date)} (${age} ans)` : '—'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={[member.address, member.neighborhood, member.city].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={member.phone_main ?? '—'} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={member.phone_whatsapp ?? '—'} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={member.email ?? '—'} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Profession" value={member.profession ?? '—'} />
            <InfoRow icon={<Heart className="h-4 w-4" />} label="Situation" value={member.marital_status ?? '—'} />
            <InfoRow icon={<Church className="h-4 w-4" />} label="Catégorie d'âge" value={ageCategoryLabel(cat)} />
          </div>
        </Card>

        {/* Ecclesiastical info */}
        <Card className="lg:col-span-2">
          <CardHeader title="Informations ecclésiastiques" />
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoBlock label="Date de première visite" value={formatDate(member.first_visit_date)} />
            <InfoBlock label="Date d'intégration" value={formatDate(member.integration_date)} />
            <InfoBlock label="Date de conversion" value={formatDate(member.conversion_date)} />
            <InfoBlock label="Baptême d'eau" value={formatDate(member.water_baptism_date)} />
            <InfoBlock label="Baptisé du Saint-Esprit" value={member.holy_spirit_baptized ? 'Oui' : 'Non'} />
            <InfoBlock label="Date baptême Saint-Esprit" value={formatDate(member.holy_spirit_baptism_date)} />
            <InfoBlock label="Département" value={member.function ?? '—'} />
            <InfoBlock label="Ministère" value={member.ministry ?? '—'} />
            <InfoBlock label="Fonction" value={member.function ?? '—'} />
            <InfoBlock label="Cellule" value={member.cell_id ?? '—'} />
            <InfoBlock label="Famille Spirituelle" value={spiritualFamily ? `Famille ${spiritualFamily.name}` : '—'} />
            <InfoBlock label="Disponible au service" value={member.available_for_service ? 'Oui' : 'Non'} />
            <InfoBlock label="Don spirituel" value={member.spiritual_gift ?? '—'} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-ink-400 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm text-ink-800 dark:text-ink-200 break-words">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 dark:bg-ink-800/50 p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-medium mt-0.5 text-ink-800 dark:text-ink-200">{value}</p>
    </div>
  );
}
