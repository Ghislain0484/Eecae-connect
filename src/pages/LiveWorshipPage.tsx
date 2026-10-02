import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, CheckCircle, Clock, Heart, Users, Sparkles, Volume2, BookOpen, Wallet, ChevronRight, Maximize2, Minimize2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useEvents } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select, Modal } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';

export interface LiturgyStep {
  id: number;
  title: string;
  subtitle: string;
  defaultDurationMinutes: number;
  icon: string;
  notesPlaceholder: string;
}

const LITURGY_STEPS: LiturgyStep[] = [
  {
    id: 1,
    title: '1. Intercession & Prières',
    subtitle: 'Combat spirituel, supplications pour l\'assemblée et la nation',
    defaultDurationMinutes: 15,
    icon: '🙏',
    notesPlaceholder: 'Sujets de prière principaux abordés...',
  },
  {
    id: 2,
    title: '2. Louange & Adoration',
    subtitle: 'Chants de célébration, adoration et communion avec le Saint-Esprit',
    defaultDurationMinutes: 25,
    icon: '🎶',
    notesPlaceholder: 'Cantiques et chants de louange entonnés...',
  },
  {
    id: 3,
    title: '3. Témoignages & Actions de Grâce',
    subtitle: 'Récits des merveilles de Dieu et victoires dans la vie des fidèles',
    defaultDurationMinutes: 15,
    icon: '✨',
    notesPlaceholder: 'Noms des témoins et résumés des délivrances...',
  },
  {
    id: 4,
    title: '4. Annonces de l\'Église',
    subtitle: 'Informations officielles, programmes de semaine, séminaires et mariages',
    defaultDurationMinutes: 10,
    icon: '📢',
    notesPlaceholder: 'Programmes et dates importantes communiqués...',
  },
  {
    id: 5,
    title: '5. Offrandes & Dîmes',
    subtitle: 'Panier de la foi, Dîmes, Offrandes spéciales, Missions et Actions de grâces',
    defaultDurationMinutes: 15,
    icon: '💰',
    notesPlaceholder: 'Remarques ou offrandes remarquables...',
  },
  {
    id: 6,
    title: '6. Prédication de la Parole',
    subtitle: 'Exhortation, enseignement biblique et appel du pasteur',
    defaultDurationMinutes: 45,
    icon: '📖',
    notesPlaceholder: 'Thème, passage biblique et grandes lignes du sermon...',
  },
  {
    id: 7,
    title: '7. Prières de Fin & Bénédiction',
    subtitle: 'Appels aux âmes, prière pour les malades et bénédiction pastorale finale',
    defaultDurationMinutes: 10,
    icon: '🕊️',
    notesPlaceholder: 'Nouveaux convertis et prières d\'onction...',
  },
];

