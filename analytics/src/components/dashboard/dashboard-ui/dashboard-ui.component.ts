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
  selectedDistrict: string = "All District";
  years: string[] = ["2024", "2025"];
  districts: string[] = [
    "All District",
    "Ariyulur",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Karur",
    "Madurai",
  ];
  minDate: string = "01 Jan, 2024";
  maxDate: string = "31 Dec 2024";
  selectedDate: string = `${this.minDate} - ${this.maxDate}`;
  selectActive: "Monthly" | "Quarterly" | null = null;
  rankBy: string = "Enrollment";

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
        this.yearWiseData = structuredClone(res);
        this.applyRankBy();
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
    }, 1000);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.charts.forEach((chart) => chart.dispose());
  }

  changeYear() {
    this.selectActive = null;
    this.minDate = `01 Jan, ${this.selectedYear}`;
    this.maxDate = `31 Dec ${this.selectedYear}`;
    this.selectedDate = `${this.minDate} - ${this.maxDate}`;
    this.getYearWiseData("change");
  }
  changeDistrict() {
    this.yearWiseData = structuredClone(this.constYearWiseData);
    if (this.selectedDistrict !== "All District") {
      this.yearWiseData.courseProgress =
        this.yearWiseData.courseProgress.filter(
          (course) => course.district === this.selectedDistrict,
        );
      this.yearWiseData.districtRanking.districts =
        this.yearWiseData.districtRanking.districts.filter(
          (course) => course.district === this.selectedDistrict,
        );
    }
    this.applyRankBy();
    this.updateAllChartsTheme();
  }
  changeRankBy() {
    this.applyRankBy();
    this.updateAllChartsTheme();
  }
  private applyRankBy() {
    const districts = [...this.yearWiseData.districtRanking.districts];
    if (this.rankBy === "Enrollment") {
      districts.sort((a, b) => b.enrolled - a.enrolled);
    } else if (this.rankBy === "Pass %") {
      districts.sort((a, b) => {
        const aPass = (a.passed / a.enrolled) * 100;
        const bPass = (b.passed / b.enrolled) * 100;
        return bPass - aPass;
      });
    }
    districts.forEach((d, index) => {
      d.rank = index + 1;
    });
    this.yearWiseData.districtRanking.districts = districts;
  }
  selectRange(selectValue: "Monthly" | "Quarterly") {
    const fromDate = `01 Jan, ${this.selectedYear}`;
    const toMonthlyDate = `31 Jan ${this.selectedYear}`;
    const toQuarterlyDate = `31 Mar ${this.selectedYear}`;
    const toDate = `31 Dec ${this.selectedYear}`;
    this.yearWiseData = structuredClone(this.constYearWiseData);
    if (this.selectActive === selectValue) {
      this.selectActive = null;
      this.selectedDate = `${fromDate} - ${toDate}`;
    } else {
      this.selectedDate = `${fromDate} - ${selectValue === "Monthly" ? toMonthlyDate : toQuarterlyDate}`;
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
    this.updateAllChartsTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem("themeStatus", this.isDarkTheme ? "true" : "false");
    if(this.isDarkTheme){
      this.initCharts();
    } else{
      setTimeout(()=>{
        this.initCharts();
      },200)
    }
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
    const values: number[] = [];
    const barColors: string[] = [];

    this.yearWiseData.courseProgress.forEach((course) => {
      districts.push(course.district);

      const value = course.good;
      values.push(value);

      if (value < 40) {
        barColors.push("#FF6B9D");
      } else if (value < 70) {
        barColors.push("#4ECDC4");
      } else {
        barColors.push("#7EC3F7");
      }
    });

    return {
      theme: this.isDarkTheme ? "#fff" : "#000",
      legend: {
        data: ["Below", "Average", "Good"],
        right: "0%",
        top: "0%",
        itemGap: 20,
        textStyle: {
          color: this.isDarkTheme ? "#fff" : "#000",
          fontSize: 12,
        },
        selected: {
          Below: false,
          Average: false,
          Good: true,
        },
        itemWidth: 10,
        itemHeight: 10,
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const course = this.yearWiseData.courseProgress[index];

          const maxType =
            course.good >= course.average && course.good >= course.below
              ? "Good"
              : course.average >= course.below
                ? "Average"
                : "Below";

          return `
      <b>${course.district}</b><br/>
      Good: ${course.good}%<br/>
      Average: ${course.average}%<br/>
      Below: ${course.below}%<br/>
      <b>Highest: ${maxType}</b>
    `;
        },
      },

      grid: { left: "10%", right: "10%", bottom: "15%", top: "15%" },
      xAxis: {
        type: "category",
        data: districts,
        axisLabel: {
          interval: 0,
          fontSize: 10,
          color: this.isDarkTheme ? "#fff" : "#000",
          rotate: 0,
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 10,
        name: "Course Progress %",
        nameLocation: "middle",
        nameGap: 50,
        nameTextStyle: {
          color: this.isDarkTheme ? "#fff" : "#000",
          fontSize: 12,
        },
        axisLabel: {
          color: this.isDarkTheme ? "#fff" : "#000",
          formatter: "{value}",
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          },
        },
        splitLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        },
      },
      series: [
        {
          name: "Below",
          type: "bar",
          stack: "progress",
          data: values,
          itemStyle: {
            color: (params: any) => barColors[params.dataIndex],
          },
          barMaxWidth: 45,
        },
        {
          name: "Average",
          type: "bar",
          stack: "progress",
          data: values,
          itemStyle: {
            color: (params: any) => barColors[params.dataIndex],
          },
          barMaxWidth: 45,
        },
        {
          name: "Good",
          type: "bar",
          stack: "progress",
          data: values,
          itemStyle: {
            color: (params: any) => barColors[params.dataIndex],
          },
          barMaxWidth: 45,
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

    const colors = ["#7EC3F7", "#3EC6D8", "#10B981", "#FF6B9D"];
    const theme = this.getCurrentTheme();

    return {
      theme: theme,
      grid: {
        left: "20%",
        right: "10%",
        top: "10%",
        bottom: "10%",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: this.isDarkTheme
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.95)",
        textStyle: {
          color: theme.textStyle.color,
        },
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
        interval: 20,
        name: "Performance",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme.textStyle.color,
          fontSize: 12,
        },
        axisLabel: {
          formatter: "{value}%",
          color: theme.textStyle.color,
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          },
        },
        splitLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: categories,
        axisLabel: {
          show: true,
          color: theme.textStyle.color,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          },
        },
      },
      series: [
        {
          type: "bar",
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i] },
            label: {
              show: true,
              position: "right",
              formatter: (p: any) =>
                `${actualCounts[p.dataIndex].toLocaleString()}`,
              color: theme.textStyle.color,
              fontWeight: "bold",
              fontSize: 12,
            },
          })),
          barWidth: 30,
        },
      ],
    };
  }

  private getAssessmentScoreOption(): echarts.EChartsCoreOption {
    const percent = this.yearWiseData.assessmentCompletion;
    const theme = this.getCurrentTheme();
    return {
      theme: theme,
      title: {
        text: "All Districts",
        left: "center",
        top: "center",
        textStyle: {
          color: theme.textStyle.color,
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: this.isDarkTheme
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.95)",
        textStyle: {
          color: theme.textStyle.color,
        },
        formatter: "{b}: {c}%",
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: "Score",
          type: "pie",
          radius: ["60%", "85%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: "{b}\n{c}%",
            fontSize: 12,
            color: theme.textStyle.color,
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: theme.textStyle.color,
            },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          data: [
            {
              value: percent.completedPercent,
              name: "Assessment completed",
              itemStyle: {
                color: "#7EC3F7",
              },
            },
            {
              value: percent.notCompletedPercent,
              name: "Assessment not completed",
              itemStyle: {
                color: "#F59E0B",
              },
            },
          ],
        },
      ],
    };
  }

  private getLearnerDetailsOption(): echarts.EChartsCoreOption {
    const gradeData = this.yearWiseData.gradeBreakdown;
    const theme = this.getCurrentTheme();
    const gradeColors: { [key: string]: string } = {
      "A - Grade (>80)": "#7EC3F7",
      "B - Grade (>60)": "#4ECDC4",
      "C - Grade (>50)": "#F59E0B",
      "D - Grade (>30)": "#FF6B9D",
      "E - Grade (0)": "#D3D3D3",
    };
    return {
      theme: theme,
      tooltip: {
        trigger: "item",
        backgroundColor: this.isDarkTheme
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.95)",
        textStyle: {
          color: theme.textStyle.color,
        },
        formatter: "{b}: {c}%",
      },
      legend: {
        top: "10%",
        right: "5%",
        orient: "vertical",
        itemGap: 15,
        textStyle: {
          color: theme.textStyle.color,
          fontSize: 12,
        },
        itemWidth: 12,
        itemHeight: 12,
        formatter: (name: string) => {
          const item = gradeData.find((g) => g.label === name);
          return `${item?.percent || 0}% ${name}`;
        },
      },
      series: [
        {
          name: "Grades",
          type: "pie",
          radius: "65%",
          center: ["35%", "55%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: "{c}%",
            fontSize: 11,
            color: theme.textStyle.color,
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          data: gradeData.map((g) => ({
            value: g.percent,
            name: g.label,
            itemStyle: {
              color: gradeColors[g.label] || "#7EC3F7",
            },
          })),
        },
      ],
    };
  }
  private getDistrictRankingOption(): echarts.EChartsCoreOption {
    const data = this.yearWiseData.districtRanking.districts;
    const theme = this.getCurrentTheme();

    const districts = data.map((d: any) => `${d.district}\nRank ${d.rank}`);

    return {
      theme: theme,
      legend: {
        top: 10,
        right: 10,
        itemGap: 15,
        textStyle: {
          color: theme.textStyle.color,
          fontSize: 11,
        },
        itemWidth: 10,
        itemHeight: 10,
        data: ["Male", "Female", "Others", "Passed", "Assessment completed"],
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: this.isDarkTheme
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(255, 255, 255, 0.95)",
        textStyle: {
          color: theme.textStyle.color,
        },
        formatter: (params: any[]) => {
          const d = data[params[0].dataIndex];
          const passPercent = Math.round((d.passed / d.enrolled) * 100);
          return `
          <b>${d.district}</b><br/>
          Enrolment<br/>
          Male: ${d.male.toLocaleString()}<br/>
          Female: ${d.female.toLocaleString()}<br/>
          Others: ${d.others.toLocaleString()}<br/><br/>
          Pass%: ${passPercent}% Passed<br/>
          Course completion%: ${d.completionRatePercent}% Course Completed
        `;
        },
      },
      grid: {
        left: "8%",
        right: "8%",
        bottom: "20%",
        top: "18%",
      },
      xAxis: {
        type: "category",
        data: districts,
        name: "Top 10 Districts",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme.textStyle.color,
          fontSize: 12,
        },
        axisLabel: {
          interval: 0,
          rotate: 35,
          color: theme.textStyle.color,
          fontSize: 10,
          lineHeight: 16,
        },
        axisLine: {
          lineStyle: {
            color: this.isDarkTheme
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          },
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Number of users",
          nameLocation: "middle",
          nameGap: 50,
          min: 0,
          max: 25000,
          interval: 2500,
          nameTextStyle: {
            color: theme.textStyle.color,
            fontSize: 12,
          },
          axisLabel: {
            formatter: (v: number) => v.toLocaleString(),
            color: theme.textStyle.color,
          },
          axisLine: {
            lineStyle: {
              color: this.isDarkTheme
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
            },
          },
          splitLine: {
            lineStyle: {
              color: this.isDarkTheme
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        {
          type: "value",
          name: "Pass/completion %",
          min: 0,
          max: 100,
          interval: 10,
          nameLocation: "middle",
          nameGap: 50,
          nameTextStyle: {
            color: theme.textStyle.color,
            fontSize: 12,
          },
          axisLabel: {
            formatter: "{value}%",
            color: theme.textStyle.color,
          },
          axisLine: {
            lineStyle: {
              color: this.isDarkTheme
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      ],
      series: [
        {
          name: "Male",
          type: "bar",
          yAxisIndex: 0,
          stack: "enrollment",
          data: data.map((d: any) => d.male),
          itemStyle: {
            color: "#3B82F6",
          },
        },
        {
          name: "Female",
          type: "bar",
          yAxisIndex: 0,
          stack: "enrollment",
          data: data.map((d: any) => d.female),
          itemStyle: {
            color: "#EC4899",
          },
        },
        {
          name: "Others",
          type: "bar",
          yAxisIndex: 0,
          stack: "enrollment",
          data: data.map((d: any) => d.others),
          itemStyle: {
            color: "#8B5CF6",
          },
        },
        {
          name: "Passed",
          type: "bar",
          yAxisIndex: 1,
          data: data.map((d: any) => Math.round((d.passed / d.enrolled) * 100)),
          itemStyle: {
            color: "#10B981",
          },
        },
        {
          name: "Assessment completed",
          type: "bar",
          yAxisIndex: 1,
          data: data.map((d: any) => d.completionRatePercent),
          itemStyle: {
            color: "#F59E0B",
          },
        },
      ],
    };
  }
}
