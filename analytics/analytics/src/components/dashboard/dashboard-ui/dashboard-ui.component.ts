import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { interval, Subject } from "rxjs";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { DatePipe, NgFor, NgIf, NgClass, DecimalPipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ApiService, TYears } from "../../../shared/services/api.service";
import { TDashboardRes } from "../../../shared/models/model";
import { INIT_DASHBOARD_RES } from "../../../shared/utils/util";
import { NgxEchartsModule } from "ngx-echarts";
import { OrdinalPipe } from "../../../shared/pipes/custom.pipe";

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);
@Component({
  selector: "app-dashboard-ui",
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgxEchartsModule,
    NgClass,
    DecimalPipe,
    OrdinalPipe,
  ],
  providers: [DatePipe],
  templateUrl: "./dashboard-ui.component.html",
  styleUrl: "./dashboard-ui.component.scss",
  standalone: true,
})
export class DashboardUiComponent implements AfterViewInit, OnDestroy {
  @ViewChild("courseProgress", { static: false })
  courseProgress!: ElementRef<HTMLDivElement>;
  @ViewChild("passPercentage", { static: false })
  passPercentage!: ElementRef<HTMLDivElement>;
  @ViewChild("assessmentScore", { static: false })
  assessmentScore!: ElementRef<HTMLDivElement>;
  @ViewChild("learnerDetails", { static: false })
  learnerDetails!: ElementRef<HTMLDivElement>;
  @ViewChild("districtRanking", { static: false })
  districtRanking!: ElementRef<HTMLDivElement>;

  isDarkTheme: boolean =
    localStorage.getItem("themeStatus") === "true" ? true : false;
  selectedYear: TYears = "2024";
  selectedDistrict: string = "All Districts";
  years: string[] = ["2024", "2025"];
  minDate: string = "01 Jan 2024";
  maxDate: string = "31 Dec 2024";
  selectedDate: string = `${this.minDate} - ${this.maxDate}`;
  selectActive: "Monthly" | "Quarterly" | null = null;

  yearWiseData: TDashboardRes = structuredClone(INIT_DASHBOARD_RES);
  constYearWiseData: TDashboardRes = structuredClone(INIT_DASHBOARD_RES);

  stats: { label: string; value: number; color: string }[] = [
    { label: "Total Learner Enrolled", value: 0, color: "#10b981" },
    { label: "♂ Male", value: 0, color: "#3b82f6" },
    { label: "♀ Female", value: 0, color: "#f59e0b" },
    { label: "Active", value: 0, color: "#ef4444" },
    { label: "Completed", value: 0, color: "#8b5cf6" },
  ];

  private destroy$ = new Subject<void>();
  private charts: echarts.ECharts[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly apiService: ApiService,
    private readonly datePipe: DatePipe,
  ) {}

  private getYearWiseData(isCallStatus: "init" | "change") {
    return this.apiService
      .getYearWiseData(this.selectedYear)
      .subscribe((res) => {
        this.constYearWiseData = res;
        this.yearWiseData = res;
        if (isCallStatus === "change") {
          this.updateAllChartsTheme();
        }
      });
  }

  ngAfterViewInit(): void {
    const themeStatus = localStorage.getItem("themeStatus");
    if (!themeStatus) {
      localStorage.setItem("themeStatus", "true");
    }
    this.isDarkTheme = themeStatus === "true" ? true : false;
    this.getYearWiseData("init");
    setTimeout(() => {
      this.initCharts();
    }, 200);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.charts.forEach((chart) => chart.dispose());
  }

