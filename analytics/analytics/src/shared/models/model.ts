export type TDashboardRes = {
  summary: {
    totalLearners: number;
    male: number;
    female: number;
    others: number;
    activeLearners: number;
    engagedLearners: number;
  };
  courseProgress: TCourseProgress[];
  passStats: {
    overallLearners: number;
    assessmentTaken: number;
    passed: number;
    failed: number;
  };
  assessmentCompletion: {
    completedPercent: number;
    notCompletedPercent: number;
  };
  gradeBreakdown: TGradeBreakdown[];
  districtRanking: {
    rankBy: string;
    districts: TDistrict[];
  };
};

export type TCourseProgress = {
  district: string;
  below: number;
  average: number;
  good: number;
};

export type TGradeBreakdown = {
  grade: "A" | "B" | "C" | "D" | "E";
  label:
    | "A - Grade (>80)"
    | "B - Grade (>60)"
    | "C - Grade (>50)"
    | "D - Grade (>30)"
    | "E - Grade (0)";
  percent: 60;
};

export type TDistrict = {
  district: string;
  rank: number;
  enrolled: number;
  male: number;
  female: number;
  others: number;
  passed: number;
  assessmentCompleted: number;
  completionRatePercent: number;
};
