import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

const MetricCard = ({ title, value, icon: Icon, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export const Analytics = () => {
  const metrics = [
    {
      title: 'Total Calls',
      value: '156',
      icon: Phone,
      trend: '+12% from last month'
    },
    {
      title: 'Appointments Booked',
      value: '23',
      icon: Calendar,
      trend: '+8% from last month'
    },
    {
      title: 'Messages Sent',
      value: '89',
      icon: MessageSquare,
      trend: '+15% from last month'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Overview</h2>
        <p className="text-muted-foreground">
          Track your call performance and engagement metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Additional Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-sm text-muted-foreground">14.7%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '14.7%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Call Duration</span>
              <span className="text-sm text-muted-foreground">3m 42s</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '62%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};