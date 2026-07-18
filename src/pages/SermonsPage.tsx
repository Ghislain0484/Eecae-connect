import { useState } from 'react';
import { BookOpen, Plus, Search, Youtube, FileText, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSermons, useCreateSermon } from '../hooks/useData';
import { PageHeader, Card, Button, Input, Textarea, Badge, EmptyState, Skeleton, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import type { Sermon } from '../types';
import { formatDate, exportToCsv } from '../lib/utils';

export function SermonsPage() {
  const { activeChurch } = useAuth();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();
  const { data: sermons, isLoading } = useSermons(activeChurch?.id, { search });
  const createSermon = useCreateSermon(activeChurch?.id ?? '');

  const handleExport = () => {
    if (!sermons?.length) return;
    exportToCsv(`predications-${activeChurch?.short_name ?? 'eecae'}.csv`, sermons.map((s) => ({ Thème: s.theme, Prédicateur: s.preacher, Date: formatDate(s.sermon_date), Verset: s.main_verse ?? '', Mots_clés: s.keywords ?? '' })));
    toast.success('Export généré');
  };

  return (
    <div>
      <PageHeader title="Prédications & Archives" subtitle={`${sermons?.length ?? 0} prédication(s)`} action={<><Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button><Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter</Button></>} />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Thème, prédicateur, verset, mot-clé..." className="input pl-9" />
        </div>
      </Card>

      {isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> : sermons?.length === 0 ? (
        <Card><EmptyState icon={<BookOpen className="h-12 w-12" />} title="Aucune prédication" description="Ajoutez votre première prédication." action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sermons?.map((s) => (
            <Card key={s.id} className="p-5 hover:shadow-card-lg transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">{s.theme}</h3>
                <Badge className="bg-bordeaux-100 text-bordeaux-700 dark:bg-bordeaux-900/40 dark:text-bordeaux-300">{s.program_type ?? 'Prédication'}</Badge>
              </div>
              {s.sub_theme && <p className="text-sm text-bordeaux-600 dark:text-bordeaux-400 mb-2">{s.sub_theme}</p>}
              <p className="text-sm text-ink-600 dark:text-ink-300 line-clamp-2">{s.summary ?? '—'}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-ink-400">
                <span>{s.preacher}</span>
                <span>· {formatDate(s.sermon_date)}</span>
                {s.main_verse && <span className="font-medium text-bordeaux-600">· {s.main_verse}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                {s.video_url && <a href={s.video_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-red-600 hover:underline"><Youtube className="h-4 w-4" />Vidéo</a>}
                {s.pdf_url && <a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline"><FileText className="h-4 w-4" />PDF</a>}
                {s.keywords && <span className="text-xs text-ink-400 truncate">· {s.keywords}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <AddSermonModal onClose={() => setShowAdd(false)} onCreate={createSermon.mutateAsync} />}
    </div>
  );
}

function AddSermonModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<Sermon>) => Promise<Sermon> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ theme: '', sub_theme: '', preacher: '', sermon_date: new Date().toISOString().slice(0, 10), main_verse: '', summary: '', video_url: '', keywords: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.theme.trim() || !form.preacher.trim()) { toast.error('Champs requis', 'Thème et prédicateur obligatoires'); return; }
    setSaving(true);
    try {
      await onCreate({ ...form, sermon_date: form.sermon_date });
      toast.success('Prédication ajoutée');
      onClose();
    } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Ajouter une prédication" size="lg" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Enregistrer</Button></div>}>
      <div className="space-y-4">
        <Input label="Thème *" value={form.theme} onChange={(e) => set('theme', e.target.value)} />
        <Input label="Sous-thème" value={form.sub_theme} onChange={(e) => set('sub_theme', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prédicateur *" value={form.preacher} onChange={(e) => set('preacher', e.target.value)} />
          <Input label="Date" type="date" value={form.sermon_date} onChange={(e) => set('sermon_date', e.target.value)} />
        </div>
        <Input label="Verset principal" value={form.main_verse} onChange={(e) => set('main_verse', e.target.value)} placeholder="Jean 3:16" />
        <Textarea label="Résumé" value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        <Input label="Lien vidéo YouTube" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtube.com/..." />
        <Input label="Mots-clés" value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="foi, prière, délivrance" />
      </div>
    </Modal>
  );
}
