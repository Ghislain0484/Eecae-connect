import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Phone, Calendar, UserCheck, ShieldAlert, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select, EmptyState, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import { logAudit } from '../lib/audit';

type ActiveTab = 'absences' | 'visitors' | 'notes';

export function PastoralPage() {
  const { activeChurch, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('absences');
  const toast = useToast();
  const queryClient = useQueryClient();

  const isPastorOrAdmin = ['super_admin', 'hq_admin', 'senior_pastor', 'assembly_pastor', 'pastoral_care'].includes(profile?.role || '');

  // 1. Fetch Absence Followups
  const { data: absenceFollowups, isLoading: isLoadingAbsences } = useQuery({
    queryKey: ['absence-followups', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data, error } = await supabase
        .from('absence_followups')
        .select(`
          *,
          member:members(first_name, last_name, phone, cell_id)
        `)
        .eq('church_id', activeChurch.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeChurch?.id,
  });

  // 2. Fetch Visitor Followups
  const { data: visitorFollowups, isLoading: isLoadingVisitors } = useQuery({
    queryKey: ['visitor-followups', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data, error } = await supabase
        .from('visitor_followups')
        .select(`
          *,
          visitor:visitors(first_name, last_name, phone, status, church_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter locally for church if visitors table has it
      return (data || []).filter(item => item.visitor && item.visitor.church_id === activeChurch.id);
    },
    enabled: !!activeChurch?.id,
  });

  // 3. Fetch Members list for Pastoral Notes
  const [searchMember, setSearchMember] = useState('');
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members-pastoral', activeChurch?.id, searchMember],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      let query = supabase
        .from('members')
        .select('id, first_name, last_name, phone, pastoral_notes, notes_confidential')
        .eq('church_id', activeChurch.id)
        .order('last_name', { ascending: true });

      if (searchMember) {
        query = query.or(`first_name.ilike.%${searchMember}%,last_name.ilike.%${searchMember}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!activeChurch?.id,
  });

  // 4. Modal state for updating absence followup
  const [selectedAbsence, setSelectedAbsence] = useState<any>(null);
  const [absenceNotes, setAbsenceNotes] = useState('');
  const [absenceStatus, setAbsenceStatus] = useState('');

  // 5. Drawer/Modal state for pastoral notes
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [pastoralNote, setPastoralNote] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  // Mutations
  const updateAbsenceMutation = useMutation({
    mutationFn: async (vars: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('absence_followups')
        .update({
          status: vars.status,
          notes: vars.notes,
          contact_date: new Date().toISOString().split('T')[0],
          contacted_by: profile?.full_name || 'Équipe pastorale',
          updated_at: new Date().toISOString()
        })
        .eq('id', vars.id);
      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'pastoral',
        entityType: 'absence_followups',
        entityId: vars.id,
        churchId: activeChurch?.id || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-followups'] });
      toast.success('Suivi d\'absence mis à jour');
      setSelectedAbsence(null);
    },
    onError: (err) => {
      toast.error('Erreur lors de la mise à jour', err.message);
    }
  });

  const updatePastoralNoteMutation = useMutation({
    mutationFn: async (vars: { id: string; notes: string; confidential: boolean }) => {
      const { error } = await supabase
        .from('members')
        .update({
          pastoral_notes: vars.notes,
          notes_confidential: vars.confidential
        })
        .eq('id', vars.id);
      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'pastoral',
        entityType: 'members_pastoral_notes',
        entityId: vars.id,
        churchId: activeChurch?.id || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-pastoral'] });
      toast.success('Notes pastorales mises à jour');
      setSelectedMember(null);
    },
    onError: (err) => {
      toast.error('Erreur', err.message);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi Pastoral"
        subtitle="Accompagnement spirituel, relance des absents et intégration"
      />

      {/* Tabs */}
      <div className="flex border-b border-ink-200 dark:border-ink-800">
        <button
          onClick={() => setActiveTab('absences')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'absences'
              ? 'border-bordeaux-500 text-bordeaux-600 dark:text-bordeaux-400'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          Relance des Absents
        </button>
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'visitors'
              ? 'border-bordeaux-500 text-bordeaux-600 dark:text-bordeaux-400'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          Suivi des Visiteurs
        </button>
        {isPastorOrAdmin && (
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'notes'
                ? 'border-bordeaux-500 text-bordeaux-600 dark:text-bordeaux-400'
                : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
          >
            Notes Pastorales & Conseils
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'absences' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">
              Membres absents à relancer
            </h3>
          </div>

          {isLoadingAbsences ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-ink-100 dark:bg-ink-800 rounded-lg" />
              <div className="h-12 bg-ink-100 dark:bg-ink-800 rounded-lg" />
            </div>
          ) : !absenceFollowups || absenceFollowups.length === 0 ? (
            <EmptyState
              icon={<HeartHandshake className="h-12 w-12 text-ink-300" />}
              title="Aucun suivi d'absence actif"
              description="Tous les membres réguliers de l'assemblée sont actifs ou déjà suivis."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 font-semibold">
                    <th className="py-3 px-4">Membre</th>
                    <th className="py-3 px-4">Dernière présence</th>
                    <th className="py-3 px-4">Semaines manquées</th>
                    <th className="py-3 px-4">Statut de relance</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {absenceFollowups.map((item) => (
                    <tr key={item.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-ink-800 dark:text-ink-200">
                            {item.member?.last_name} {item.member?.first_name}
                          </p>
                          <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {item.member?.phone || 'Pas de numéro'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-ink-600 dark:text-ink-400">
                        {item.last_attendance_date ? formatDate(item.last_attendance_date) : 'Inconnue'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-amber-600 dark:text-amber-400">
                        {item.missed_weeks} semaines
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          item.status === 'contacted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                          item.status === 'visited' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {item.status === 'resolved' && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === 'pending' && <Clock className="h-3 w-3" />}
                          {item.status === 'contacted' ? 'Contacté' : item.status === 'visited' ? 'Visité' : item.status === 'resolved' ? 'Résolu' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-ink-500 max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAbsence(item);
                            setAbsenceNotes(item.notes || '');
                            setAbsenceStatus(item.status);
                          }}
                        >
                          Mettre à jour
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'visitors' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">
              Nouveaux visiteurs en parcours d'intégration
            </h3>
          </div>

          {isLoadingVisitors ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-ink-100 dark:bg-ink-800 rounded-lg" />
            </div>
          ) : !visitorFollowups || visitorFollowups.length === 0 ? (
            <EmptyState
              icon={<HeartHandshake className="h-12 w-12 text-ink-300" />}
              title="Aucun suivi de visiteur actif"
              description="Tous les nouveaux visiteurs ont été intégrés ou archivés."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 font-semibold">
                    <th className="py-3 px-4">Visiteur</th>
                    <th className="py-3 px-4">Date de planification</th>
                    <th className="py-3 px-4">Statut du suivi</th>
                    <th className="py-3 px-4">Notes d'intégration</th>
                    <th className="py-3 px-4">Prochaine action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {visitorFollowups.map((item) => (
                    <tr key={item.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-ink-800 dark:text-ink-200">
                            {item.visitor?.last_name} {item.visitor?.first_name}
                          </p>
                          <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {item.visitor?.phone || 'Pas de numéro'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-ink-600 dark:text-ink-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-ink-400" /> {formatDate(item.scheduled_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          item.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {item.status === 'completed' ? 'Traité' : item.status === 'cancelled' ? 'Annulé' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-ink-500">
                        {item.notes || 'Aucune note'}
                      </td>
                      <td className="py-3.5 px-4 text-ink-600 dark:text-ink-400">
                        {item.next_date ? `Relance prévue le ${formatDate(item.next_date)}` : 'À planifier'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'notes' && isPastorOrAdmin && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100">
                Entretiens de Conseil & Notes Pastorales Confidentielles
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Seul le clergé et les responsables autorisés ont accès à cet écran crypté.
              </p>
            </div>
            <div className="w-full md:w-72">
              <Input
                placeholder="Rechercher un membre par nom..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
              />
            </div>
          </div>

          {isLoadingMembers ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-lg" />
            </div>
          ) : !members || members.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-12 w-12 text-ink-300" />}
              title="Aucun membre trouvé"
              description="Essayez de modifier votre recherche."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col justify-between border border-ink-100 dark:border-ink-800 rounded-xl p-4 hover:shadow-sm dark:bg-ink-900/40"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-ink-900 dark:text-ink-100">
                        {member.last_name} {member.first_name}
                      </p>
                      {member.notes_confidential && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="h-3 w-3" /> Strictement Confidentiel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{member.phone || 'Pas de numéro'}</p>
                    <p className="text-sm text-ink-700 dark:text-ink-300 mt-3 line-clamp-3 italic">
                      {member.pastoral_notes ? `"${member.pastoral_notes}"` : 'Aucune note consignée.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<FileText className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setSelectedMember(member);
                        setPastoralNote(member.pastoral_notes || '');
                        setIsConfidential(member.notes_confidential || false);
                      }}
                    >
                      Consigner un entretien
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal - Update Absence Followup */}
      {selectedAbsence && (
        <Modal
          open
          onClose={() => setSelectedAbsence(null)}
          title="Mise à jour du suivi d'absence"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedAbsence(null)}>
                Annuler
              </Button>
              <Button
                loading={updateAbsenceMutation.isPending}
                onClick={() =>
                  updateAbsenceMutation.mutate({
                    id: selectedAbsence.id,
                    status: absenceStatus,
                    notes: absenceNotes
                  })
                }
              >
                Enregistrer
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-600 dark:text-ink-400">
              Membre : <strong>{selectedAbsence.member?.last_name} {selectedAbsence.member?.first_name}</strong>
              <br />
              Absence prolongée de : <strong>{selectedAbsence.missed_weeks} semaines</strong>
            </p>

            <Select
              label="Statut du suivi"
              value={absenceStatus}
              onChange={(e) => setAbsenceStatus(e.target.value)}
            >
              <option value="pending">En attente de relance</option>
              <option value="contacted">Membres contactés par téléphone</option>
              <option value="visited">Visité à domicile</option>
              <option value="resolved">Résolu / De retour à l'église</option>
            </Select>

            <div className="flex flex-col">
              <label className="label mb-1">Notes et observations</label>
              <textarea
                className="input min-h-[100px] py-2 px-3 text-sm rounded-lg"
                placeholder="Indiquez les détails de l'échange ou de la visite (ex: Maladie, voyage, prières requises...)"
                value={absenceNotes}
                onChange={(e) => setAbsenceNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal - Update Pastoral Notes */}
      {selectedMember && (
        <Modal
          open
          onClose={() => setSelectedMember(null)}
          title="Fiche pastorale confidentielle"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>
                Fermer
              </Button>
              <Button
                loading={updatePastoralNoteMutation.isPending}
                onClick={() =>
                  updatePastoralNoteMutation.mutate({
                    id: selectedMember.id,
                    notes: pastoralNote,
                    confidential: isConfidential
                  })
                }
              >
                Enregistrer les notes
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              Conseil Spirituel pour {selectedMember.last_name} {selectedMember.first_name}
            </p>

            <div className="flex flex-col">
              <label className="label mb-1">Résumé des entretiens & Sujets de prière</label>
              <textarea
                className="input min-h-[150px] py-2 px-3 text-sm rounded-lg font-mono text-xs"
                placeholder="Consignez les remarques importantes, requêtes spirituelles spécifiques..."
                value={pastoralNote}
                onChange={(e) => setPastoralNote(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-bordeaux-600 focus:ring-bordeaux-500"
              />
              <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" /> Marquer cette fiche comme Strictement Confidentielle
              </span>
            </label>
            <p className="text-[11px] text-ink-400 pl-6 leading-normal">
              Les fiches confidentielles sont masquées sur tous les autres profils et ne s'affichent pas dans le registre général des secrétaires.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
