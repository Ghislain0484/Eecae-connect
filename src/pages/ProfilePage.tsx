import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Shield, Phone, Save, Building, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ROLE_LABELS } from '../types/constants';
import { logAudit } from '../lib/audit';

export function ProfilePage() {
  const { profile, activeChurch, refreshProfile } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Sync user details on mount or change
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await logAudit({
        action: 'update',
        module: 'admin',
        entityType: 'user_profiles',
        entityId: profile.id,
        churchId: activeChurch?.id || '',
      });
    },
    onSuccess: async () => {
      toast.success('Profil mis à jour');
      await refreshProfile();
    },
    onError: (err) => {
      toast.error('Erreur', err.message);
    },
  });

  const avatarsList = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Mon Profil" subtitle="Gérez vos informations personnelles et configurez votre identifiant" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Summary */}
        <div className="space-y-6">
          <Card className="p-6 text-center flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer mb-4">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={fullName}
                className="h-28 w-28 rounded-full border-4 border-bordeaux-100 object-cover shadow-sm dark:border-bordeaux-950/30"
              />
            </div>

            <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-100">{fullName}</h3>
            <p className="text-xs text-ink-400 mt-0.5">{profile?.email}</p>

            <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-bordeaux-50 text-bordeaux-700 dark:bg-bordeaux-950/30 dark:text-bordeaux-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" />
              {profile ? ROLE_LABELS[profile.role] : ''}
            </div>

            <div className="w-full border-t border-ink-100 dark:border-ink-800 mt-6 pt-4 space-y-3 text-left text-xs">
              <div className="flex items-center gap-2.5 text-ink-600 dark:text-ink-400">
                <Building className="h-4 w-4 text-ink-400 shrink-0" />
                <span>Rattaché au : <strong>{activeChurch?.short_name || 'Siège'}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-ink-600 dark:text-ink-400">
                <Mail className="h-4 w-4 text-ink-400 shrink-0" />
                <span>E-mail : {profile?.email}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Card: Editor Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 space-y-6">
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
              <User className="h-5 w-5 text-bordeaux-600" />
              Modifier mes informations
            </h3>

            <div className="space-y-4 max-w-xl">
              <Input
                label="Nom Complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nom complet"
                icon={<User className="h-4 w-4 text-ink-400" />}
              />

              <Input
                label="Numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07..."
                icon={<Phone className="h-4 w-4 text-ink-400" />}
              />

              {/* Avatar Preset Select */}
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5">
                  <Image className="h-4 w-4 text-ink-400" />
                  Sélectionner un avatar prédéfini
                </label>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {avatarsList.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`h-11 w-11 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? 'border-bordeaux-500 scale-105 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`avatar-${idx}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  loading={updateProfileMutation.isPending}
                  icon={<Save className="h-4 w-4" />}
                >
                  Enregistrer mon profil
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
