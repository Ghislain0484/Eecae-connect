import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, Users, Plus, Trash2, Key, CheckSquare, Square, Building2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ROLE_LABELS } from '../types/constants';
import { logAudit } from '../lib/audit';

export function UsersPage() {
  const { activeChurch } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // States for adding access
  const [targetChurchId, setTargetChurchId] = useState('');
  const [accessRole, setAccessRole] = useState('member');
  const [canViewFinance, setCanViewFinance] = useState(false);
  const [canViewPastoral, setCanViewPastoral] = useState(false);

  // States for adding a new user profile
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [newDefaultChurchId, setNewDefaultChurchId] = useState('');

  // 1. Fetch all user profiles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch all churches
  const { data: churches } = useQuery({
    queryKey: ['churches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churches')
        .select('id, name, short_name')
        .eq('status', 'active')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch church accesses for the selected user
  const { data: userAccesses, refetch: refetchAccesses } = useQuery({
    queryKey: ['user-accesses', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const { data, error } = await supabase
        .from('user_church_access')
        .select(`
          *,
          church:churches(name, short_name)
        `)
        .eq('user_id', selectedUser.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedUser?.id,
  });

  // Mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (vars: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: vars.isActive })
        .eq('id', vars.id);
      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'admin',
        entityType: 'user_profiles_status',
        entityId: vars.id,
        churchId: activeChurch?.id || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Statut mis à jour');
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async (vars: { id: string; role: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: vars.role })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Rôle mis à jour');
    },
  });

  const addAccessMutation = useMutation({
    mutationFn: async (vars: {
      userId: string;
      churchId: string;
      role: string;
      viewFinance: boolean;
      viewPastoral: boolean;
    }) => {
      // Check if access already exists
      const { data: existing } = await supabase
        .from('user_church_access')
        .select('id')
        .eq('user_id', vars.userId)
        .eq('church_id', vars.churchId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_church_access')
          .update({
            role: vars.role,
            can_view_finance: vars.viewFinance,
            can_view_pastoral: vars.viewPastoral,
            is_active: true,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_church_access')
          .insert({
            user_id: vars.userId,
            church_id: vars.churchId,
            role: vars.role,
            can_view_finance: vars.viewFinance,
            can_view_pastoral: vars.viewPastoral,
            is_active: true,
          });
        if (error) throw error;
      }

      await logAudit({
        action: 'create',
        module: 'admin',
        entityType: 'user_church_access',
        entityId: vars.userId,
        churchId: vars.churchId,
      });
    },
    onSuccess: () => {
      refetchAccesses();
      toast.success('Accès autorisé avec succès');
      setTargetChurchId('');
      setCanViewFinance(false);
      setCanViewPastoral(false);
    },
    onError: (err) => {
      toast.error('Erreur', err.message);
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase.from('user_church_access').delete().eq('id', accessId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAccesses();
      toast.success('Accès révoqué');
    },
  });

  const [newPassword, setNewPassword] = useState('');

  const createProfileMutation = useMutation({
    mutationFn: async (vars: { email: string; password: string; fullName: string; role: string; defaultChurchId: string }) => {
      const { data, error } = await supabase.rpc('create_new_user', {
        p_email: vars.email,
        p_password: vars.password,
        p_full_name: vars.fullName,
        p_role: vars.role,
        p_church_id: vars.defaultChurchId || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Compte utilisateur et profil créés avec succès');
      setShowNewUserModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
    },
    onError: (err) => {
      toast.error('Erreur de création', err.message);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Administrateurs du réseau, rôles de secrétariat, trésorerie et autorisations d'accès"
        action={
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowNewUserModal(true)}>
            Nouvel Utilisateur
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profiles list */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-bordeaux-600" />
              Profils Utilisateurs
            </h3>

            {isLoadingUsers ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-ink-100 dark:bg-ink-800 rounded-lg" />
                <div className="h-12 bg-ink-100 dark:bg-ink-800 rounded-lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 font-semibold">
                      <th className="py-3 px-4">Utilisateur</th>
                      <th className="py-3 px-4">Rôle Système</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                    {users?.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-ink-50/50 dark:hover:bg-ink-800/20 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-bordeaux-50/40 dark:bg-bordeaux-950/10' : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-ink-800 dark:text-ink-200">{user.full_name}</p>
                            <p className="text-xs text-ink-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateUserRoleMutation.mutate({ id: user.id, role: e.target.value })}
                            className="bg-transparent border-none text-xs font-semibold text-ink-700 dark:text-ink-300 focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            {Object.entries(ROLE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.is_active });
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                            }`}
                          >
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="secondary" size="sm" onClick={() => setSelectedUser(user)}>
                            Gérer les Accès
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Church accesses (Granular single-church or multi-church configuration) */}
        <div>
          {selectedUser ? (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-1.5">
                  <Building2 className="h-5 w-5 text-bordeaux-600" />
                  Autorisations : {selectedUser.full_name}
                </h3>
                <p className="text-[11px] text-ink-500 mt-1">
                  Configurez quelles assemblées locales cet utilisateur peut gérer. Si vous lui associez une seule assemblée
                  ici, il n'aura accès qu'à celle-ci.
                </p>
              </div>

              {/* Accès existants */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-semibold text-ink-800 dark:text-ink-300">
                  Accès autorisés ({userAccesses?.length || 0})
                </h4>
                {userAccesses && userAccesses.length > 0 ? (
                  <div className="space-y-2">
                    {userAccesses.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex justify-between items-center p-3 border border-ink-100 dark:border-ink-800 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-xs text-ink-950 dark:text-white">
                            {acc.church?.name}
                          </p>
                          <p className="text-[10px] text-ink-400 mt-0.5">
                            Rôle local : {ROLE_LABELS[acc.role] || acc.role}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {acc.can_view_finance && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                                Finance
                              </span>
                            )}
                            {acc.can_view_pastoral && (
                              <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded">
                                Pastoral
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAccessMutation.mutate(acc.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                          title="Révoquer l'accès"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 italic">Aucun accès spécifique. L'utilisateur utilise sa paroisse par défaut.</p>
                )}
              </div>

              {/* Ajouter un accès */}
              <div className="pt-4 border-t border-ink-100 dark:border-ink-800 space-y-4">
                <h4 className="font-display text-xs font-semibold text-ink-800 dark:text-ink-300">
                  Accorder un nouvel accès local
                </h4>

                <Select label="Sélectionner l'église" value={targetChurchId} onChange={(e) => setTargetChurchId(e.target.value)}>
                  <option value="">— Choisir un Temple —</option>
                  {churches?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>

                <Select label="Rôle local dans cette église" value={accessRole} onChange={(e) => setAccessRole(e.target.value)}>
                  <option value="assembly_pastor">Pasteur d'assemblée</option>
                  <option value="secretary">Secrétaire local</option>
                  <option value="treasurer">Trésorier local</option>
                  <option value="pastoral_care">Chargé de suivi pastoral</option>
                  <option value="member">Membre standard</option>
                </Select>

                {/* Finance and Pastoral permissions toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-700 dark:text-ink-300">
                    <input
                      type="checkbox"
                      checked={canViewFinance}
                      onChange={(e) => setCanViewFinance(e.target.checked)}
                      className="h-4 w-4 rounded border-ink-300 text-bordeaux-600 focus:ring-bordeaux-500"
                    />
                    <span>Peut visualiser et modifier les finances (Trésorerie)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-700 dark:text-ink-300">
                    <input
                      type="checkbox"
                      checked={canViewPastoral}
                      onChange={(e) => setCanViewPastoral(e.target.checked)}
                      className="h-4 w-4 rounded border-ink-300 text-bordeaux-600 focus:ring-bordeaux-500"
                    />
                    <span>Peut consulter les fiches pastorales et confidentielles</span>
                  </label>
                </div>

                <Button
                  onClick={() =>
                    addAccessMutation.mutate({
                      userId: selectedUser.id,
                      churchId: targetChurchId,
                      role: accessRole,
                      viewFinance: canViewFinance,
                      viewPastoral: canViewPastoral,
                    })
                  }
                  disabled={!targetChurchId}
                  className="w-full"
                  icon={<Plus className="h-4 w-4" />}
                >
                  Ajouter l'accès
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-ink-400 text-xs">
              Sélectionnez un utilisateur à gauche pour modifier ou attribuer des accès locaux à une seule ou plusieurs églises.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: New User */}
      {showNewUserModal && (
        <Modal
          open
          onClose={() => setShowNewUserModal(false)}
          title="Créer un compte d'accès utilisateur"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNewUserModal(false)}>
                Annuler
              </Button>
              <Button
                loading={createProfileMutation.isPending}
                onClick={() => {
                  if (!newPassword || newPassword.length < 6) {
                    toast.error('Erreur', 'Le mot de passe doit faire au moins 6 caractères.');
                    return;
                  }
                  createProfileMutation.mutate({
                    email: newEmail,
                    password: newPassword,
                    fullName: newFullName,
                    role: newRole,
                    defaultChurchId: newDefaultChurchId,
                  });
                }}
              >
                Créer l'utilisateur
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Input label="Adresse e-mail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nom@eecae.ci" />
            <Input label="Mot de passe (min. 6 car.)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            <Input label="Nom Complet" type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="ex: Koffi Kouassi Jean" />
            <Select label="Rôle global de départ" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="secretary">Secrétaire</option>
              <option value="treasurer">Trésorier</option>
              <option value="assembly_pastor">Pasteur d'assemblée</option>
              <option value="member">Membre</option>
            </Select>
            <Select label="Église de rattachement par défaut" value={newDefaultChurchId} onChange={(e) => setNewDefaultChurchId(e.target.value)}>
              <option value="">— Choisir —</option>
              {churches?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </Modal>
      )}
    </div>
  );
}
