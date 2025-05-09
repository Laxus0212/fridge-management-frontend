import {Component, OnInit} from '@angular/core';
import {ToastController} from '@ionic/angular';
import {Family, FamilyMember, Invitation, UpdateUserReq,} from '../../openapi/generated-src';
import {AuthService} from '../../services/auth.service';
import {CacheService} from '../../services/cache.service';
import {CommonService} from '../../services/common.service';
import {AbstractPage} from '../abstract-page';

@Component({
  selector: 'app-family',
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss'],
})
export class FamilyComponent extends AbstractPage implements OnInit {
  family: Family | null = null;
  familyMembers: FamilyMember[] = [];
  inviteEmail: string = '';
  pendingInvite: Invitation | null = null;
  inviteEmailErrorText: string = '';

  constructor(
    authService: AuthService,
    cacheService: CacheService,
    private toastController: ToastController,
    commonService: CommonService
  ) {
    super(authService, cacheService, commonService);
  }

  override ngOnInit() {
    super.ngOnInit();
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

  loadFamilyData() {
    if (this.familyId) {
      this.cacheService.getFamilyData().subscribe(family => {
        if (family) {
          this.family = family;
          this.loadFamilyMembers();
        }
      });
    }
  }

  loadFamilyMembers() {
    if (this.familyId) {
      this.cacheService.getFamilyMembers().subscribe(members => {
        if (members.length > 0) {
          this.familyMembers = members;
        } else {
          this.cacheService.loadFamilyMembers(this.familyId); // Ha nincs adat a cache-ben, akkor lekérjük
        }
      });
    }
  }

  checkPendingInvites() {
    if (this.userId) {
      this.cacheService.getPendingInvites(this.userId).subscribe(invites => {
        this.pendingInvite = invites.length > 0 ? invites[0] : null;
      });
    }
  }

  createFamily() {
    const familyName = prompt('Enter family name:');
    if (familyName) {
      this.cacheService.createFamily(familyName, this.userId).subscribe({
        next: (family: Family) => {
          if (this.userId) {
            const updatedUser: UpdateUserReq = {
              userId: this.userId,
              familyId: family.familyId,
            };
            this.cacheService.updateUserFamily(this.userId, updatedUser).subscribe(
              {
                next: () => {
                  this.authService.setUserFamilyId(family.familyId);
                  this.familyId = family.familyId;
                  this.loadFamilyData();
                  this.commonService.presentToast('Family created successfully!', 'success');
                },
                error: (err) => this.commonService.presentToast(err.message, 'danger')
              }
            );
          }
        },
        error: () => this.commonService.presentToast('Failed to create family.', 'danger'),
      });
    }
  }

  inviteToFamily() {
    if (this.inviteEmail && this.validateEmail(this.inviteEmail)) {
      this.cacheService.inviteUserToFamily(this.familyId!, this.inviteEmail).subscribe({
        next: () => {
          this.commonService.presentToast('Invitation sent successfully!', 'success');
          this.inviteEmail = '';
        },
        error: () => this.commonService.presentToast('Failed to send invitation.', 'danger'),
      });
    }
  }

  acceptInvite() {
    if (this.pendingInvite) {
      this.cacheService.acceptInvite(this.pendingInvite.invitationId).subscribe({
        next: () => {
          this.familyId = this.pendingInvite?.familyId!;
          this.authService.setUserFamilyId(this.familyId);
          this.commonService.presentToast('Invitation accepted!', 'success');
          this.pendingInvite = null;
          this.loadFamilyData();
        },
        error: () => this.commonService.presentToast('Failed to accept invitation.', 'danger'),
      });
    }
  }

  declineInvite() {
    if (this.pendingInvite) {
      this.cacheService.declineInvite(this.pendingInvite.invitationId).subscribe({
        next: () => {
          this.commonService.presentToast('Invitation declined.', 'warning');
          this.pendingInvite = null;
        },
        error: () => this.commonService.presentToast('Failed to decline invitation.', 'danger'),
      });
    }
  }

  leaveFamily() {
    if (confirm('Are you sure you want to leave the family?') && this.userId && this.familyId) {
      this.cacheService.leaveFamily(this.familyId, this.userId).subscribe({
        next: () => {
          this.family = null;
          this.authService.clearUserFamilyId();
          this.commonService.presentToast('You have left the family.', 'warning');
        },
        error: () => this.commonService.presentToast('Failed to leave family.', 'danger'),
      });
    }
  }
}
