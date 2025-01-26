import {Component, OnInit} from '@angular/core';
import {ToastController} from '@ionic/angular';
import {
  Family,
  FamilyMember,
  FamilyService,
  Invite,
  UpdateUserReq,
  User,
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
  pendingInvite: any = null; // Függőben lévő meghívó
  inviteEmailErrorText: string = '';
  userId?: number;
  familyId?: number;


  constructor(
    private familyService: FamilyService,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController
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

  // Családi adatok betöltése
  async loadFamilyData() {
    if (this.familyId) {
      this.familyService.getFamilyById(this.familyId).subscribe({
          next: (family: Family) => {
            this.family = family;
            this.loadFamilyMembers();
          },
          error: (error) => {
            this.showToast('Failed to load family data.', 'danger');
          }
        }
      );
    } else {
      this.showToast('Failed to load family data.', 'danger');
    }
  }

  // Családtagok betöltése
  async loadFamilyMembers() {
    if (this.familyId) {
      this.familyService.getFamilyMembers(this.familyId).subscribe({
          next: (members: FamilyMember[]) => {
            this.familyMembers = members;
          },
          error: (error) => {
            this.showToast('Failed to load family members.', 'danger');
          }
        }
      );
    } else {
      this.showToast('Failed to load family members.', 'danger');
    }
  }

// Függőben lévő meghívók lekérése
  async checkPendingInvites() {
    this.familyService.getPendingInvites().subscribe({
        next: (invites: Invite[]) => {
          this.pendingInvite = invites[0]; // Csak az első meghívót jelenítjük meg
        },
        error: (error) => {
          this.showToast('Failed to load pending invites.', 'danger');
        }
      }
    );
  }

  // Új család létrehozása
  async createFamily() {
    const familyName = prompt('Enter family name:');
    if (familyName) {
      this.familyService.createFamily({name: familyName}).subscribe({
          next: (family: Family) => {
            if (this.userId && this.familyId) {
              const updatedUser: UpdateUserReq = {
                userId: this.userId,
                familyId: family.familyId
              }
              this.userService.updateUserById(this.userId, updatedUser).subscribe();
              this.family = family;
              this.authService.setUserFamilyId(family.familyId);
              this.showToast('Family created successfully!', 'success');
            }else {
              this.showToast('Failed to create family.', 'danger');
            }
          },
          error: (error) => {
            this.showToast('Failed to create family.', 'danger');
          }
        }
      );
    }
  }

  // Meghívó küldése
  async inviteToFamily() {
    if (this.inviteEmail) {
      this.familyService.inviteUserToFamily(this.family.familyId, {email: this.inviteEmail}).subscribe({
          next: (response) => {
            this.showToast('Invitation sent successfully!', 'success');
            this.inviteEmail = '';
          },
          error: (error) => {
            this.showToast('Failed to send invitation.', 'danger');
          }
        }
      );
    }
  }

// Meghívó elfogadása
  async acceptInvite() {
    if (this.pendingInvite) {
      this.familyService.acceptInvite(this.pendingInvite.inviteId).subscribe({
          next: () => {
            this.pendingInvite = null;
            this.loadFamilyData(); // Frissítsd a családi adatokat
            this.showToast('Invitation accepted!', 'success');
          },
          error: (error) => {
            this.showToast('Failed to accept invitation.', 'danger');
          }
        }
      );
    }
  }

// Meghívó elutasítása
  async declineInvite() {
    if (this.pendingInvite) {
      this.familyService.declineInvite(this.pendingInvite.inviteId).subscribe({
          next: () => {
            this.pendingInvite = null;
            this.showToast('Invitation declined.', 'warning');
          },
          error: (error) => {
            this.showToast('Failed to decline invitation.', 'danger');
          }
        }
      );
    }
  }

  // Családból való kilépés
  async leaveFamily() {
    const isConfirmed = confirm('Are you sure you want to leave the family?');
    if (isConfirmed) {
      this.familyService.deleteFamily(this.family.familyId).subscribe({
          next: () => {
            this.family = null;
            this.authService.setUserFamilyId(-1);
            this.showToast('You have left the family.', 'warning');
          },
          error: (error) => {
            this.showToast('Failed to leave family.', 'danger');
          }
        }
      );
    }
  }

  // Toast üzenet megjelenítése
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