  changeYear() {
    this.selectActive = null;
    this.minDate = `01 Jan ${this.selectedYear}`;
    this.maxDate = `31 Dec ${this.selectedYear}`;
    this.selectedDate = `${this.minDate} - ${this.maxDate}`;
    this.getYearWiseData("change");
  }
  changeDistrict() {
    this.yearWiseData.courseProgress = this.yearWiseData.courseProgress.filter(
      (course) => course.district === this.selectedDistrict,
    );
    this.yearWiseData.districtRanking.districts =
      this.yearWiseData.districtRanking.districts.filter(
        (course) => course.district === this.selectedDistrict,
      );
    this.updateAllChartsTheme();
  }
  selectRange(selectValue: "Monthly" | "Quarterly") {
    const fromDate = `01 Jan ${this.selectedYear}`;
    const toMonthlyDate = `31 Jan ${this.selectedYear}`;
    const toQuarterlyDate = `31 Mar ${this.selectedYear}`;
    const toDate = `31 Dec ${this.selectedYear}`;
    this.yearWiseData = structuredClone(this.constYearWiseData);
    if (this.selectActive === selectValue) {
      this.selectActive = null;
      this.selectedDate = `${fromDate} - ${toDate}`;
    } else {
      this.selectedDate = `${fromDate} -
        ${selectValue === "Monthly" ? toMonthlyDate : toQuarterlyDate}`;
      this.selectActive = selectValue;
      const summary = this.yearWiseData.summary;
      const months = selectValue === "Monthly" ? 12 : 4;
      summary.activeLearners = Math.round(summary.activeLearners / months);
      summary.engagedLearners = Math.round(summary.engagedLearners / months);
      summary.female = Math.round(summary.female / months);
      summary.male = Math.round(summary.male / months);
      summary.others = Math.round(summary.others / months);
      summary.totalLearners = Math.round(summary.totalLearners / months);
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem("themeStatus", this.isDarkTheme ? "true" : "false");
    this.updateAllChartsTheme();
  }

  private initCharts(): void {
    this.charts = [
      this.initChart(this.courseProgress, this.getCourseProgressOption()),
      this.initChart(this.passPercentage, this.getPassPercentageOption()),
      this.initChart(this.assessmentScore, this.getAssessmentScoreOption()),
      this.initChart(this.learnerDetails, this.getLearnerDetailsOption()),
      this.initChart(this.districtRanking, this.getDistrictRankingOption()),
    ];
  }

  private initChart(
    container: ElementRef<HTMLDivElement>,
    option: echarts.EChartsCoreOption,
  ): echarts.ECharts {
    const chart = echarts.init(container.nativeElement);
    chart.setOption(option);
    return chart;
  }

  private getCurrentTheme(): any {
    return this.isDarkTheme ? this.darkTheme : this.lightTheme;
  }

  private darkTheme = {
    backgroundColor: "transparent",
    color: [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
    ],
    textStyle: {
      color: "#e2e8f0",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    },
  };

  private lightTheme = {
    backgroundColor: "transparent",
    color: [
      "#2563eb",
      "#059669",
      "#d97706",
      "#dc2626",
      "#7c3aed",
      "#0891b2",
      "#65a30d",
    ],
    textStyle: {
      color: "#1e293b",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    },
  };

  private updateAllChartsTheme(): void {
    this.charts.forEach((chart, index) => {
      const options = [
        this.getCourseProgressOption(),
        this.getPassPercentageOption(),
        this.getAssessmentScoreOption(),
        this.getLearnerDetailsOption(),
        this.getDistrictRankingOption(),
      ];
      chart.setOption(options[index] as any, true);
    });
  }

  private getCourseProgressOption(): echarts.EChartsCoreOption {
    const districts: string[] = [];
    const goodValues: number[] = [];
    const averageValues: number[] = [];
    const belowValues: number[] = [];

    this.yearWiseData.courseProgress.forEach((course) => {
      districts.push(course.district);
      goodValues.push(course.good);
      averageValues.push(course.average);
      belowValues.push(course.below);
    });

    const getColor = (value: number) => {
      if (value < 40) return "#ff4d4f";
      if (value < 70) return "#52c41a";
      return "#1677ff";
    };
    return {
      theme: this.getCurrentTheme(),
      legend: {
        data: ["Below", "Average", "Good"],
        right: "0%",
        top: "0%",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const value = params[0].value;
          return `${params[0].name}<br/>Max Value: <b>${value}</b>`;
        },
      },
      grid: { left: "10%", right: "10%", bottom: "15%", top: "10%" },
      xAxis: {
        type: "category",
        data: districts,
        axisLabel: {
          interval: 0,
          fontSize: 8,
        },
      },
      yAxis: { type: "value", min: 0, max: 100, interval: 20 },
      series: [
        {
          name: "Good",
          type: "bar",
          data: goodValues,
          itemStyle: {
            color: (params: any) => getColor(params.value),
          },
          barMaxWidth: 40,
        },
        {
          name: "Average",
          type: "bar",
          data: averageValues,
          itemStyle: {
            color: (params: any) => getColor(params.value),
          },
          barMaxWidth: 40,
        },
        {
          name: "Below",
          type: "bar",
          data: belowValues,
          itemStyle: {
            color: (params: any) => getColor(params.value),
          },
          barMaxWidth: 40,
        },
      ],
    };
  }

  private getPassPercentageOption(): echarts.EChartsCoreOption {
    const stats = this.yearWiseData.passStats;

    const total = stats.overallLearners;

    const categories = [
      "Overall Learners",
      "Assessment taken",
      "Passed",
      "Failed",
    ];

    const values = [
      100,
      Math.round((stats.assessmentTaken / total) * 100),
      Math.round((stats.passed / total) * 100),
      Math.round((stats.failed / total) * 100),
    ];

    const actualCounts = [
      stats.overallLearners,
      stats.assessmentTaken,
      stats.passed,
      stats.failed,
    ];

    const colors = ["#7EC3F7", "#3EC6D8", "#00C897", "#FF8A8A"];

    return {
      theme: this.getCurrentTheme(),
      grid: {
        left: "15%",
        right: "10%",
        top: "10%",
        bottom: "15%",
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const i = params[0].dataIndex;
          return `
          ${categories[i]}<br/>
          Count: <b>${actualCounts[i].toLocaleString()}</b><br/>
          Percentage: <b>${values[i]}%</b>
        `;
        },
      },

      xAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },

