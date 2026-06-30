import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// Punto de entrada del frontend Angular standalone: arranca AppComponent y
// registra los proveedores globales de HttpClient (para llamar a la API) y del
// router (para la navegación entre pantallas).
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
}).catch((error) => console.error(error));
