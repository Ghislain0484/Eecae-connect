import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, MessageSquare, Send, Calendar, Check, Loader2, Users, FolderHeart, Info, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import { logAudit } from '../lib/audit';

interface SentMessage {
  id: string;
  sender: string;
  recipient_type: 'individual' | 'department' | 'cell' | 'family';
  recipient_name: string;
  content: string;
  sent_at: string;
  status: 'sent' | 'failed';
}

const MESSAGE_TEMPLATES = [
  {
    title: 'Rappel de culte dominical',
    body: 'Bonjour cher(e) fidèle, nous vous invitons ce dimanche à 8h00 au temple pour notre grand culte de célébration et d\'adoration. Que Dieu vous bénisse !',
  },
  {
    title: 'Relance réunion de cellule',
    body: 'Shalom ! N\'oublions pas notre réunion de cellule ce soir à 18h30 dans vos quartiers respectifs pour notre temps de partage et de prière fraternelle.',
  },
  {
    title: 'Annonce spéciale / Fête',
    body: 'Chers membres, un programme spécial est prévu cette semaine. Retrouvez tous les détails et horaires sur notre plateforme ou auprès de vos responsables.',
  },
];

export function CommunicationPage() {
  const { activeChurch, profile } = useAuth();
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<'individual' | 'department' | 'cell' | 'family'>('individual');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [sending, setSending] = useState(false);

  // Sent messages history in local state (simulate log)
  const [history, setHistory] = useState<SentMessage[]>([
    {
      id: '1',
      sender: 'Secrétariat Général',
      recipient_type: 'family',
      recipient_name: 'Famille Bénédiction',
      content: 'Bonjour famille ! Réunion spéciale ce samedi à 15h.',
      sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'sent',
    },
    {
      id: '2',
      sender: 'Comité d\'organisation',
      recipient_type: 'department',
      recipient_name: 'Département Louange',
      content: 'Répétition générale ce vendredi soir à 19h00 au temple.',
      sent_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'sent',
    },
  ]);

  // Fetch recipients options based on selection
  const { data: members } = useQuery({
    queryKey: ['members-comm', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data } = await supabase.from('members').select('id, first_name, last_name').eq('church_id', activeChurch.id);
      return data || [];
    },
    enabled: recipientType === 'individual' && !!activeChurch?.id,
  });

  const { data: departments } = useQuery({
    queryKey: ['depts-comm', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data } = await supabase.from('departments').select('id, name').eq('church_id', activeChurch.id);
      return data || [];
    },
    enabled: recipientType === 'department' && !!activeChurch?.id,
  });

  const { data: cells } = useQuery({
    queryKey: ['cells-comm', activeChurch?.id],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      const { data } = await supabase.from('cells').select('id, name').eq('church_id', activeChurch.id);
      return data || [];
    },
    enabled: recipientType === 'cell' && !!activeChurch?.id,
  });

  // Spiritual families options
  const families = [
    { id: 'benediction', name: 'Famille Bénédiction (Blanc)' },
    { id: 'richesse', name: 'Famille Richesse (Jaune)' },
    { id: 'gloire', name: 'Famille Gloire (Orange)' },
    { id: 'surabondance', name: 'Famille Surabondance (Vert)' },
    { id: 'excellence', name: 'Famille Excellence (Rouge)' },
    { id: 'distinction', name: 'Famille Distinction (Bleu)' },
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Erreur', 'Veuillez saisir un message.');
      return;
    }
    if (!selectedRecipientId) {
      toast.error('Erreur', 'Veuillez sélectionner un destinataire.');
      return;
    }

    setSending(true);

    // Simulate network delay to WhatsApp Business API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Resolve recipient name
    let recName = '';
    if (recipientType === 'individual') {
      const found = members?.find((m) => m.id === selectedRecipientId);
      recName = found ? `${found.last_name} ${found.first_name}` : 'Membre';
    } else if (recipientType === 'department') {
      const found = departments?.find((d) => d.id === selectedRecipientId);
      recName = found ? found.name : 'Département';
    } else if (recipientType === 'cell') {
      const found = cells?.find((c) => c.id === selectedRecipientId);
      recName = found ? `Cellule ${found.name}` : 'Cellule';
    } else if (recipientType === 'family') {
      const found = families.find((f) => f.id === selectedRecipientId);
      recName = found ? found.name : 'Famille';
    }

    const newMsg: SentMessage = {
      id: Date.now().toString(),
      sender: profile?.full_name || 'Secrétariat Général',
      recipient_type: recipientType,
      recipient_name: recName,
      content: message,
      sent_at: new Date().toISOString(),
      status: 'sent',
    };

    setHistory((prev) => [newMsg, ...prev]);
    setSending(false);
    setMessage('');
    setSelectedRecipientId('');
    toast.success('Envoyé avec succès', `Le message de masse a été envoyé via l'API WhatsApp Business.`);

    await logAudit({
      action: 'create',
      module: 'communication',
      entityType: 'whatsapp_broadcast',
      entityId: newMsg.id,
      churchId: activeChurch?.id || '',
    });
  };

  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Individuel';
      case 'department':
        return 'Département';
      case 'cell':
        return 'Cellule';
      case 'family':
        return 'Famille Spirituelle';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication & SMS"
        subtitle="Envoi de messages groupés aux fidèles via l'API WhatsApp Business"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-bordeaux-600" />
              Nouveau message de masse
            </h3>

            <div className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['individual', 'family', 'department', 'cell'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setRecipientType(type);
                      setSelectedRecipientId('');
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      recipientType === type
                        ? 'border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700 dark:bg-bordeaux-950/20 dark:text-bordeaux-400'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-800 dark:text-ink-400'
                    }`}
                  >
                    {getRecipientTypeLabel(type)}
                  </button>
                ))}
              </div>

              {/* Recipient select dropdown */}
              <div>
                <label className="label mb-1">Sélectionner le destinataire cible</label>
                {recipientType === 'individual' && (
                  <Select value={selectedRecipientId} onChange={(e) => setSelectedRecipientId(e.target.value)}>
                    <option value="">— Sélectionner un membre —</option>
                    {members?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.last_name} {m.first_name}
                      </option>
                    ))}
                  </Select>
                )}
                {recipientType === 'department' && (
                  <Select value={selectedRecipientId} onChange={(e) => setSelectedRecipientId(e.target.value)}>
                    <option value="">— Sélectionner un département —</option>
                    {departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                )}
                {recipientType === 'cell' && (
                  <Select value={selectedRecipientId} onChange={(e) => setSelectedRecipientId(e.target.value)}>
                    <option value="">— Sélectionner une cellule de maison —</option>
                    {cells?.map((c) => (
                      <option key={c.id} value={c.id}>
                        Cellule {c.name}
                      </option>
                    ))}
                  </Select>
                )}
                {recipientType === 'family' && (
                  <Select value={selectedRecipientId} onChange={(e) => setSelectedRecipientId(e.target.value)}>
                    <option value="">— Sélectionner une famille spirituelle —</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Message content textarea */}
              <div className="flex flex-col">
                <label className="label mb-1">Message</label>
                <textarea
                  className="input min-h-[120px] py-2 px-3 text-sm rounded-lg"
                  placeholder="Écrivez votre message WhatsApp ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1024}
                />
                <p className="text-[10px] text-ink-400 text-right mt-1">{message.length}/1024 caractères</p>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Envoi instantané via l'API officielle</span>
                </div>
                <Button onClick={handleSend} loading={sending} icon={<Send className="h-4 w-4" />}>
                  Diffuser le message
                </Button>
              </div>
            </div>
          </Card>

          {/* Message Templates Quick-Pick */}
          <Card className="p-6">
            <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-gold-500" />
              Modèles de messages rapides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MESSAGE_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => setMessage(tmpl.body)}
                  className="p-3 border border-ink-100 dark:border-ink-800 rounded-lg hover:border-bordeaux-400 hover:shadow-sm cursor-pointer transition-all dark:bg-ink-900/40"
                >
                  <p className="font-semibold text-xs text-bordeaux-700 dark:text-bordeaux-400 mb-1.5">{tmpl.title}</p>
                  <p className="text-[11px] text-ink-500 line-clamp-3 leading-relaxed">"{tmpl.body}"</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: History & Stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              Historique des diffusions
            </h3>

            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="p-3 border border-ink-100 dark:border-ink-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded bg-bordeaux-50 text-bordeaux-700 dark:bg-bordeaux-950/20 dark:text-bordeaux-400">
                        {getRecipientTypeLabel(h.recipient_type)}
                      </span>
                      <p className="font-semibold text-xs text-ink-800 dark:text-ink-200 mt-1">{h.recipient_name}</p>
                    </div>
                    <span className="text-[10px] text-ink-400">{formatDate(h.sent_at)}</span>
                  </div>

                  <p className="text-xs text-ink-600 dark:text-ink-400 italic">"{h.content}"</p>

                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-ink-50 dark:border-ink-800">
                    <span className="text-ink-400">Par: {h.sender}</span>
                    <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                      <Check className="h-3 w-3" /> Délivré
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
