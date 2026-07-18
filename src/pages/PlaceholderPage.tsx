import { useState } from 'react';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { Heart, GraduationCap, Megaphone, FolderOpen, ShieldCheck, Settings, User, Construction } from 'lucide-react';

export function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  const [showForm] = useState(false);
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    heart: Heart,
    graduation: GraduationCap,
    megaphone: Megaphone,
    folder: FolderOpen,
    shield: ShieldCheck,
    settings: Settings,
    user: User,
  };
  const Icon = iconMap[icon] ?? Construction;

  return (
    <div>
      <PageHeader title={title} subtitle="Module en cours de développement — Phase suivante" />
      <Card>
        <EmptyState
          icon={<Icon className="h-12 w-12" />}
          title={showForm ? 'Bientôt disponible' : `${title} — Phase 2/3`}
          description="Ce module fait partie des phases à venir de l'application EECAE. La Phase 1 inclut déjà les membres, visiteurs, programmes, présences, absences, finances et statistiques."
        />
      </Card>
    </div>
  );
}
