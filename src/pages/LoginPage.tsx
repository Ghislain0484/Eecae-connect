import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error('Connexion échouée', error);
    } else {
      toast.success('Bienvenue', 'Connexion réussie');
    }
  };

  const handleReset = async () => {
    if (!resetEmail) return;
    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);
    if (error) {
      toast.error('Erreur', error);
    } else {
      toast.success('E-mail envoyé', 'Vérifiez votre boîte de réception');
      setResetMode(false);
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-bordeaux-800 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold-400 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-bordeaux-400 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <img src="/Logo_CAE.png" alt="EECAE" className="h-12 w-12 rounded-2xl object-cover border border-gold-400/30" />
          <div>
            <p className="font-display text-xl font-bold text-white">EECAE</p>
            <p className="text-xs text-gold-200/80">Centre d'Adoration de l'Éternel</p>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-3xl font-bold text-white leading-tight">
            Gérez votre assemblée avec clarté et fidélité
          </h1>
          <p className="mt-4 text-bordeaux-100/80 text-base leading-relaxed">
            Une plateforme complète pour le suivi des membres, des visiteurs, des cultes,
            des finances et de la croissance spirituelle de toutes vos assemblées.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-gold-200">
            <ShieldCheck className="h-4 w-4" />
            <span>Données protégées · Multi-assemblées · Sécurisé</span>
          </div>
        </div>
        <div className="relative z-10 text-xs text-bordeaux-200/60">
          © {new Date().getFullYear()} EECAE — Tous droits réservés
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50 dark:bg-ink-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src="/Logo_CAE.png" alt="EECAE" className="h-12 w-12 rounded-2xl object-cover" />
            <div>
              <p className="font-display text-xl font-bold text-bordeaux-800 dark:text-bordeaux-300">EECAE</p>
              <p className="text-xs text-ink-400">Centre d'Adoration de l'Éternel</p>
            </div>
          </div>

          {!resetMode ? (
            <>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-100">Connexion</h2>
              <p className="mt-1.5 text-sm text-ink-500">Accédez à la plateforme de gestion</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <div>
                  <label className="label">Adresse e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input
                      type="email"
                      {...register('email')}
                      className="input pl-9"
                      placeholder="vous@eecae.ci"
                      defaultValue="admin@eecae.ci"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="input pl-9 pr-10"
                      placeholder="••••••••"
                      defaultValue="EECAE2026!"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" loading={loading} icon={!loading ? <LogIn className="h-4 w-4" /> : undefined}>
                  Se connecter
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button onClick={() => setResetMode(true)} className="text-bordeaux-600 hover:text-bordeaux-700 font-medium">
                  Mot de passe oublié ?
                </button>
              </div>

              <div className="mt-8 rounded-lg border border-gold-200 bg-gold-50 p-3 dark:border-gold-900/50 dark:bg-gold-950/30">
                <p className="text-xs text-gold-800 dark:text-gold-300">
                  <strong>Compte de démonstration :</strong> admin@eecae.ci / EECAE2026!
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-100">Réinitialiser le mot de passe</h2>
              <p className="mt-1.5 text-sm text-ink-500">Un lien de réinitialisation vous sera envoyé par e-mail.</p>
              <div className="mt-8 space-y-4">
                <Input
                  label="Adresse e-mail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="vous@eecae.ci"
                />
                <Button onClick={handleReset} className="w-full" loading={loading}>
                  Envoyer le lien
                </Button>
                <button onClick={() => setResetMode(false)} className="w-full text-sm text-ink-500 hover:text-ink-700">
                  ← Retour à la connexion
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Veuillez patienter...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
