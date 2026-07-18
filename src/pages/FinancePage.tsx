import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContributions, useExpenses, useTithes, usePledges, useFinanceStats, useCreateContribution, useCreateExpense } from '../hooks/useFinance';
import { PageHeader, Card, CardHeader, Button, Select, Table, TableRow, TableCell, Badge, EmptyState, Skeleton, Modal, Input, StatCard } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { CONTRIBUTION_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHOD_LABELS } from '../types/constants';
import type { PaymentMethod, Contribution, Expense } from '../types';
import { formatCurrency, formatDate, exportToCsv } from '../lib/utils';

export function FinancePage() {
  const { activeChurch } = useAuth();
  const [tab, setTab] = useState<'overview' | 'income' | 'expenses' | 'tithes' | 'pledges'>('overview');
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const toast = useToast();
  const { data: stats, isLoading: statsLoading } = useFinanceStats(activeChurch?.id);
  const { data: contributions } = useContributions(activeChurch?.id);
  const { data: expenses } = useExpenses(activeChurch?.id);
  const { data: tithes } = useTithes(activeChurch?.id);
  const { data: pledges } = usePledges(activeChurch?.id);
  const createContribution = useCreateContribution(activeChurch?.id ?? '');
  const createExpense = useCreateExpense(activeChurch?.id ?? '');

  const handleExport = () => {
    if (tab === 'income' && contributions?.length) exportToCsv(`recettes-${activeChurch?.short_name}.csv`, contributions.map((c) => ({ Date: formatDate(c.contribution_date), Catégorie: c.category, Montant: c.amount, Mode: c.payment_method ? PAYMENT_METHOD_LABELS[c.payment_method as PaymentMethod] : '', Validé: c.is_validated ? 'Oui' : 'Non' })));
    if (tab === 'expenses' && expenses?.length) exportToCsv(`depenses-${activeChurch?.short_name}.csv`, expenses.map((e) => ({ Date: formatDate(e.expense_date), Catégorie: e.category, Bénéficiaire: e.supplier ?? '', Motif: e.motive ?? '', Montant: e.amount, Statut: e.status })));
    toast.success('Export généré');
  };

  return (
    <div>
      <PageHeader title="Finances" subtitle={activeChurch?.short_name ?? ''} action={<><Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Exporter</Button><Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddIncome(true)}>Recette</Button><Button variant="danger" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddExpense(true)}>Dépense</Button></>} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-ink-200 dark:border-ink-800">
        {([['overview', 'Vue d\'ensemble'], ['income', 'Recettes'], ['expenses', 'Dépenses'], ['tithes', 'Dîmes'], ['pledges', 'Promesses']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-bordeaux-600 text-bordeaux-700 dark:text-bordeaux-300' : 'border-transparent text-ink-500 hover:text-ink-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total recettes" value={formatCurrency(stats?.totalIncome ?? 0)} icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
            <StatCard label="Total dépenses" value={formatCurrency(stats?.totalExpense ?? 0)} icon={<TrendingDown className="h-5 w-5" />} color="bordeaux" />
            <StatCard label="Solde net" value={formatCurrency(stats?.balance ?? 0)} icon={<Scale className="h-5 w-5" />} color={stats && stats.balance >= 0 ? 'emerald' : 'bordeaux'} />
          </div>
          <Card>
            <CardHeader title="Recettes par catégorie" />
            <div className="p-5">
              {stats?.byCategory.length ? (
                <div className="space-y-2">
                  {stats.byCategory.sort((a, b) => b.amount - a.amount).map((c) => (
                    <div key={c.category} className="flex items-center justify-between rounded-lg bg-ink-50 dark:bg-ink-800/50 px-4 py-3">
                      <span className="text-sm font-medium">{c.category}</span>
                      <span className="font-display font-bold text-emerald-600">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="Aucune recette" />}
            </div>
          </Card>
        </div>
      )}

      {tab === 'income' && (
        <Card>
          {statsLoading ? <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : !contributions?.length ? <EmptyState title="Aucune recette" description="Enregistrez votre première recette." /> : (
            <Table headers={['Date', 'Catégorie', 'Montant', 'Mode', 'Statut']}>
              {contributions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{formatDate(c.contribution_date)}</TableCell>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell className="font-display font-bold text-emerald-600">{formatCurrency(Number(c.amount))}</TableCell>
                  <TableCell className="text-sm">{c.payment_method ? PAYMENT_METHOD_LABELS[c.payment_method as PaymentMethod] : '—'}</TableCell>
                  <TableCell><Badge className={c.is_validated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{c.is_validated ? 'Validé' : 'En attente'}</Badge></TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'expenses' && (
        <Card>
          {!expenses?.length ? <EmptyState title="Aucune dépense" description="Enregistrez votre première dépense." /> : (
            <Table headers={['Date', 'Catégorie', 'Bénéficiaire', 'Motif', 'Montant', 'Statut']}>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatDate(e.expense_date)}</TableCell>
                  <TableCell className="font-medium">{e.category}</TableCell>
                  <TableCell className="text-sm">{e.supplier ?? '—'}</TableCell>
                  <TableCell className="text-sm text-ink-500 max-w-xs truncate">{e.motive ?? '—'}</TableCell>
                  <TableCell className="font-display font-bold text-red-600">{formatCurrency(Number(e.amount))}</TableCell>
                  <TableCell><Badge className={e.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : e.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-600'}>{e.status === 'paid' ? 'Payé' : e.status === 'pending' ? 'En attente' : e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'tithes' && (
        <Card>
          {!tithes?.length ? <EmptyState icon={<Wallet className="h-12 w-12" />} title="Aucune dîme" /> : (
            <Table headers={['Date', 'Contributeur', 'Montant', 'Mode', 'Anonyme']}>
              {tithes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{formatDate(t.tithe_date)}</TableCell>
                  <TableCell className="font-medium">{t.is_anonymous ? 'Anonyme' : (t.contributor_name ?? '—')}</TableCell>
                  <TableCell className="font-display font-bold text-emerald-600">{formatCurrency(Number(t.amount))}</TableCell>
                  <TableCell className="text-sm">{t.payment_method ? PAYMENT_METHOD_LABELS[t.payment_method as PaymentMethod] : '—'}</TableCell>
                  <TableCell><Badge className={t.is_anonymous ? 'bg-ink-100 text-ink-600' : 'bg-blue-100 text-blue-700'}>{t.is_anonymous ? 'Oui' : 'Non'}</Badge></TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'pledges' && (
        <Card>
          {!pledges?.length ? <EmptyState title="Aucune promesse" /> : (
            <Table headers={['Donateur', 'Type', 'Promis', 'Versé', 'Solde', 'Statut']}>
              {pledges.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.donor_name ?? '—'}</TableCell>
                  <TableCell className="text-sm">{p.pledge_type ?? '—'}</TableCell>
                  <TableCell className="font-display font-bold">{formatCurrency(Number(p.amount_promised))}</TableCell>
                  <TableCell className="text-emerald-600">{formatCurrency(Number(p.amount_paid))}</TableCell>
                  <TableCell className="text-amber-600">{formatCurrency(Number(p.amount_promised) - Number(p.amount_paid))}</TableCell>
                  <TableCell><Badge className={p.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>{p.status === 'open' ? 'Ouverte' : p.status === 'partial' ? 'Partielle' : p.status === 'fulfilled' ? 'Remplie' : p.status === 'overdue' ? 'Échue' : p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      )}

      {showAddIncome && <AddIncomeModal onClose={() => setShowAddIncome(false)} onCreate={createContribution.mutateAsync} />}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} onCreate={createExpense.mutateAsync} />}
    </div>
  );
}

function AddIncomeModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<Contribution>) => Promise<unknown> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contribution_date: new Date().toISOString().slice(0, 10), category: 'Offrande générale', amount: '', payment_method: 'cash', received_by: '', comment: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try { await onCreate({ ...form, amount: parseFloat(form.amount), payment_method: form.payment_method as PaymentMethod }); toast.success('Recette enregistrée'); onClose(); } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle recette" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Enregistrer</Button></div>}>
      <div className="space-y-4">
        <Input label="Date" type="date" value={form.contribution_date} onChange={(e) => set('contribution_date', e.target.value)} />
        <Select label="Catégorie" value={form.category} onChange={(e) => set('category', e.target.value)}>{CONTRIBUTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
        <Input label="Montant (XOF)" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
        <Select label="Mode de paiement" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>{Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Input label="Reçu par" value={form.received_by} onChange={(e) => set('received_by', e.target.value)} />
      </div>
    </Modal>
  );
}

function AddExpenseModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: Partial<Expense>) => Promise<unknown> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ expense_date: new Date().toISOString().slice(0, 10), category: 'Loyer', amount: '', payment_method: 'cash', supplier: '', motive: '', requested_by: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try { await onCreate({ ...form, amount: parseFloat(form.amount), payment_method: form.payment_method as PaymentMethod, status: 'pending' }); toast.success('Dépense enregistrée'); onClose(); } catch (e) { toast.error('Erreur', (e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Nouvelle dépense" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Enregistrer</Button></div>}>
      <div className="space-y-4">
        <Input label="Date" type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        <Select label="Catégorie" value={form.category} onChange={(e) => set('category', e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
        <Input label="Montant (XOF)" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
        <Input label="Bénéficiaire / Fournisseur" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
        <Input label="Motif" value={form.motive} onChange={(e) => set('motive', e.target.value)} />
        <Select label="Mode de paiement" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>{Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        <Input label="Demandeur" value={form.requested_by} onChange={(e) => set('requested_by', e.target.value)} />
      </div>
    </Modal>
  );
}