      yAxis: {
        type: "category",
        inverse: true,
        data: categories,
        axisLabel: {
          show: false,
        },
      },

      series: [
        {
          type: "bar",
          data: values,
          barWidth: 22,
          itemStyle: { color: "transparent" },
          label: {
            show: true,
            position: "left",
            formatter: (p: any) => actualCounts[p.dataIndex].toLocaleString(),
            color: "#000",
            fontWeight: "bold",
          },
          labelLayout: {
            align: "right",
            verticalAlign: "center",
            moveOverlap: "shiftY",
          },
        },
        {
          type: "bar",
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i] },
            label: {
              show: true,
              position: "insideLeft",
              formatter: categories[i],
              fontWeight: "bold",
              padding: [0, 0, 0, 8],
              color: "#000",
            },
          })),
          barWidth: 22,
        },
      ],
    };
  }

  private getAssessmentScoreOption(): echarts.EChartsCoreOption {
    const percent = this.yearWiseData.assessmentCompletion;
    return {
      theme: this.getCurrentTheme(),
      title: { text: "All Districts", top: "50%", textVerticalAlign: "middle" },
      tooltip: {
        trigger: "item",
      },

      series: [
        {
          name: "Score",
          type: "pie",
          radius: ["60%", "85%"],
          label: {
            show: true,
            formatter: "{b}: {c}%",
            fontSize: 12,
          },
          labelLine: {
            show: true,
          },
          data: [
            {
              value: percent.completedPercent,
              name: "Assessment Completed",
            },
            {
              value: percent.notCompletedPercent,
              name: "Assessment Not Completed",
            },
          ],
        },
      ],
    };
  }

  private getLearnerDetailsOption(): echarts.EChartsCoreOption {
    const gradeData = this.yearWiseData.gradeBreakdown;
    return {
      theme: this.getCurrentTheme(),
      tooltip: { trigger: "item" },
      legend: { top: 50, right: 10, orient: "vertical", itemGap: 30 },
      series: [
        {
          name: "Grades",
          type: "pie",
          radius: "65%",
          data: gradeData.map((g) => ({
            value: g.percent,
            name: g.label,
          })),
        },
      ],
    };
  }
  private getDistrictRankingOption(): echarts.EChartsCoreOption {
    const data = this.yearWiseData.districtRanking.districts;

    const districts = data.map((d: any) => `${d.district}\nRank - ${d.rank}`);

    return {
      theme: this.getCurrentTheme(),
      legend: {
        top: 10,
        right: 10,
        itemGap: 20,
        data: ["Male", "Female", "Others", "Passed", "Assessment completed"],
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any[]) => {
          const d = data[params[0].dataIndex];
          return `
          <b>${d.district}</b><br/>
          Enrolment<br/>
          Male : ${d.male.toLocaleString()}<br/>
          Female : ${d.female.toLocaleString()}<br/>
          Others : ${d.others.toLocaleString()}<br/><br/>
          Pass% : ${Math.round((d.passed / d.enrolled) * 100)}%<br/>
          Course completion% : ${d.completionRatePercent}%
        `;
        },
      },

      grid: {
        left: "6%",
        right: "6%",
        bottom: "15%",
        top: "15%",
      },

      xAxis: {
        type: "category",
        data: districts,
        axisLabel: {
          interval: 0,
          rotate: 35,
        },
      },

      yAxis: [
        {
          type: "value",
          name: "Number of users",
          axisLabel: {
            formatter: (v: number) => v.toLocaleString(),
          },
        },
        {
          type: "value",
          name: "Pass/Completion %",
          min: 0,
          max: 100,
          axisLabel: {
            formatter: "{value}%",
          },
        },
      ],

      series: [
        /* Enrollment Stack */
        {
          name: "Male",
          type: "bar",
          stack: "enrollment",
          data: data.map((d: any) => d.male),
        },
        {
          name: "Female",
          type: "bar",
          stack: "enrollment",
          data: data.map((d: any) => d.female),
        },
        {
          name: "Others",
          type: "bar",
          stack: "enrollment",
          data: data.map((d: any) => d.others),
        },

        /* Passed */
        {
          name: "Passed",
          type: "bar",
          data: data.map((d: any) => d.passed),
        },

        /* Assessment Completed */
        {
          name: "Assessment completed",
          type: "bar",
          data: data.map((d: any) => d.assessmentCompleted),
        },
      ],
    };
  }
}