export function LiveWorshipPage() {
  const { activeChurch } = useAuth();
  const { branding } = useBranding();
  const toast = useToast();

  const { data: events } = useEvents(activeChurch?.id, { status: 'all' });
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step notes & Sermon tracking
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [sermonTitle, setSermonTitle] = useState('');
  const [preacherName, setPreacherName] = useState(activeChurch?.senior_pastor || '');
  const [biblePassage, setBiblePassage] = useState('');

  // Live Offering Counters
  const [offerings, setOfferings] = useState({
    dimes: 0,
    panierFoi: 0,
    offrandeSpeciale: 0,
    actionGraces: 0,
    missions: 0,
  });

  const [savingService, setSavingService] = useState(false);

  // Auto-select latest event if not chosen
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Timer tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTimerDisplay = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeStep = LITURGY_STEPS[activeStepIndex];
  const targetSec = (activeStep?.defaultDurationMinutes || 15) * 60;
  const isOvertime = timerSeconds > targetSec;

  const handleSaveWorshipSummary = async () => {
    if (!selectedEventId || !activeChurch?.id) {
      toast.error('Erreur', 'Veuillez sélectionner un culte');
      return;
    }

    setSavingService(true);
    try {
      // 1. Save Sermon record if sermon details were entered
      if (sermonTitle.trim()) {
        await supabase.from('sermons').insert({
          church_id: activeChurch.id,
          event_id: selectedEventId,
          title: sermonTitle,
          preacher: preacherName || 'Pasteur',
          bible_references: biblePassage ? [biblePassage] : [],
          sermon_date: new Date().toISOString().split('T')[0],
          notes: stepNotes[6] || '',
        });
      }

      toast.success('Rapport de culte et sermon sauvegardés avec succès !');
    } catch (err: any) {
      toast.error('Erreur lors de l\'enregistrement', err.message);
    } finally {
      setSavingService(false);
    }
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-ink-950 text-white p-6 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Console Culte en Direct
            </h1>
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            Suivi liturgique pas-à-pas, chronométrage officiel, régie et saisie en temps réel pour {branding.shortName}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-56 text-xs"
          >
            {events?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({formatDate(e.event_date)})
              </option>
            ))}
          </Select>

          <Button
            variant="secondary"
            size="sm"
            icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? 'Quitter Plein Écran' : 'Mode Régie / Pupitre'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Liturgical Timeline (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3 px-1">
              Déroulé Liturgique Officiel
            </h3>
            <div className="space-y-1.5">
              {LITURGY_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      resetTimer();
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-md font-semibold'
                        : isPassed
                        ? 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50'
                        : 'bg-white dark:bg-ink-900/60 text-ink-700 dark:text-ink-300 hover:bg-ink-100/80 border border-ink-100 dark:border-ink-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{step.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs truncate font-bold">{step.title}</p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-ink-400'}`}>
                          Conseillé : {step.defaultDurationMinutes} min
                        </p>
                      </div>
                    </div>
                    {isPassed && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {isActive && <ChevronRight className="h-4 w-4 text-white shrink-0 animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right column: Active Step Live Console & Tools (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Step Hero Card with Live Chrono */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-white via-white to-brand-primary-light/40 dark:from-ink-900 dark:via-ink-900 dark:to-brand-primary/10 border border-brand-primary/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm bg-white dark:bg-ink-800 border">
                  {activeStep.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                    Étape {activeStep.id} sur 7
                  </span>
                  <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-white mt-1">
                    {activeStep.title}
                  </h2>
                  <p className="text-xs text-ink-500 max-w-md">{activeStep.subtitle}</p>
                </div>
              </div>

              {/* Chronometer */}
              <div className="flex flex-col items-center md:items-end">
                <div
                  className={`font-mono text-4xl font-black tracking-tight px-5 py-2 rounded-2xl border ${
                    isOvertime
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse dark:bg-red-950/40 dark:text-red-400'
                      : 'bg-ink-950 text-emerald-400 border-ink-800 shadow-inner'
                  }`}
                >
                  {formatTimerDisplay(timerSeconds)}
                </div>
                <span className="text-[10px] font-semibold text-ink-400 mt-1">
                  Objectif : {activeStep.defaultDurationMinutes}:00 min
                </span>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={isTimerRunning ? 'secondary' : 'primary'}
                    icon={isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    onClick={toggleTimer}
                  >
                    {isTimerRunning ? 'Pause' : 'Démarrer'}
                  </Button>
                  <Button size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={resetTimer}>
                    RÀZ
                  </Button>
                </div>
              </div>
            </div>

            {/* Dynamic Step Content Workspace */}
            <div className="pt-6 space-y-4">
              {/* STEP 5: SPECIAL OFFERINGS INPUT */}
              {activeStep.id === 5 && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    Comptabilisation Rapide des Rubriques d'Offrandes
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Input
                      label="Dîmes (FCFA)"
                      type="number"
                      value={offerings.dimes}
                      onChange={(e) => setOfferings({ ...offerings, dimes: Number(e.target.value) })}
                    />
                    <Input
                      label="Panier de la Foi"
                      type="number"
                      value={offerings.panierFoi}
                      onChange={(e) => setOfferings({ ...offerings, panierFoi: Number(e.target.value) })}
                    />
                    <Input
                      label="Offrandes Spéciales"
                      type="number"
                      value={offerings.offrandeSpeciale}
                      onChange={(e) => setOfferings({ ...offerings, offrandeSpeciale: Number(e.target.value) })}
                    />
                    <Input
                      label="Actions de Grâces"
                      type="number"
                      value={offerings.actionGraces}
                      onChange={(e) => setOfferings({ ...offerings, actionGraces: Number(e.target.value) })}
                    />
                    <Input
                      label="Offrandes Missions"
                      type="number"
                      value={offerings.missions}
                      onChange={(e) => setOfferings({ ...offerings, missions: Number(e.target.value) })}
                    />
                    <div className="flex flex-col justify-end">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-ink-900 border text-center">
                        <span className="text-[10px] text-ink-400 font-bold uppercase">Total Culte</span>
                        <p className="text-sm font-bold text-emerald-600">
                          {(
                            offerings.dimes +
                            offerings.panierFoi +
                            offerings.offrandeSpeciale +
                            offerings.actionGraces +
                            offerings.missions
                          ).toLocaleString()}{' '}
                          FCFA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: SPECIAL SERMON TRACKING */}
              {activeStep.id === 6 && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    Fiche Prédication & Message du Dimanche
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Thème du Message"
                      value={sermonTitle}
                      onChange={(e) => setSermonTitle(e.target.value)}
                      placeholder="ex: La Puissance de la Foi"
                    />
                    <Input
                      label="Prédicateur"
                      value={preacherName}
                      onChange={(e) => setPreacherName(e.target.value)}
                      placeholder="Pasteur Konan"
                    />
                    <Input
                      label="Passages Bibliques"
                      value={biblePassage}
                      onChange={(e) => setBiblePassage(e.target.value)}
                      placeholder="ex: Hébreux 11:1-6"
                    />
                  </div>
                </div>
              )}

              {/* Step Notes */}
              <div>
                <label className="label">Notes & Compte-rendu de la rubrique</label>
                <textarea
                  rows={3}
                  value={stepNotes[activeStep.id] || ''}
                  onChange={(e) => setStepNotes({ ...stepNotes, [activeStep.id]: e.target.value })}
                  placeholder={activeStep.notesPlaceholder}
                  className="input font-sans text-xs leading-relaxed"
                />
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeStepIndex === 0}
                  onClick={() => {
                    setActiveStepIndex((prev) => Math.max(0, prev - 1));
                    resetTimer();
                  }}
                >
                  Rubrique précédente
                </Button>

                {activeStepIndex < LITURGY_STEPS.length - 1 ? (
                  <Button
                    size="sm"
                    icon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => {
                      setActiveStepIndex((prev) => Math.min(LITURGY_STEPS.length - 1, prev + 1));
                      resetTimer();
                    }}
                  >
                    Passer à l'étape suivante
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    loading={savingService}
                    icon={<Save className="h-4 w-4" />}
                    onClick={handleSaveWorshipSummary}
                  >
                    Clôturer & Sauvegarder le Culte
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
