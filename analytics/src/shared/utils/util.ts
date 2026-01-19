import { TDashboardRes } from "../models/model";

export const INIT_DASHBOARD_RES: TDashboardRes = {
  summary: {
    totalLearners: 0,
    male: 0,
    female: 0,
    others: 0,
    activeLearners: 0,
    engagedLearners: 0,
  },
  courseProgress: [],
  passStats: {
    overallLearners: 0,
    assessmentTaken: 0,
    passed: 0,
    failed: 0,
  },
  assessmentCompletion: {
    completedPercent: 0,
    notCompletedPercent: 0,
  },
  gradeBreakdown: [],
  districtRanking: {
    rankBy: "",
    districts: [],
  },
};
