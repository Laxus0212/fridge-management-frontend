import {Injectable, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {CacheService} from '../services/cache.service';
import {CommonService} from '../services/common.service';

@Injectable()
export abstract class AbstractPage implements OnInit {
  userId: number | null = null;
  familyId: number | null = null;

  protected constructor(
    public readonly authService: AuthService,
    public readonly cacheService: CacheService,
    public readonly commonService: CommonService,
  ) {}

  public ngOnInit() {
    this.authService.userId$.subscribe(userId => {
      this.userId = userId;
    });

    this.authService.userFamilyId$.subscribe(userFamilyId => {
      this.familyId = userFamilyId;
    });
  }

}
