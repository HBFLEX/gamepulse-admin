import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        errorMessage = error.error?.message || `Server Error: ${error.status} - ${error.statusText}`;
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => ({ ...error, message: errorMessage }));
    })
  );
};
