import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';

@Component({
  selector: 'app-gestion-role',
  templateUrl: './gestion-role.component.html',
  styleUrls: ['./gestion-role.component.scss']
})
export class GestionRoleComponent implements OnInit {
  roles: any[] = [];
  usersByRole: any[] = [];
  newRoleNom: string = '';
  editId: number | null = null;
  editNom: string = '';
  selectedRoleNom: string = '';
  selectedUsers: any[] = [];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.getRoles();
  }

  getRoles() {
    this.roleService.getAllRoles().subscribe((res) => {
      this.roles = res;
    });
  }

  createRole() {
    if (!this.newRoleNom.trim()) return;

    this.roleService.createRole({ nom: this.newRoleNom }).subscribe(() => {
      this.newRoleNom = '';
      this.getRoles();
    });
  }

  deleteRole(id: number) {
    this.roleService.deleteRole(id).subscribe(() => {
      this.getRoles();
    });
  }

  startEdit(role: any) {
    this.editId = role.id;
    this.editNom = role.nom;
  }

  cancelEdit() {
    this.editId = null;
    this.editNom = '';
  }

  updateRole() {
    if (this.editId !== null) {
      this.roleService.updateRole(this.editId, { nom: this.editNom }).subscribe(() => {
        this.editId = null;
        this.editNom = '';
        this.getRoles();
      });
    }
  }

  onViewUsers(roleId: number) {
    const role = this.roles.find(r => r.id === roleId);
    this.selectedRoleNom = role ? role.nom : '';
    this.selectedUsers = []; // Réinitialiser d'abord

    this.roleService.getUsersByRole(roleId).subscribe({
      next: (data) => {
        this.selectedUsers = data;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.selectedUsers = []; // Vide si erreur
      }
    });
  }
}
