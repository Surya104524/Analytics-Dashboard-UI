import { Routes } from "@angular/router";
import { DashboardUiComponent } from "../components/dashboard/dashboard-ui/dashboard-ui.component";

export const routes: Routes = [
  { path: "dashboard", component: DashboardUiComponent },
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "**", redirectTo: "dashboard", pathMatch: "full" },
];
