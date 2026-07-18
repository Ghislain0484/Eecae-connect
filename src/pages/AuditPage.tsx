import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Filter, Eye, Calendar, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select, EmptyState, Modal } from '../components/ui';
import { formatDate } from '../lib/utils';

export function AuditPage() {
  const { activeChurch } = useAuth();

  const [searchUser, setSearchUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', activeChurch?.id, searchUser, selectedAction, selectedModule],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeChurch?.id) {
        query = query.eq('church_id', activeChurch.id);
      }
      if (searchUser) {
        query = query.ilike('user_email', `%${searchUser}%`);
      }
      if (selectedAction) {
        query = query.eq('action', selectedAction);
      }
      if (selectedModule) {
        query = query.eq('module', selectedModule);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeChurch?.id,
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'update':
        return 'bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-400';
      case 'delete':
        return 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400';
      case 'archive':
        return 'bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/20 dark:text-purple-400';
      default:
        return 'bg-ink-50 text-ink-700 dark:bg-ink-900/40 dark:text-ink-300';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      case 'archive':
        return 'Archivage';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'Audit"
        subtitle="Registre de sécurité des modifications de données et activités des secrétaires et trésoriers"
      />

      {/* Filters Card */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            className="input pl-9 text-xs py-2 rounded-lg"
            placeholder="Rechercher par e-mail..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>

        <Select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
          <option value="">— Action (Toutes) —</option>
          <option value="create">Créations</option>
          <option value="update">Modifications</option>
          <option value="delete">Suppressions</option>
          <option value="archive">Archivages</option>
        </Select>

        <Select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
          <option value="">— Module (Tous) —</option>
          <option value="members">Registre Membres</option>
          <option value="attendance">Présences / Cultes</option>
          <option value="finance">Comptabilité / Finances</option>
          <option value="visitors">Suivi Visiteurs</option>
          <option value="cells">Cellules</option>
          <option value="departments">Départements</option>
          <option value="admin">Administration / Accès</option>
        </Select>
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-lg" />
            <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-lg" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-12 w-12 text-ink-300" />}
            title="Aucun journal d'audit trouvé"
            description="Ajustez vos filtres de recherche ou effectuez des actions dans l'application."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Type Entité</th>
                  <th className="py-3 px-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-800 dark:text-ink-200">
                      {log.user_email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeClass(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-ink-700 dark:text-ink-300">
                      {log.module}
                    </td>
                    <td className="py-3 px-4 text-ink-500 font-mono text-xs">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspecter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Log Inspector Modal */}
      {selectedLog && (
        <Modal
          open
          onClose={() => setSelectedLog(null)}
          title="Détails de l'action d'audit"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-ink-50 dark:bg-ink-950/40 rounded-lg text-xs">
              <div>
                <p className="text-ink-400">Effectué par :</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200">{selectedLog.user_email}</p>
              </div>
              <div>
                <p className="text-ink-400">Date et heure :</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200">{formatDate(selectedLog.created_at)}</p>
              </div>
              <div>
                <p className="text-ink-400">Module / Entité :</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200 capitalize">{selectedLog.module} ({selectedLog.entity_type})</p>
              </div>
              <div>
                <p className="text-ink-400">Action :</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200 uppercase">{selectedLog.action}</p>
              </div>
            </div>

            {/* Diff display */}
            <div className="space-y-2">
              <p className="font-display text-xs font-semibold text-ink-850 dark:text-ink-300 flex items-center gap-1">
                <Activity className="h-4 w-4 text-bordeaux-600" />
                Comparatif des modifications (JSON)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Value */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-600">Ancienne valeur</span>
                  <pre className="p-3 bg-red-50/20 dark:bg-red-950/5 border border-red-100 dark:border-red-950/30 rounded-lg text-[10px] font-mono overflow-auto max-h-60 text-red-900 dark:text-red-300">
                    {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : '— (Création)'}
                  </pre>
                </div>

                {/* New Value */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Nouvelle valeur</span>
                  <pre className="p-3 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-950/30 rounded-lg text-[10px] font-mono overflow-auto max-h-60 text-emerald-900 dark:text-emerald-300">
                    {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : '— (Suppression/Archivage)'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
