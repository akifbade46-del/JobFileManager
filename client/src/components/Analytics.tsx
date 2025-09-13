import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, FileText, Users, Calendar } from "lucide-react";

interface AnalyticsData {
  totalJobs: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  monthlyStats: Array<{
    month: string;
    jobs: number;
    profit: number;
    revenue: number;
  }>;
  topShippers: Array<{
    name: string;
    jobs: number;
    profit: number;
  }>;
  topConsignees: Array<{
    name: string;
    jobs: number;
    profit: number;
  }>;
  statusBreakdown: {
    pending: number;
    checked: number;
    approved: number;
    rejected: number;
  };
}

interface AnalyticsProps {
  onClose: () => void;
}

export default function Analytics({ onClose }: AnalyticsProps) {
  const [dateType, setDateType] = useState('billing');
  const [timeframe, setTimeframe] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Mock data - todo: replace with real data from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData({
        totalJobs: 156,
        totalRevenue: 485600.50,
        totalCost: 368200.25,
        totalProfit: 117400.25,
        monthlyStats: [
          { month: '2024-01', jobs: 24, profit: 18500.00, revenue: 62400.00 },
          { month: '2024-02', jobs: 31, profit: 22100.50, revenue: 78900.50 },
          { month: '2024-03', jobs: 28, profit: 19800.75, revenue: 71200.00 },
          { month: '2024-04', jobs: 35, profit: 26200.00, revenue: 89500.00 },
          { month: '2024-05', jobs: 38, profit: 30800.00, revenue: 95600.00 }
        ],
        topShippers: [
          { name: 'ABC Shipping Co.', jobs: 24, profit: 32500.00 },
          { name: 'Global Trade Inc.', jobs: 18, profit: 28900.50 },
          { name: 'Express Cargo', jobs: 15, profit: 19200.25 },
          { name: 'Ocean Freight Co.', jobs: 12, profit: 16800.75 },
          { name: 'Swift Logistics', jobs: 10, profit: 12400.00 }
        ],
        topConsignees: [
          { name: 'XYZ Logistics', jobs: 22, profit: 29800.00 },
          { name: 'Fast Delivery Ltd.', jobs: 19, profit: 24600.50 },
          { name: 'Quick Solutions', jobs: 16, profit: 21300.25 },
          { name: 'Mountain Logistics', jobs: 13, profit: 18900.75 },
          { name: 'City Express', jobs: 11, profit: 15200.00 }
        ],
        statusBreakdown: {
          pending: 23,
          checked: 18,
          approved: 98,
          rejected: 17
        }
      });
    }, 500);
  }, [dateType, timeframe]);

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const profitMargin = ((analyticsData.totalProfit / analyticsData.totalRevenue) * 100).toFixed(1);
  const avgProfitPerJob = (analyticsData.totalProfit / analyticsData.totalJobs).toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          
          <div className="flex gap-2">
            <Select value={dateType} onValueChange={setDateType}>
              <SelectTrigger data-testid="select-date-type" className="w-40">
                <SelectValue placeholder="Date Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing Date</SelectItem>
                <SelectItem value="opening">Opening Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger data-testid="select-timeframe" className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              data-testid="button-close-analytics"
              onClick={onClose}
              variant="outline"
            >
              Back to Main
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                  <p className="text-3xl font-bold" data-testid="text-total-jobs">
                    {analyticsData.totalJobs}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-total-revenue">
                    ${analyticsData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-total-profit">
                    ${analyticsData.totalProfit.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Badge className="text-xs">
                  {profitMargin}% margin
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Profit/Job</p>
                  <p className="text-3xl font-bold text-purple-600" data-testid="text-avg-profit">
                    ${avgProfitPerJob}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{analyticsData.statusBreakdown.pending}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analyticsData.statusBreakdown.checked}</div>
                <div className="text-sm text-blue-700">Checked</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analyticsData.statusBreakdown.approved}</div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analyticsData.statusBreakdown.rejected}</div>
                <div className="text-sm text-red-700">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.monthlyStats.map((month) => {
                const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const avgProfitMonth = (month.profit / month.jobs).toFixed(2);
                return (
                  <div key={month.month} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{monthName}</h4>
                      <div className="text-sm text-muted-foreground">
                        {month.jobs} jobs • Avg profit: ${avgProfitMonth}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${month.profit.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">${month.revenue.toLocaleString()} revenue</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Shippers by Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topShippers.map((shipper, index) => (
                  <div key={shipper.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{shipper.name}</div>
                        <div className="text-sm text-muted-foreground">{shipper.jobs} jobs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${shipper.profit.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Consignees by Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topConsignees.map((consignee, index) => (
                  <div key={consignee.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{consignee.name}</div>
                        <div className="text-sm text-muted-foreground">{consignee.jobs} jobs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${consignee.profit.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}