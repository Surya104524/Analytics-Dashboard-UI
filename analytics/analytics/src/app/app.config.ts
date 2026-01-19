import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { NgxEchartsModule } from "ngx-echarts";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      CommonModule,
      NgxEchartsModule.forRoot({
        echarts: () => import("echarts"),
      })
    ),
    provideRouter(routes),
    DatePipe,
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    provideAnimations(),
  ],
};
