import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

export class FormUrlEncodedInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.body instanceof URLSearchParams) {
      req = req.clone({
        body: req.body.toString(),
        headers: req.headers.set('Content-Type', 'application/x-www-form-urlencoded')
      });
    }
    return next.handle(req);
  }
}
