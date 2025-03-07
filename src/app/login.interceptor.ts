import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class LoginInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/users') ||
      req.url.includes('/gsi/button,')
      ) {
      const modifiedReq = req.clone({
        withCredentials: true,
      });
      return next.handle(modifiedReq);
    }

    return next.handle(req);
  }
}
