import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, FileText, Printer, Download, UploadCloud, ChevronRight, Check, Search, Calendar, FileType2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Card, Button, Input, Select } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';

type FolderType = 'certifs' | 'admin' | 'reports' | 'uploads';

interface LocalFile {
  name: string;
  size: string;
  updated_at: string;
  type: string;
}

interface TemplateDoc {
  id: string;
  title: string;
  desc: string;
  recipient: string;
  subject: string;
  body: string;
  signatureTitle: string;
}

export function DocumentsPage() {
  const { activeChurch } = useAuth();
  const toast = useToast();

  const [activeFolder, setActiveFolder] = useState<FolderType>('certifs');
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [certType, setCertType] = useState('bapteme');
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDoc | null>(null);

  // Local state files for "Fichiers Importés"
  const [uploadedFiles, setUploadedFiles] = useState<LocalFile[]>([
    { name: 'Statuts_et_Reglement_Interieur_EECAE.pdf', size: '1.2 MB', updated_at: '2026-06-15T10:00:00Z', type: 'pdf' },
    { name: 'Fiche_Adhesion_Membre_V2.docx', size: '240 KB', updated_at: '2026-07-02T14:30:00Z', type: 'doc' },
  ]);

  // Fetch members to generate certificate
  const { data: members } = useQuery({
    queryKey: ['members-docs', activeChurch?.id, searchMember],
    queryFn: async () => {
      if (!activeChurch?.id) return [];
      let query = supabase
        .from('members')
        .select('id, first_name, last_name, water_baptism_date, created_at')
        .eq('church_id', activeChurch.id)
        .order('last_name', { ascending: true });

      if (searchMember) {
        query = query.or(`first_name.ilike.%${searchMember}%,last_name.ilike.%${searchMember}%`);
      }

      const { data } = await query.limit(20);
      return data || [];
    },
    enabled: activeFolder === 'certifs' && !!activeChurch?.id,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFile: LocalFile = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        updated_at: new Date().toISOString(),
        type: file.name.split('.').pop() || 'file',
      };
      setUploadedFiles((prev) => [newFile, ...prev]);
      toast.success('Fichier importé', `Le fichier "${file.name}" a été ajouté dans vos documents.`);
    }
  };

  const handleGenerateCertificate = () => {
    if (!selectedMemberId) {
      toast.error('Erreur', 'Veuillez sélectionner un membre.');
      return;
    }

    const member = members?.find((m) => m.id === selectedMemberId);
    if (!member) return;

    if (certType === 'bapteme' && !member.water_baptism_date) {
      toast.error('Attention', 'Ce membre n\'a pas de date de baptême d\'eau renseignée dans son dossier.');
    }

    setPreviewCert({
      memberName: `${member.last_name} ${member.first_name}`,
      churchName: activeChurch?.name || 'Église CAE',
      pastor: activeChurch?.senior_pastor || 'Le Pasteur Responsable',
      date: certType === 'bapteme' ? member.water_baptism_date || new Date().toISOString().split('T')[0] : member.created_at.split('T')[0],
      type: certType,
    });
  };

  const printDoc = () => {
    window.print();
  };

  // Administrative Letters and Reports templates data
  const adminTemplates: TemplateDoc[] = [
    {
      id: 'manifestation',
      title: "Demande d'autorisation de manifestation",
      desc: "Courrier type à l'attention des autorités locales pour manifestation extérieure ou évangélisation.",
      recipient: "Monsieur le Commissaire de Police / Monsieur le Maire",
      subject: "Demande d'autorisation pour une campagne d'évangélisation en plein air",
      body: `Shalom,\n\nPar la présente, nous sollicitons votre bienveillante autorité afin d'obtenir l'autorisation d'organiser une campagne d'évangélisation et d'action sociale chrétienne en plein air.\n\nCe programme spirituel se tiendra dans le respect des règles de sécurité et de l'ordre public. Nous prévoyons des temps de prières, de chants chorales et d'exhortations fraternelles à la paix et au développement spirituel.\n\nNous nous tenons à votre entière disposition pour tout entretien de sécurité ou détail complémentaire.\n\nDans l'attente d'une suite favorable, veuillez agréer, Monsieur, l'expression de nos sentiments distingués en Christ.`,
      signatureTitle: "Le Pasteur Responsable"
    },
    {
      id: 'invitation',
      title: "Lettre d'invitation d'orateur",
      desc: "Modèle officiel pour inviter un pasteur ou orateur externe lors des conventions locales.",
      recipient: "Cher Serviteur de Dieu / Révérend Pasteur",
      subject: "Invitation à officier en qualité d'orateur principal",
      body: `Shalom dans le précieux nom de notre Seigneur Jésus-Christ,\n\nNous avons l'honneur et la joie spirituelle de vous inviter à officier en qualité d'orateur principal lors de notre grand rassemblement de réveil spirituel annuel.\n\nVotre ministère d'édification et de foi sera une bénédiction abondante pour notre communauté de fidèles. L'église prendra en charge l'ensemble de vos dispositions logistiques d'accueil.\n\nEspérant que votre calendrier vous permettra de répondre favorablement à notre appel, nous prions pour l'abondance de la grâce divine sur vos activités.`,
      signatureTitle: "Le Conseil Pastoral"
    },
    {
      id: 'attestation',
      title: "Attestation de membre actif",
      desc: "Document officiel certifiant l'appartenance et l'engagement d'un fidèle au temple local.",
      recipient: "À qui de droit",
      subject: "Attestation d'appartenance et de membre actif",
      body: `Nous soussignés, dirigeants de l'église locale, certifions par la présente que le/la fidèle est un membre régulièrement inscrit, actif et de bonne moralité au sein de notre congrégation.\n\nIl/Elle participe fidèlement aux assemblées d'adoration, soutient activement l'œuvre spirituelle locale et fait preuve d'un comportement exemplaire en phase avec les valeurs chrétiennes de notre église.\n\nEn foi de quoi, cette attestation lui est délivrée pour servir et valoir ce que de droit.`,
      signatureTitle: "Le Secrétariat Général"
    }
  ];

  const reportTemplates: TemplateDoc[] = [
    {
      id: 'moral',
      title: "Rapport moral et d'activité annuel",
      desc: "Trame structurée pour le bilan annuel de l'église locale destiné au bureau national CAE.",
      recipient: "Au Secrétariat National du Réseau EECAE",
      subject: "Rapport annuel de fonctionnement spirituel et administratif",
      body: `Chers dirigeants,\n\nNous vous présentons ci-joint le bilan d'activité de notre église locale. Cette année a été caractérisée par une progression encourageante des effectifs spirituels et le renforcement de nos cellules de maison.\n\n1. STATISTIQUES DE FRÉQUENTATION : Une croissance de nos fidèles actifs avec une hausse de la fréquentation des cultes.\n2. ACTIONS PASTORALES : Accompagnements fraternels et affermissements de nos nouveaux baptisés.\n3. PERSPECTIVES : Travaux d'extension des infrastructures de notre temple local.\n\nNous exprimons notre gratitude à l'Éternel pour sa fidélité constante.`,
      signatureTitle: "Le Pasteur Responsable & Le Conseil"
    },
    {
      id: 'pv_conseil',
      title: "Procès-verbal de conseil pastoral",
      desc: "Modèle officiel de compte-rendu pour consigner les décisions prises lors des réunions mensuelles.",
      recipient: "Archives administratives de l'église",
      subject: "Procès-verbal de réunion mensuelle des responsables de départements",
      body: `Date de la session : ${new Date().toLocaleDateString('fr-FR')}\n\nORDRE DU JOUR :\n- Analyse du bilan financier du mois écoulé\n- Planification des programmes d'évangélisation\n- Suivi de l'intégration des nouveaux convertis\n\nRÉSOLUTIONS ADOPTÉES :\nIl a été statué à l'unanimité d'élargir les plages horaires des visites à domicile pour les familles spirituelles, et de valider les devis d'acquisition de nouveaux matériels de sonorisation.\n\nLa séance a été levée par la prière de clôture à 20h00.`,
      signatureTitle: "Le Secrétaire de Séance"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents & Modèles"
        subtitle="Modèles de courriers officiels, rapports types et générateur de certificats"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-3">
          <FolderButton
            label="Modèles de Certificats"
            active={activeFolder === 'certifs'}
            onClick={() => setActiveFolder('certifs')}
          />
          <FolderButton
            label="Courriers & Administratif"
            active={activeFolder === 'admin'}
            onClick={() => setActiveFolder('admin')}
          />
          <FolderButton
            label="Rapports & Assemblées"
            active={activeFolder === 'reports'}
            onClick={() => setActiveFolder('reports')}
          />
          <FolderButton
            label="Fichiers Importés"
            active={activeFolder === 'uploads'}
            onClick={() => setActiveFolder('uploads')}
          />
        </div>

        {/* Folder Content Panel */}
        <div className="lg:col-span-3">
          {activeFolder === 'certifs' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-1">
                  Générateur automatique de certificats
                </h3>
                <p className="text-xs text-ink-500">
                  Sélectionnez un membre et configurez l'impression de son certificat.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Select label="Type de certificat" value={certType} onChange={(e) => setCertType(e.target.value)}>
                    <option value="bapteme">Certificat de Baptême d'Eau</option>
                    <option value="presentation">Certificat de Présentation d'Enfant</option>
                  </Select>

                  <div className="space-y-2">
                    <label className="label">Sélectionner un membre</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                      <input
                        type="text"
                        className="input pl-9 text-xs py-2 rounded-lg"
                        placeholder="Rechercher le membre par nom..."
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                      />
                    </div>

                    <Select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {members?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.last_name} {m.first_name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Button onClick={handleGenerateCertificate} className="w-full">
                    Générer et prévisualiser
                  </Button>
                </div>

                {/* Certificate Live Preview */}
                <div className="border border-ink-200 dark:border-ink-800 rounded-xl p-4 bg-ink-50/20 dark:bg-ink-950/20 flex flex-col justify-center items-center min-h-[220px] text-center">
                  {previewCert ? (
                    <div className="space-y-3">
                      <FileText className="h-10 w-10 text-bordeaux-600" />
                      <p className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                        {previewCert.type === 'bapteme' ? 'Certificat de Baptême d\'eau' : 'Certificat de Présentation d\'enfant'}
                      </p>
                      <p className="text-xs text-ink-500">Prêt pour impression pour {previewCert.memberName}</p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="secondary" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={printDoc}>
                          Imprimer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-ink-400 text-xs flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 opacity-40" />
                      <span>Aucun document généré pour le moment.</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeFolder === 'admin' && (
            <Card className="p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-2">
                Modèles de courriers administratifs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminTemplates.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.id}
                    title={tmpl.title}
                    desc={tmpl.desc}
                    onPreview={() => setPreviewTemplate(tmpl)}
                  />
                ))}
              </div>
            </Card>
          )}

          {activeFolder === 'reports' && (
            <Card className="p-6 space-y-4">
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-2">
                Rapports d'activités & Assemblées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.id}
                    title={tmpl.title}
                    desc={tmpl.desc}
                    onPreview={() => setPreviewTemplate(tmpl)}
                  />
                ))}
              </div>
            </Card>
          )}

          {activeFolder === 'uploads' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100 mb-1">
                  Espace de stockage local
                </h3>
                <p className="text-xs text-ink-500">
                  Importez et stockez des fichiers administratifs liés à cette assemblée.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-ink-200 hover:border-bordeaux-500 dark:border-ink-800 rounded-xl p-8 cursor-pointer transition-colors bg-ink-50/20 dark:bg-ink-950/20">
                <UploadCloud className="h-10 w-10 text-ink-400 mb-2" />
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">Importer un fichier</span>
                <span className="text-xs text-ink-400 mt-1">PDF, DOCX, PNG (Max 5MB)</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
              </label>

              {/* Uploaded Files list */}
              <div className="space-y-2">
                <h4 className="font-display text-xs font-semibold text-ink-900 dark:text-ink-100 mb-2">Fichiers récents</h4>
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 border border-ink-100 dark:border-ink-800 rounded-lg hover:shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileType2 className="h-5 w-5 text-bordeaux-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink-800 dark:text-ink-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-ink-400 mt-0.5">
                          {file.size} · Mis à jour le {formatDate(file.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />}>
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Printable Certificate Template (Calligraphy style print-preview modal) */}
      {previewCert && (
        <Modal open onClose={() => setPreviewCert(null)} title="Aperçu avant impression" size="lg">
          <div className="p-8 border-4 border-double border-gold-600 rounded-xl bg-white text-ink-950 text-center font-serif space-y-6 max-w-2xl mx-auto my-4 shadow-lg print:border-none print:shadow-none print:my-0">
            <h1 className="text-3xl font-bold text-bordeaux-800 uppercase tracking-widest">
              {previewCert.type === 'bapteme' ? 'Certificat de Baptême d\'Eau' : 'Certificat de Présentation d\'Enfant'}
            </h1>
            <p className="text-xs italic text-gold-700">"Celui qui croira et qui sera baptisé sera sauvé" — Marc 16:16</p>

            <div className="py-6 space-y-4">
              <p className="text-sm">Nous certifions par la présente que</p>
              <p className="text-2xl font-bold text-ink-900 border-b border-gold-200 pb-1 max-w-md mx-auto">
                {previewCert.memberName}
              </p>
              <p className="text-sm">
                a reçu le sacrement sacré du baptême par immersion ou a été présenté solennellement à Dieu le
              </p>
              <p className="text-lg font-bold text-ink-800">{formatDate(previewCert.date)}</p>
              <p className="text-sm">au sein de l'assemblée locale de</p>
              <p className="text-lg font-bold text-bordeaux-700">{previewCert.churchName}</p>
            </div>

            <div className="flex justify-between items-end pt-12 text-xs">
              <div className="text-left">
                <p className="font-semibold">Le Secrétaire</p>
                <div className="h-10 w-24 border-b border-ink-300 border-dashed" />
              </div>
              <div className="text-right">
                <p className="font-semibold">L'Orateur / Pasteur Officant</p>
                <p className="font-bold text-ink-800 mt-1">{previewCert.pastor}</p>
                <div className="h-10 w-32 border-b border-ink-300 border-dashed ml-auto" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setPreviewCert(null)}>
              Fermer
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={printDoc}>
              Lancer l'impression
            </Button>
          </div>
        </Modal>
      )}

      {/* Styled Paper Letter Template Preview Modal */}
      {previewTemplate && (
        <Modal open onClose={() => setPreviewTemplate(null)} title="Visualisation du Document Officiel" size="lg">
          <div className="p-10 border border-ink-300 rounded bg-white text-ink-950 font-sans space-y-6 max-w-2xl mx-auto my-4 shadow-md leading-relaxed print:border-none print:shadow-none">
            {/* Church Letterhead */}
            <div className="border-b-2 border-bordeaux-800 pb-4 text-center">
              <p className="font-bold text-lg text-bordeaux-800 tracking-wide uppercase">Centre d'Adoration de l'Éternel (CAE)</p>
              <p className="text-xs text-ink-600 font-semibold">{activeChurch?.name || 'Temple Local'}</p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                {activeChurch?.neighborhood}, {activeChurch?.city} · Responsable : {activeChurch?.senior_pastor}
              </p>
            </div>

            {/* Date and Location */}
            <div className="text-right text-xs text-ink-600">
              Fait à {activeChurch?.city || 'Bonoua'}, le {new Date().toLocaleDateString('fr-FR')}
            </div>

            {/* Recipient */}
            <div className="text-left text-xs font-semibold text-ink-800">
              Destinataire : <br />
              <span className="text-sm font-bold text-ink-950">{previewTemplate.recipient}</span>
            </div>

            {/* Subject */}
            <div className="text-left text-xs font-bold text-bordeaux-850">
              OBJET : {previewTemplate.subject}
            </div>

            {/* Letter Body */}
            <div className="text-sm text-ink-900 whitespace-pre-line text-justify py-2 leading-relaxed">
              {previewTemplate.body}
            </div>

            {/* Signatures */}
            <div className="flex justify-end pt-8 text-xs">
              <div className="text-right min-w-[200px]">
                <p className="font-bold text-ink-800">{previewTemplate.signatureTitle}</p>
                <div className="h-12 w-32 border-b border-ink-300 border-dashed ml-auto mt-2" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
              Fermer
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={printDoc}>
              Imprimer le Document
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FolderButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
        active
          ? 'bg-bordeaux-50 border-bordeaux-300 text-bordeaux-700 dark:bg-bordeaux-950/20 dark:border-bordeaux-800 dark:text-bordeaux-400'
          : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-50 dark:bg-ink-900 dark:border-ink-800 dark:text-ink-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <FolderOpen className={`h-4 w-4 ${active ? 'text-bordeaux-600' : 'text-ink-400'}`} />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4.5 w-4.5 opacity-55" />
    </button>
  );
}

function TemplateCard({ title, desc, onPreview }: { title: string; desc: string; onPreview: () => void }) {
  return (
    <div className="p-4 border border-ink-150 dark:border-ink-800 rounded-xl space-y-2 hover:shadow-xs hover:border-ink-300 dark:bg-ink-900/40 flex flex-col justify-between">
      <div className="flex items-start gap-2">
        <FileText className="h-5 w-5 text-bordeaux-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-xs text-ink-900 dark:text-ink-100">{title}</p>
          <p className="text-[11px] text-ink-500 leading-normal mt-1">{desc}</p>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2 border-t border-ink-50 dark:border-ink-800 mt-3">
        <Button variant="secondary" size="sm" icon={<Eye className="h-3 w-3" />} onClick={onPreview}>
          Visualiser
        </Button>
        <Button variant="secondary" size="sm" icon={<Download className="h-3 w-3" />}>
          Télécharger (.docx)
        </Button>
      </div>
    </div>
  );
}
