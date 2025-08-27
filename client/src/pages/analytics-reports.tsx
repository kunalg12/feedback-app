import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCourses } from "@/hooks/use-courses";
import { useCourseFeedbackResponses } from "@/hooks/use-feedback-forms";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { 
  BarChart3, 
  Star, 
  Users, 
  TrendingUp, 
  Download,
  Filter
} from "lucide-react";
import { calculateWeightedFeedback } from "@/lib/attendance-weight";
import type { FeedbackResponse } from "@shared/schema";

export default function AnalyticsReports() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: courses = [] } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Fall 2024");
  const [dateRange, setDateRange] = useState<string>("");
  
  const { data: feedbackResponses = [], isLoading: responsesLoading } = useCourseFeedbackResponses(selectedCourse === "all" ? "" : selectedCourse);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN' && user.role !== 'TEACHER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access Denied: Admin or Teacher access required</p>
        </div>
      </div>
    );
  }

  // Calculate analytics data
  const analytics = calculateWeightedFeedback(feedbackResponses);
  const responseRate = selectedCourse !== "all" ? 
    ((feedbackResponses.length / 50) * 100).toFixed(0) : // Assume 50 students per course
    "0";

  // Prepare data for charts
  const attendanceData = analytics.attendanceDistribution.map(item => ({
    range: item.range,
    count: item.count,
    avgScore: item.avgScore,
    weight: item.weight
  }));

  // Mock question analysis data
  const questionAnalysis = [
    {
      question: "Overall course quality",
      regularAvg: 4.2,
      weightedAvg: 4.0,
      responseCount: feedbackResponses.length,
      impact: -0.2
    },
    {
      question: "Instructor explanation clarity",
      regularAvg: 4.1,
      weightedAvg: 4.2,
      responseCount: feedbackResponses.length,
      impact: +0.1
    },
    {
      question: "Course workload appropriateness",
      regularAvg: 3.8,
      weightedAvg: 3.6,
      responseCount: feedbackResponses.length,
      impact: -0.2
    }
  ];

  const tableColumns = [
    { key: 'question' as const, header: 'Question' },
    { 
      key: 'regularAvg' as const, 
      header: 'Regular Average',
      render: (value: number) => value.toFixed(1)
    },
    { 
      key: 'weightedAvg' as const, 
      header: 'Weighted Average',
      render: (value: number) => value.toFixed(1)
    },
    { key: 'responseCount' as const, header: 'Responses' },
    { 
      key: 'impact' as const, 
      header: 'Impact',
      render: (value: number) => (
        <Badge 
          variant={value >= 0 ? "default" : "destructive"}
          className={value >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
        >
          {value > 0 ? '+' : ''}{value.toFixed(1)} {value >= 0 ? 'Higher' : 'Lower'}
        </Badge>
      )
    }
  ];

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    });
    // Implementation would generate and download a CSV/PDF report
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive feedback analysis with attendance-weighted insights</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                  <SelectTrigger data-testid="select-course-filter">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Period</label>
                <Select onValueChange={setSelectedPeriod} value={selectedPeriod}>
                  <SelectTrigger data-testid="select-period-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                    <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                    <SelectItem value="Summer 2024">Summer 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <Input 
                  type="date" 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  data-testid="input-date-range"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-apply-filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-responses">
                    {analytics.totalResponses}
                  </p>
                  <p className="text-sm text-gray-600">Total Responses</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-average-rating">
                    {analytics.averageScore.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-weighted-average">
                    {analytics.weightedAverage.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Weighted Average</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-response-rate">
                    {responseRate}%
                  </p>
                  <p className="text-sm text-gray-600">Response Rate</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Attendance Distribution Chart */}
          <div className="xl:col-span-2">
            <AttendanceChart 
              data={attendanceData}
              title="Attendance vs Feedback Weight Distribution"
              type="bar"
            />
          </div>

          {/* Attendance Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No attendance data available</p>
                  <p className="text-sm">Select a course to view attendance impact</p>
                </div>
              ) : (
                attendanceData.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{group.range} Attendance</p>
                      <p className="text-xs text-gray-500">{group.count} responses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{group.avgScore.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Avg Rating</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detailed Feedback Analysis</CardTitle>
              <Button 
                onClick={handleExportReport}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-export-report"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {responsesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : questionAnalysis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No feedback data available</p>
                <p className="text-sm">Select a course with feedback responses to view detailed analysis</p>
              </div>
            ) : (
              <DataTable
                data={questionAnalysis}
                columns={tableColumns}
                searchKey="question"
                pageSize={10}
                isLoading={responsesLoading}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
