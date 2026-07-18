import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, UserPlus, Search, Download, Phone, Mail, Archive, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembers, useCreateMember, useSpiritualFamilies } from '../hooks/useData';
import { PageHeader, Card, Button, Input, Select, Table, TableRow, TableCell, Badge, Avatar, EmptyState, Skeleton, Modal, ConfirmDialog } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_COLORS, DEPARTMENT_NAMES } from '../types/constants';
import type { Member, MemberStatus } from '../types';
import { formatNumber, calculateAge, ageCategoryLabel, ageCategory, exportToCsv } from '../lib/utils';
import { supabase } from '../lib/supabase';

export function MembersPage() {
  const { activeChurch, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const familyParam = searchParams.get('family') ?? 'all';
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sexFilter, setSexFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState(familyParam);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Member | null>(null);
  const toast = useToast();

  const { data: allMembers, isLoading } = useMembers(activeChurch?.id, { search, status: statusFilter, sex: sexFilter });
  const { data: spiritualFamilies } = useSpiritualFamilies(activeChurch?.id);
  const createMember = useCreateMember(activeChurch?.id ?? '');

  const members = useMemo(() => {
    if (!allMembers) return [];
    if (familyFilter === 'all') return allMembers;
    return allMembers.filter((m) => m.spiritual_family_id === familyFilter);
  }, [allMembers, familyFilter]);

  const pageSize = 12;
  const totalPages = Math.ceil((members?.length ?? 0) / pageSize);
  const pagedMembers = useMemo(() => (members ?? []).slice((page - 1) * pageSize, page * pageSize), [members, page]);

  const handleExport = () => {
    if (!members?.length) return;
    exportToCsv(`membres-${activeChurch?.short_name ?? 'eecae'}.csv`, members.map((m) => ({
      Matricule: m.matricule ?? '',
      Nom: m.last_name,
      Prénoms: m.first_name,
      Sexe: m.sex === 'M' ? 'Masculin' : m.sex === 'F' ? 'Féminin' : '',
      Age: calculateAge(m.birth_date) ?? '',
      Téléphone: m.phone_main ?? '',
      Email: m.email ?? '',
      Statut: MEMBER_STATUS_LABELS[m.status],
      Quartier: m.neighborhood ?? '',
      Ville: m.city ?? '',
    })));
    toast.success('Export généré', `${members.length} membres exportés`);
  };

  return (
    <div>
      <PageHeader
        title="Membres"
        subtitle={`${formatNumber(members?.length ?? 0)} membre(s) · ${activeChurch?.short_name ?? ''}`}
        action={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter</Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Nom, téléphone, matricule..."
              className="input pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">Tous les statuts</option>
            {Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setPage(1); }}>
            <option value="all">Tous les genres</option>
            <option value="M">Hommes</option>
            <option value="F">Femmes</option>
          </Select>
          <Select value={familyFilter} onChange={(e) => { setFamilyFilter(e.target.value); setPage(1); }}>
            <option value="all">Toutes les familles</option>
            {spiritualFamilies?.map((sf) => (
              <option key={sf.id} value={sf.id}>Famille {sf.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : pagedMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Aucun membre trouvé"
            description="Ajustez vos filtres ou ajoutez un nouveau membre."
            action={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>Ajouter un membre</Button>}
          />
        ) : (
          <Table headers={['Membre', 'Contact', 'Âge', 'Statut', 'Actions']}>
            {pagedMembers.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar firstName={m.first_name} lastName={m.last_name} src={m.photo_url ?? undefined} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-ink-900 dark:text-ink-100">{m.last_name} {m.first_name}</p>
                      <p className="text-xs text-ink-400">{m.matricule ?? '—'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {m.phone_main && <p className="text-xs flex items-center gap-1.5 text-ink-500"><Phone className="h-3 w-3" />{m.phone_main}</p>}
                    {m.email && <p className="text-xs flex items-center gap-1.5 text-ink-500 truncate"><Mail className="h-3 w-3" />{m.email}</p>}
                    {!m.phone_main && !m.email && <span className="text-xs text-ink-400">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {m.birth_date ? (
                    <div>
                      <p className="text-sm font-medium">{calculateAge(m.birth_date)} ans</p>
                      <p className="text-xs text-ink-400">{ageCategoryLabel(ageCategory(m.birth_date))}</p>
                    </div>
                  ) : <span className="text-ink-400">—</span>}
                </TableCell>
                <TableCell>
                  <Badge className={MEMBER_STATUS_COLORS[m.status]}>{MEMBER_STATUS_LABELS[m.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <a href={`#/members/${m.id}`} onClick={(e) => { e.preventDefault(); window.location.hash = `#/members/${m.id}`; }}>
                      <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} />
                    </a>
                    {profile?.role === 'super_admin' || profile?.role === 'hq_admin' || profile?.role === 'secretary' ? (
                      <Button variant="ghost" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => setArchiveTarget(m)} />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-ink-200 dark:border-ink-800">
            <p className="text-sm text-ink-500">Page {page} / {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </Card>

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onCreate={createMember.mutateAsync} />}
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={async () => {
          if (!archiveTarget) return;
          try {
            await supabase.from('members').update({ archived_at: new Date().toISOString(), status: 'archived' }).eq('id', archiveTarget.id);
            toast.success('Membre archivé', `${archiveTarget.last_name} ${archiveTarget.first_name}`);
          } catch (e) {
            toast.error('Erreur', (e as Error).message);
          }
        }}
        title="Archiver ce membre ?"
        message={`Le membre ${archiveTarget?.last_name} ${archiveTarget?.first_name} sera archivé. Cette action est réversible. Les données sont conservées.`}
        confirmLabel="Archiver"
        danger
      />
    </div>
  );
}

function AddMemberModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<Member>) => Promise<Member> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { activeChurch } = useAuth();
  const { data: spiritualFamilies } = useSpiritualFamilies(activeChurch?.id);
  const [form, setForm] = useState({
    last_name: '', first_name: '', sex: 'M', birth_date: '', phone_main: '', phone_whatsapp: '',
    email: '', address: '', neighborhood: '', city: '', profession: '', marital_status: 'single',
    status: 'new_convert', first_visit_date: new Date().toISOString().slice(0, 10),
    department: '', function: '', spiritual_family_id: '', observations: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.last_name.trim() || !form.first_name.trim()) {
      toast.error('Champs requis', 'Le nom et les prénoms sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      const matricule = `EECAE-${(form.city || 'GEN').slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      await onCreate({
        ...form,
        matricule,
        sex: form.sex as 'M' | 'F',
        status: form.status as MemberStatus,
        birth_date: form.birth_date || null,
        first_visit_date: form.first_visit_date || null,
        spiritual_family_id: form.spiritual_family_id || null,
      });
      toast.success('Membre ajouté', `${form.last_name} ${form.first_name}`);
      onClose();
    } catch (e) {
      toast.error('Erreur', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajouter un membre"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={saving}>Enregistrer</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nom *" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          <Input label="Prénoms *" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Sexe" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Select>
          <Input label="Date de naissance" type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Téléphone" value={form.phone_main} onChange={(e) => set('phone_main', e.target.value)} placeholder="+225 ..." />
          <Input label="WhatsApp" value={form.phone_whatsapp} onChange={(e) => set('phone_whatsapp', e.target.value)} />
        </div>
        <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Adresse" value={form.address} onChange={(e) => set('address', e.target.value)} />
          <Input label="Quartier" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ville" value={form.city} onChange={(e) => set('city', e.target.value)} />
          <Input label="Profession" value={form.profession} onChange={(e) => set('profession', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Situation matrimoniale" value={form.marital_status} onChange={(e) => set('marital_status', e.target.value)}>
            <option value="single">Célibataire</option>
            <option value="married">Marié(e)</option>
            <option value="divorced">Divorcé(e)</option>
            <option value="widowed">Veuf(ve)</option>
            <option value="separated">Séparé(e)</option>
          </Select>
          <Select label="Statut" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date de première visite" type="date" value={form.first_visit_date} onChange={(e) => set('first_visit_date', e.target.value)} />
          <Select label="Département" value={form.department} onChange={(e) => set('department', e.target.value)}>
            <option value="">—</option>
            {DEPARTMENT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Famille Spirituelle" value={form.spiritual_family_id} onChange={(e) => set('spiritual_family_id', e.target.value)}>
            <option value="">—</option>
            {spiritualFamilies?.map((sf) => (
              <option key={sf.id} value={sf.id}>Famille {sf.name}</option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
