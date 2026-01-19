import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TDashboardRes } from "../models/model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getYearWiseData(year: TYears) {
    const url = `assets/jsonResponses/dashboard_${year}.json`;
    return this.http.get<TDashboardRes>(url);
  }
}
export type TYears = "2024" | "2025";
