import {Component, OnInit} from '@angular/core';
import {ToastController} from '@ionic/angular';
import {
  Family,
  FamilyMember,
  FamilyService,
  Invitation,
  UpdateInvitationReq,
  UpdateUserReq,
  UserService
} from '../../openapi/generated-src';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-family',
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss'],
})
export class FamilyComponent implements OnInit {
  family: any = null; // A felhasználó családja
  familyMembers: FamilyMember[] = []; // Családtagok listája
  inviteEmail: string = ''; // Meghívandó email
  pendingInvite: Invitation | null = null; // Függőben lévő meghívó
  inviteEmailErrorText: string = '';
  userId?: number;
  familyId?: number;

  constructor(
    private familyService: FamilyService,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
  ) {
  }

  ngOnInit() {
    const uId = this.authService.getUserId();
    this.userId = uId ? uId : undefined;
    const fId = this.authService.getUserFamilyId();
    this.familyId = fId ? fId : undefined;
    this.loadFamilyData();
    this.checkPendingInvites();
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      this.inviteEmailErrorText = 'Please enter a valid email address.';
      return false;
    }
    this.inviteEmailErrorText = '';
    return true;
  }

  async loadFamilyData() {
    if (this.familyId) {
      this.familyService.getFamilyById(this.familyId).subscribe({
        next: (family: Family) => {
          this.family = family;
          this.loadFamilyMembers();
        },
        error: (error) => {
          this.showToast('Failed to load family data.', 'danger');
        },
      });
    } else {
      this.showToast('Failed to load family data.', 'danger');
    }
  }

  async loadFamilyMembers() {
    if (this.familyId) {
      this.familyService.getFamilyMembers(this.familyId).subscribe({
        next: (members: FamilyMember[]) => {
          this.familyMembers = members;
        },
        error: (error) => {
          this.showToast('Failed to load family members.', 'danger');
        },
      });
    } else {
      this.showToast('Failed to load family members.', 'danger');
    }
  }

  async checkPendingInvites() {
    if (this.userId) {
      this.familyService.getPendingInvites(this.userId).subscribe({
        next: (invites: Invitation[]) => {
          this.pendingInvite = invites[0]; // Csak az első meghívót jelenítjük meg
        },
        error: (error) => {
          this.showToast('Failed to load pending invites.', 'danger');
        },
      });
    }
  }

  async createFamily() {
    const familyName = prompt('Enter family name:');
    if (familyName) {
      this.familyService.createFamily({familyName: familyName}).subscribe({
        next: (family: Family) => {
          if (this.userId) {
            const updatedUser: UpdateUserReq = {
              userId: this.userId,
              familyId: family.familyId,
            };
            this.userService.updateUserById(this.userId, updatedUser).subscribe();
            this.family = family;
            this.authService.setUserFamilyId(family.familyId);
            this.showToast('Family created successfully!', 'success');
          } else {
            this.showToast('Failed to create family.', 'danger');
          }
        },
        error: (error) => {
          this.showToast('Failed to create family.', 'danger');
        },
      });
    }
  }

  async inviteToFamily() {
    if (this.inviteEmail) {
      // Email cím validálása
      if (!this.validateEmail(this.inviteEmail)) {
        return;
      }
      // Meghívó küldése
      this.familyService.inviteUserToFamily(this.family.familyId, {
        email: this.inviteEmail
      }).subscribe({
        next: () => {
          this.showToast('Invitation sent successfully!', 'success');
          this.inviteEmail = ''; // Mező ürítése
        },
        error: (error) => {
          this.showToast('Failed to send invitation.', 'danger');
        },
      });
    }
  }

  async acceptInvite() {
    if (this.pendingInvite) {
      const updateInvitationReq: UpdateInvitationReq = {status: 'accepted'};

      this.familyService.acceptInvite(this.pendingInvite.invitationId, updateInvitationReq).subscribe({
        next: () => {
          this.authService.setUserFamilyId(this.pendingInvite!.familyId);
          this.familyId = this.pendingInvite?.familyId;

          this.showToast('Invitation accepted!', 'success');
          this.pendingInvite = null; // Függőben lévő meghívó törlése
          this.loadFamilyData(); // Családi adatok frissítése
        },
        error: (error) => {
          this.showToast('Failed to accept invitation.', 'danger');
        },
      });
    }
  }

  async declineInvite() {
    if (this.pendingInvite) {
      const updateInvitationReq: UpdateInvitationReq = {status: 'declined'};

      this.familyService.declineInvite(this.pendingInvite.invitationId, updateInvitationReq).subscribe({
        next: () => {
          this.showToast('Invitation declined.', 'warning');
          this.pendingInvite = null; // Függőben lévő meghívó törlése
        },
        error: (error) => {
          this.showToast('Failed to decline invitation.', 'danger');
        },
      });
    }
  }

  async leaveFamily() {
    const isConfirmed = confirm('Are you sure you want to leave the family?');
    if (isConfirmed && this.userId && this.familyId) {
      this.familyService.leaveFamily(this.familyId, { userId: this.userId }).subscribe({
        next: () => {
          this.family = null;
          this.authService.setUserFamilyId(-1); // -1 vagy null, attól függően, hogy hogyan kezeled a localStorage-ban
          this.showToast('You have left the family.', 'warning');
        },
        error: (error) => {
          this.showToast('Failed to leave family.', 'danger');
        },
      });
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }
}
