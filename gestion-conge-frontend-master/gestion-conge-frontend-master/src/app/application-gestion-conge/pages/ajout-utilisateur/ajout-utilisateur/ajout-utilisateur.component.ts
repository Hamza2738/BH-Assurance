import { Component, OnInit } from '@angular/core';
import { Utilisateur } from '../../../models/utilisateur.model';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';

type UserLike = {
  id: number | string;
  nom?: string;
  prenom?: string;
};

@Component({
  selector: 'app-ajout-utilisateur',
  templateUrl: './ajout-utilisateur.component.html',
  styleUrls: ['./ajout-utilisateur.component.scss']
})
export class AjoutUtilisateurComponent implements OnInit {
  utilisateur: Utilisateur = {
    nom: '',
    prenom: '',
    email: '',
    cin: '',
    num_tel: '',
    date_naissance: '',
    poste: '',
    role: '',
    role_id: 0,
    departement_id: 0,
    grade_id: 0,
    photo: '',
    is_active: true
  };

  roles: any[] = [];
  departements: any[] = [];
  grades: any[] = [];

  motDePasseGenere: string | null = null;
  isSubmitting = false;
  messageError = '';
  messageSuccess = '';

  constructor(
    private utilisateurService: UtilisateurService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.utilisateurService.getRoles().subscribe({
      next: (data) => (this.roles = Array.isArray(data) ? data : []),
      error: () => (this.roles = [])
    });

    this.utilisateurService.getDepartements().subscribe({
      next: (data) => (this.departements = Array.isArray(data) ? data : []),
      error: () => (this.departements = [])
    });

    this.utilisateurService.getGrades().subscribe({
      next: (data) => (this.grades = Array.isArray(data) ? data : []),
      error: () => (this.grades = [])
    });
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    this.messageError = '';
    this.messageSuccess = '';

    // validations rapides
    if (!this.utilisateur.nom || !this.utilisateur.prenom || !this.utilisateur.email) {
      this.messageError = 'Veuillez renseigner au minimum le nom, le prénom et l’email.';
      return;
    }
    if (!this.utilisateur.role_id || !this.utilisateur.departement_id || !this.utilisateur.grade_id) {
      this.messageError = 'Veuillez sélectionner le rôle, le département et le grade.';
      return;
    }

    this.isSubmitting = true;

    this.utilisateurService.createUtilisateur(this.utilisateur).subscribe({
      next: (res: any) => {
        // Selon ton API: res peut contenir { mot_de_passe, utilisateur } ou l'id directement.
        this.motDePasseGenere = res?.mot_de_passe ?? null;

        // ✅ Envoi d’une notification au NOUVEL UTILISATEUR (stockée + visible à sa 1ère connexion)
        const createdUserId: number | string | undefined =
          res?.utilisateur?.id ?? res?.id ?? res?.utilisateur_id;

        const current: UserLike | null = this.authService.currentUserValue as any;

        if (createdUserId != null) {
          const expediteurId = current?.id ?? '0';
          const expediteurName =
            current ? `${current.nom || ''} ${current.prenom || ''}`.trim() || 'System' : 'System';
          const destinataireName = `${this.utilisateur.nom} ${this.utilisateur.prenom}`.trim();

          this.notificationService
            .create({
              titre: 'Votre compte a été créé',
              texte: `Bienvenue ${destinataireName} ! Votre compte a été créé avec succès.`,
              id_type_notification: 1, // 1 = générique (selon ton seed backend)
              id_utilisateur_expediteur: expediteurId,
              username_expediteur: expediteurName,
              id_utilisateur_destinataire: createdUserId,
              username_destinataire: destinataireName,
              id_derogation: null,
              // si tu veux aussi pousser les FKs (int) quand ce sont des nombres :
              utilisateur_expediteur_id: typeof expediteurId === 'number' ? expediteurId : undefined,
              utilisateur_destinataire_id:
                typeof createdUserId === 'number' ? createdUserId : undefined
            })
            .subscribe({
              next: () => {
                // Rien d’obligatoire à faire ici
              },
              error: (e) => {
                console.warn('[Notif] échec envoi notification de création utilisateur:', e);
              }
            });
        } else {
          console.warn(
            '[AjoutUtilisateur] Impossible d’envoyer la notification: id nouvel utilisateur absent dans la réponse API.'
          );
        }

        this.messageSuccess = 'Utilisateur ajouté avec succès.';
        if (this.motDePasseGenere) {
          this.messageSuccess += ' Un mot de passe a été généré et envoyé par email.';
        }
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.messageError = err?.error?.message || "Erreur lors de l'ajout de l'utilisateur.";
        this.motDePasseGenere = null;
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.utilisateur = {
      nom: '',
      prenom: '',
      email: '',
      cin: '',
      num_tel: '',
      date_naissance: '',
      poste: '',
      role: '',
      role_id: 0,
      departement_id: 0,
      grade_id: 0,
      photo: '',
      is_active: true
    };
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.utilisateur.photo = reader.result as string);
      reader.readAsDataURL(file);
    }
  }
}
