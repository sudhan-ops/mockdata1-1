import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AttendanceEvent, DailyAttendanceRecord, DailyAttendanceStatus, User, LeaveRequest, Holiday, AttendanceSettings, OnboardingData, Organization } from '../../types';
import { format, getDaysInMonth, addDays, startOfToday, endOfToday, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Loader2, Download, Users, UserCheck, UserX, Clock, BarChart3, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { DateRangePicker, type Range, type RangeKeyDict } from 'react-date-range';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import DatePicker from '../../components/ui/DatePicker';
import Toast from '../../components/ui/Toast';
import Input from '../../components/ui/Input';
import StatCard from '../../components/ui/StatCard';
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    DoughnutController,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

// Register the necessary components for Chart.js to work in a tree-shaken environment
Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    DoughnutController,
    ArcElement,
    Tooltip,
    Legend,
    Filler
);


// --- Date Helper Functions ---
const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const getEachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
    const dates = [];
    const currentDate = new Date(interval.start);
    const endDate = new Date(interval.end);
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};


// --- Reusable Dashboard Components ---
const ChartContainer: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-card p-6 rounded-xl shadow-card col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex items-center mb-4">
            <Icon className="h-5 w-5 mr-3 text-muted" />
            <h3 className="font-semibold text-primary-text">{title}</h3>
        </div>
        <div className="h-60 relative">{children}</div>
    </div>
);

// --- New Chart.js based components ---

const AttendanceTrendChart: React.FC<{ data: { labels: string[], present: number[], absent: number[] } }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [
                            {
                                label: 'Present',
                                data: data.present,
                                backgroundColor: '#005D22',
                                borderColor: '#004218',
                                borderWidth: 1,
                                borderRadius: 4,
                            },
                            {
                                label: 'Absent',
                                data: data.absent,
                                backgroundColor: '#EF4444',
                                borderColor: '#DC2626',
                                borderWidth: 1,
                                borderRadius: 4,
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' } },
                            x: { 
                                grid: { display: false },
                                ticks: {
                                    maxRotation: 0,
                                    minRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: 7,
                                }
                            }
                        },
                        plugins: { 
                            legend: {
                                display: true,
                                position: 'bottom',
                                align: 'center',
                                labels: {
                                    usePointStyle: true,
                                    pointStyle: 'rectRounded',
                                    boxWidth: 12,
                                    padding: 20,
                                    font: {
                                        family: "'Manrope', sans-serif",
                                        size: 12,
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: '#0F172A',
                                titleFont: { family: "'Manrope', sans-serif" },
                                bodyFont: { family: "'Manrope', sans-serif" },
                                cornerRadius: 8,
                                padding: 10,
                                displayColors: true,
                                boxPadding: 4,
                            }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-grow relative">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const ProductivityChart: React.FC<{ data: { labels: string[], hours: number[] } }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(0, 93, 34, 0.4)');
                gradient.addColorStop(1, 'rgba(0, 93, 34, 0)');
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Average Hours Worked',
                            data: data.hours,
                            borderColor: '#005D22',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#005D22',
                            pointRadius: 0,
                            pointHoverRadius: 5,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                             y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' } },
                             x: { 
                                grid: { display: false },
                                ticks: {
                                    maxRotation: 0,
                                    minRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: 7,
                                }
                            }
                        },
                        plugins: { 
                            legend: {
                                display: true,
                                position: 'bottom',
                                align: 'center',
                                labels: {
                                    usePointStyle: true,
                                    pointStyle: 'rectRounded',
                                    boxWidth: 12,
                                    padding: 20,
                                    font: {
                                        family: "'Manrope', sans-serif",
                                        size: 12,
                                    }
                                }
                            },
                             tooltip: {
                                backgroundColor: '#0F172A',
                                titleFont: { family: "'Manrope', sans-serif" },
                                bodyFont: { family: "'Manrope', sans-serif" },
                                cornerRadius: 8,
                                padding: 10,
                                displayColors: true,
                                boxPadding: 4,
                            }
                        }
                    }
                });
            }
        }
    }, [data]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-grow relative">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const SiteAttendanceChart: React.FC<{ data: { labels: string[], rates: number[] } }> = ({ data }) => {
     const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Attendance Rate',
                            data: data.rates,
                            backgroundColor: [
                                '#005D22', '#059669', '#10B981', '#34D399', '#6EE7B7', 
                                '#004218', '#047857', '#065F46', '#A7F3D0'
                            ],
                            borderColor: '#F9FAFB',
                            borderWidth: 2,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    boxWidth: 12,
                                    padding: 15,
                                    font: {
                                        family: "'Manrope', sans-serif"
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: '#0F172A',
                                titleFont: { family: "'Manrope', sans-serif" },
                                bodyFont: { family: "'Manrope', sans-serif" },
                                cornerRadius: 8,
                                padding: 10,
                                displayColors: true,
                                boxPadding: 4,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed !== null) {
                                            label += context.parsed.toFixed(2) + '%';
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }, [data]);

    return <canvas ref={chartRef} style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'}}></canvas>;
};


// --- Data Processing Logic ---
const generateAttendanceRecords = (
    startDate: Date,
    endDate: Date,
    events: AttendanceEvent[],
    approvedLeaves: LeaveRequest[],
    holidays: Holiday[],
    attendanceSettings: AttendanceSettings
): DailyAttendanceRecord[] => {
    const interval = { start: startDate, end: endDate };
    const dateRange = getEachDayOfInterval(interval);
    
    return dateRange.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dayOfWeek = date.getDay();

        const approvedLeave = approvedLeaves.find(leave => {
            const leaveStart = new Date(leave.startDate.replace(/-/g, '/'));
            const leaveEnd = getEndOfDay(new Date(leave.endDate.replace(/-/g, '/')));
            const currentDate = new Date(date);
            currentDate.setHours(0,0,0,0);
            leaveStart.setHours(0,0,0,0);
            return currentDate >= leaveStart && currentDate <= leaveEnd;
        });
        if (approvedLeave) {
            const status = approvedLeave.dayOption === 'half' ? 'On Leave (Half)' : 'On Leave (Full)';
            return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status };
        }

        const isHoliday = holidays.find(h => h.date === dateString);
        if (isHoliday) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Holiday' };
        if (dayOfWeek === 0) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Weekend' };
        
        const dayEvents = events.filter(e => format(new Date(e.timestamp), 'yyyy-MM-dd') === dateString);
        const checkIns = dayEvents.filter(e => e.type === 'check-in').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const checkOuts = dayEvents.filter(e => e.type === 'check-out').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (checkIns.length === 0) return { date: dateString, day: format(date, 'EEEE'), checkIn: null, checkOut: null, duration: null, status: 'Absent' };

        const firstCheckIn = new Date(checkIns[0].timestamp);
        const lastCheckOut = checkOuts.length > 0 ? new Date(checkOuts[checkOuts.length - 1].timestamp) : null;
        
        if (!lastCheckOut) return { date: dateString, day: format(date, 'EEEE'), checkIn: format(firstCheckIn, 'HH:mm'), checkOut: null, duration: null, status: 'Incomplete' };

        const durationMs = lastCheckOut.getTime() - firstCheckIn.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        
        let status: DailyAttendanceStatus = 'Absent';
        if (durationHours >= attendanceSettings.minimumHoursFullDay) status = 'Present';
        else if (durationHours >= attendanceSettings.minimumHoursHalfDay) status = 'Half Day';
        
        return {
            date: dateString, day: format(date, 'EEEE'),
            checkIn: format(firstCheckIn, 'HH:mm'), checkOut: format(lastCheckOut, 'HH:mm'),
            duration: `${durationHours.toFixed(2)}`, status,
        };
    });
};

interface DashboardData {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    attendanceTrend: { labels: string[]; present: number[]; absent: number[] };
    productivityTrend: { labels: string[]; hours: number[] };
    attendanceBySite: { labels: string[]; rates: number[] };
}

const AttendanceDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { attendance: attendanceSettings, holidays } = useSettingsStore();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    const [dateRange, setDateRange] = useState<Range[]>([
        { startDate: startOfToday(), endDate: endOfToday(), key: 'selection' }
    ]);
    const [activeDateFilter, setActiveDateFilter] = useState('Today');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    
    const canDownloadReport = user && permissions[user.role]?.includes('download_attendance_report');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (canDownloadReport) {
            api.getUsers().then(setAllUsers);
        }
    }, [canDownloadReport]);
    
    const fetchDashboardData = useCallback(async (startDate: Date, endDate: Date) => {
        setIsLoading(true);
        try {
            const users = await api.getUsers();
            const [submissions, organizations, allApprovedLeaves, allEvents] = await Promise.all([
                api.getVerificationSubmissions(),
                api.getOrganizations(),
                api.getLeaveRequests({ status: 'approved' }),
                Promise.all(users.map(u => api.getAttendanceEvents(u.id, startDate.toISOString(), getEndOfDay(endDate).toISOString()))).then(res => res.flat())
            ]);
            
            let presentCount = 0, absentCount = 0, onLeaveCount = 0;
            const lastDayOfRange = endDate > new Date() ? new Date() : endDate;
            const lastDayStart = new Date(lastDayOfRange);
            lastDayStart.setHours(0, 0, 0, 0);

            for (const u of users) {
                const leavesForUser = allApprovedLeaves.filter(l => l.userId === u.id);
                const eventsForUser = allEvents.filter(e => e.userId === u.id);
                const todayRecord = generateAttendanceRecords(lastDayStart, getEndOfDay(lastDayOfRange), eventsForUser, leavesForUser, holidays, attendanceSettings)[0];
                
                if (todayRecord) {
                    if (todayRecord.status.startsWith('On Leave')) onLeaveCount++;
                    else if (todayRecord.status === 'Present' || todayRecord.status === 'Half Day') presentCount++;
                    else if (todayRecord.status === 'Absent') absentCount++;
                }
            }

            const dateInterval = getEachDayOfInterval({ start: startDate, end: endDate });
            const labelFormat = dateInterval.length > 14 ? 'dd-MMM' : 'EEE d';

            const trendData = dateInterval.map(day => {
                let dailyPresent = 0, dailyAbsent = 0, totalHours = 0, presentUsers = 0;
                for (const u of users) {
                    const rec = generateAttendanceRecords(day, getEndOfDay(day), allEvents.filter(e=>e.userId === u.id), allApprovedLeaves.filter(l=>l.userId === u.id), holidays, attendanceSettings)[0];
                    if(rec) {
                        if (rec.status === 'Present' || rec.status === 'Half Day') {
                            dailyPresent++;
                            totalHours += parseFloat(rec.duration || '0');
                            presentUsers++;
                        }
                        else if (rec.status === 'Absent') dailyAbsent++;
                    }
                }
                return { 
                    date: format(day, labelFormat), 
                    present: dailyPresent, 
                    absent: dailyAbsent,
                    hours: presentUsers > 0 ? totalHours / presentUsers : 0
                };
            });

            const attendanceTrend = {
                labels: trendData.map(d => d.date),
                present: trendData.map(d => d.present),
                absent: trendData.map(d => d.absent),
            };

            const productivityTrend = {
                labels: trendData.map(d => d.date),
                hours: trendData.map(d => d.hours),
            };
            
            const siteData: Record<string, {name: string, presentDays: number, workDays: number}> = {};
            organizations.forEach(org => { siteData[org.id] = { name: org.shortName, presentDays: 0, workDays: 0 }; });
            
            for(const day of dateInterval) {
                 const isWorkday = day.getDay() !== 0 && !holidays.find(h => h.date === format(day, 'yyyy-MM-dd'));
                 if (isWorkday) {
                     for (const u of users) {
                         const orgId = u.organizationId || submissions.find(s => s.personal.email === u.email)?.organization?.organizationId;
                         if (orgId && siteData[orgId]) {
                             siteData[orgId].workDays++;
                             const rec = generateAttendanceRecords(day, getEndOfDay(day), allEvents.filter(e=>e.userId === u.id), allApprovedLeaves.filter(l=>l.userId === u.id), holidays, attendanceSettings)[0];
                             if (rec) {
                                if (rec.status === 'Present') siteData[orgId].presentDays++;
                                else if (rec.status === 'Half Day') siteData[orgId].presentDays += 0.5;
                             }
                         }
                     }
                 }
            }
            
            const siteRates = Object.values(siteData)
                .map(site => ({ name: site.name, rate: site.workDays > 0 ? (site.presentDays / site.workDays) * 100 : 0 }))
                .filter(site => site.rate > 0)
                .sort((a, b) => b.rate - a.rate);
                
            const attendanceBySite = {
                labels: siteRates.map(s => s.name),
                rates: siteRates.map(s => s.rate),
            };

            setDashboardData({ totalEmployees: users.length, presentToday: presentCount, absentToday: absentCount, onLeaveToday: onLeaveCount, attendanceTrend, productivityTrend, attendanceBySite });

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }, [holidays, attendanceSettings]);

    useEffect(() => {
        if (dateRange[0].startDate && dateRange[0].endDate) {
            fetchDashboardData(dateRange[0].startDate, dateRange[0].endDate);
        }
    }, [dateRange, fetchDashboardData]);
    
    const handleSetDateFilter = (filter: string) => {
        setActiveDateFilter(filter);
        const today = new Date();
        let startDate = startOfToday();
        let endDate = endOfToday();

        if (filter === 'This Month') {
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
        } else if (filter === 'This Year') {
            startDate = startOfYear(today);
            endDate = endOfYear(today);
        }
        
        if (endDate > today) {
            endDate = today;
        }

        setDateRange([{ startDate, endDate, key: 'selection' }]);
    };

    const handleCustomDateChange = (item: RangeKeyDict) => {
        setDateRange([item.selection]);
        setActiveDateFilter('Custom');
        setIsDatePickerOpen(false);
    };

    const statDateLabel = useMemo(() => {
        const endDate = dateRange[0].endDate!;
        const today = new Date();
        if (format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return "Today";
        return `on ${format(endDate, 'MMM d')}`;
    }, [dateRange]);

    if (isLoading && !dashboardData) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div className="p-4 space-y-6">
            {isReportModalOpen && <ReportModal allUsers={allUsers} onClose={() => setIsReportModalOpen(false)} initialDateRange={dateRange[0]} />}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary-text">Attendance Dashboard</h2>
                {canDownloadReport && <Button variant="outline" onClick={() => setIsReportModalOpen(true)}><Download className="mr-2 h-4 w-4" /> Download Report</Button>}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {['Today', 'This Month', 'This Year'].map(filter => (
                        <Button key={filter} variant={activeDateFilter === filter ? 'primary' : 'secondary'} size="sm" onClick={() => handleSetDateFilter(filter)}>
                            {filter}
                        </Button>
                    ))}
                </div>
                <div className="relative" ref={datePickerRef}>
                    <Button variant="outline" size="sm" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                            {activeDateFilter === 'Custom' ? `${format(dateRange[0].startDate!, 'dd MMM, yyyy')} - ${format(dateRange[0].endDate!, 'dd MMM, yyyy')}` : 'Custom Range'}
                        </span>
                    </Button>
                    {isDatePickerOpen && (
                        <div className="absolute top-full right-0 mt-2 z-10 bg-card border rounded-lg shadow-lg">
                            <DateRangePicker
                                onChange={handleCustomDateChange}
                                months={2}
                                ranges={dateRange}
                                direction="horizontal"
                                maxDate={new Date()}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={dashboardData?.totalEmployees || 0} icon={Users} />
                <StatCard title={`Present ${statDateLabel}`} value={dashboardData?.presentToday || 0} icon={UserCheck} />
                <StatCard title={`Absent ${statDateLabel}`} value={dashboardData?.absentToday || 0} icon={UserX} />
                <StatCard title={`On Leave ${statDateLabel}`} value={dashboardData?.onLeaveToday || 0} icon={Clock} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ChartContainer title="Attendance Trend" icon={BarChart3}>
                    {dashboardData ? <AttendanceTrendChart data={dashboardData.attendanceTrend} /> : <Loader2 className="h-6 w-6 animate-spin text-muted mx-auto mt-20"/>}
                </ChartContainer>
                <ChartContainer title="Productivity Trend (Avg. Hours)" icon={TrendingUp}>
                    {dashboardData ? <ProductivityChart data={dashboardData.productivityTrend} /> : <Loader2 className="h-6 w-6 animate-spin text-muted mx-auto mt-20"/>}
                </ChartContainer>
                 <ChartContainer title="Attendance Rate by Site" icon={MapPin}>
                    <p className="text-xs text-muted -mt-3 mb-2 text-center">Larger slices indicate higher attendance rates.</p>
                    {dashboardData ? <SiteAttendanceChart data={dashboardData.attendanceBySite} /> : <Loader2 className="h-6 w-6 animate-spin text-muted mx-auto mt-20"/>}
                </ChartContainer>
            </div>
        </div>
    );
};

// --- Report Modal Component ---
type ReportFormat = 'monthlyMuster' | 'customLog';
type ReportRecord = DailyAttendanceRecord & { userName: string; userId: string };

interface MonthlyReportRow {
    slNo: number;
    refNo: string;
    staffName: string;
    dayGrid: { [day: number]: string };
    present: number;
    weekOff: number;
    leaves: number;
    absent: number;
    halfDay: number;
    holidays: number;
    totalPayable: number;
}

const processDataForMonthlyReport = (
    slNo: number,
    user: User,
    submission: OnboardingData | undefined,
    dailyRecords: DailyAttendanceRecord[]
): MonthlyReportRow => {
    const summary = { present: 0, weekOff: 0, leaves: 0, absent: 0, halfDay: 0, holidays: 0 };
    const dayGrid: { [day: number]: string } = {};

    dailyRecords.forEach(record => {
        const dayOfMonth = new Date(record.date.replace(/-/g, '/')).getDate();
        let statusChar = '';
        switch (record.status) {
            case 'Present': summary.present++; statusChar = 'P'; break;
            case 'Absent': summary.absent++; statusChar = 'A'; break;
            case 'Half Day': summary.halfDay++; statusChar = 'HD'; break;
            case 'On Leave (Full)':
            case 'On Leave (Half)': summary.leaves++; statusChar = 'L'; break;
            case 'Weekend': summary.weekOff++; statusChar = 'WO'; break;
            case 'Holiday': summary.holidays++; statusChar = 'H'; break;
            default: statusChar = '-';
        }
        dayGrid[dayOfMonth] = statusChar;
    });

    const totalPayable = summary.present + (summary.halfDay * 0.5) + summary.leaves + summary.holidays + summary.weekOff;

    return {
        slNo,
        refNo: submission?.personal.employeeId || user.id,
        staffName: user.name,
        dayGrid,
        ...summary,
        totalPayable,
    };
};

const convertToMonthlyCSV = (data: MonthlyReportRow[], monthDate: Date): string => {
    const daysInMonth = getDaysInMonth(monthDate);
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    
    const headers = [
        'SL.No', 'Ref No', 'Staff Name',
        ...dayHeaders,
        'Present', 'Half Day', 'Absent', 'Leaves', 'Week Off', 'Holidays', 'Total Payable Days'
    ].join(',');
    
    const rows = data.map(row => {
        const dayCells = Array.from({ length: daysInMonth }, (_, i) => row.dayGrid[i + 1] || '');
        const rowData = [
            row.slNo,
            `"${row.refNo}"`,
            `"${row.staffName}"`,
            ...dayCells,
            row.present,
            row.halfDay,
            row.absent,
            row.leaves,
            row.weekOff,
            row.holidays,
            Number(row.totalPayable).toFixed(1)
        ];
        return rowData.join(',');
    });

    return [headers, ...rows].join('\n');
};

const ReportModal: React.FC<{
    allUsers: User[];
    onClose: () => void;
    initialDateRange: Range;
}> = ({ allUsers, onClose, initialDateRange }) => {
    const [reportUser, setReportUser] = useState<string>('all');
    const [reportFormat, setReportFormat] = useState<ReportFormat>('monthlyMuster');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reportError, setReportError] = useState('');
    const [pdfContent, setPdfContent] = useState<React.ReactElement | null>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    const { attendance: attendanceSettings, holidays } = useSettingsStore();
    
    useEffect(() => {
        let interval: number;
        if (isGenerating) {
            const statuses = ["Fetching data...", "Processing records...", "Compiling report...", "Almost there..."];
            let statusIndex = 0;
            setGenerationStatus(statuses[statusIndex]);
            interval = window.setInterval(() => {
                statusIndex = (statusIndex + 1) % statuses.length;
                setGenerationStatus(statuses[statusIndex]);
            }, 1500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating]);

    useEffect(() => {
        if (pdfContent && pdfRef.current) {
            const element = pdfRef.current;
            const isMuster = reportFormat === 'monthlyMuster';
            const opt = {
                margin: 0.5,
                filename: `Attendance_Report_${Date.now()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: isMuster ? 'legal' : 'a4', orientation: isMuster ? 'landscape' as const : 'portrait' as const }
            };
            html2pdf().from(element).set(opt).save().then(() => {
                setPdfContent(null);
                setIsGenerating(false);
                setToast({ message: 'PDF generated successfully!', type: 'success' });
                onClose();
            }).catch((err: any) => {
                 setToast({ message: 'Failed to generate PDF.', type: 'error' });
                 setIsGenerating(false);
                 setPdfContent(null);
            });
        }
    }, [pdfContent, reportFormat, onClose]);


    const convertToDailyCSV = (data: ReportRecord[]) => {
        const headers = ['Date', 'Day', 'Employee ID', 'Employee Name', 'Check-In', 'Check-Out', 'Duration', 'Status'];
        const rows = data.map(rec => [rec.date, rec.day, `"${rec.userId}"`, `"${rec.userName}"`, rec.checkIn || '', rec.checkOut || '', rec.duration || '', rec.status].join(','));
        return [headers.join(','), ...rows].join('\n');
    };
    
    const handleGenerate = async (formatType: 'csv' | 'pdf') => {
        setIsGenerating(true);
        const { startDate, endDate } = initialDateRange;
        if (!startDate || !endDate) {
            setReportError("Invalid date range provided.");
            setIsGenerating(false);
            return;
        }
        
        try {
            const usersToProcess = reportUser === 'all' ? allUsers : allUsers.filter(u => u.id === reportUser);
            if (usersToProcess.length === 0) throw new Error("No users selected for report.");
            
            if (reportFormat === 'monthlyMuster') {
                const allSubmissions = await api.getVerificationSubmissions();
                const monthlyReportData = await Promise.all(usersToProcess.map(async (user, index) => {
                    const userSubmission = allSubmissions.find(s => s.personal.email === user.email);
                    const [events, leaves] = await Promise.all([
                        api.getAttendanceEvents(user.id, startDate.toISOString(), endDate.toISOString()),
                        api.getLeaveRequests({ userId: user.id, status: 'approved' })
                    ]);
                    const dailyRecords = generateAttendanceRecords(startDate, endDate, events, leaves, holidays, attendanceSettings);
                    return processDataForMonthlyReport(index + 1, user, userSubmission, dailyRecords);
                }));

                if (formatType === 'csv') {
                    const csvData = convertToMonthlyCSV(monthlyReportData, startDate);
                    const fileName = `Monthly_Report_Attendance_${format(startDate, 'MMM_yyyy')}.csv`;
                    triggerDownload(csvData, fileName);
                } else {
                    setPdfContent(<PdfMusterReport data={monthlyReportData} monthDate={startDate} />);
                }
            } else { // 'customLog'
                let allRecords: ReportRecord[] = [];
                for (const user of usersToProcess) {
                    const [events, leaves] = await Promise.all([
                      api.getAttendanceEvents(user.id, startDate.toISOString(), endDate.toISOString()),
                      api.getLeaveRequests({ userId: user.id, status: 'approved' })
                    ]);
                    const userRecords = generateAttendanceRecords(startDate, endDate, events, leaves, holidays, attendanceSettings);
                    allRecords.push(...userRecords.map(rec => ({ ...rec, userId: user.id, userName: user.name })));
                }
                if (allRecords.length === 0) throw new Error('No data found for the selected criteria.');

                if (formatType === 'csv') {
                    const csvData = convertToDailyCSV(allRecords);
                    const fileName = `attendance_log_${reportUser}_${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`;
                    triggerDownload(csvData, fileName);
                } else {
                    setPdfContent(<PdfDailyLogReport data={allRecords} startDate={startDate} endDate={endDate} />);
                }
            }

        } catch (error: any) {
            setToast({ message: error.message || 'Failed to generate report.', type: 'error' });
            setIsGenerating(false);
        }
    };
    
    const triggerDownload = (csvData: string, fileName: string) => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'Report generated successfully!', type: 'success' });
        setIsGenerating(false);
        onClose();
    };

    const handleGenerateCsv = () => handleGenerate('csv');
    const handleGeneratePdf = () => handleGenerate('pdf');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '11in' }}><div ref={pdfRef}>{pdfContent}</div></div>
        
        <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-lg m-4 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="p-4 rounded-full bg-accent-light animate-pulse-bg">
                        <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-primary-text">Generating Report</p>
                    <p className="text-muted">{generationStatus}</p>
                </div>
            ) : (
            <>
                <h3 className="text-lg font-bold text-primary-text mb-4">Generate Attendance Report</h3>
                <div className="space-y-4">
                    <div className="p-3 bg-page rounded-lg text-center">
                        <p className="text-sm font-medium text-muted">Report Period</p>
                        <p className="font-semibold text-primary-text">
                            {initialDateRange.startDate && format(initialDateRange.startDate, 'dd MMM, yyyy')} - {initialDateRange.endDate && format(initialDateRange.endDate, 'dd MMM, yyyy')}
                        </p>
                    </div>

                    <Select label="Employee" id="report-user" value={reportUser} onChange={e => setReportUser(e.target.value)}>
                        <option value="all">All Employees</option>
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">Report Format</label>
                        <div className="flex gap-2 p-1 bg-page rounded-lg">
                            {(['monthlyMuster', 'customLog'] as ReportFormat[]).map(type => (
                                <button key={type} onClick={() => setReportFormat(type)} className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${reportFormat === type ? 'bg-card shadow-sm' : 'hover:bg-card/50'}`}>
                                    {type === 'monthlyMuster' ? 'Monthly Muster' : 'Attendance Log'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {reportError && <p className="text-sm text-red-600">{reportError}</p>}
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleGenerateCsv}>Generate CSV</Button>
                    <Button onClick={handleGeneratePdf}>Generate PDF</Button>
                </div>
            </>
            )}
        </div>
      </div>
    );
};

// --- PDF Content Components ---
const PdfMusterReport: React.FC<{ data: MonthlyReportRow[], monthDate: Date }> = ({ data, monthDate }) => {
    const daysInMonth = getDaysInMonth(monthDate);
    return (
        <div className="p-4 font-sans text-xs">
            <h2 className="text-lg font-bold text-center mb-2">Attendance Muster Roll - {format(monthDate, 'MMMM yyyy')}</h2>
            <table className="w-full border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-1">SL</th>
                        <th className="border p-1">Ref No</th>
                        <th className="border p-1">Name</th>
                        {Array.from({ length: daysInMonth }, (_, i) => <th key={i} className="border p-1 w-6">{i + 1}</th>)}
                        <th className="border p-1">P</th>
                        <th className="border p-1">HD</th>
                        <th className="border p-1">A</th>
                        <th className="border p-1">L</th>
                        <th className="border p-1">WO</th>
                        <th className="border p-1">H</th>
                        <th className="border p-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.slNo}>
                            <td className="border p-1">{row.slNo}</td>
                            <td className="border p-1">{row.refNo}</td>
                            <td className="border p-1">{row.staffName}</td>
                            {Array.from({ length: daysInMonth }, (_, i) => <td key={i} className="border p-1 text-center">{row.dayGrid[i + 1] || ''}</td>)}
                            <td className="border p-1 text-center">{row.present}</td>
                            <td className="border p-1 text-center">{row.halfDay}</td>
                            <td className="border p-1 text-center">{row.absent}</td>
                            <td className="border p-1 text-center">{row.leaves}</td>
                            <td className="border p-1 text-center">{row.weekOff}</td>
                            <td className="border p-1 text-center">{row.holidays}</td>
                            <td className="border p-1 text-center font-bold">{Number(row.totalPayable).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PdfDailyLogReport: React.FC<{ data: ReportRecord[], startDate: Date, endDate: Date }> = ({ data, startDate, endDate }) => (
    <div className="p-4 font-sans text-xs">
        <h2 className="text-lg font-bold text-center mb-2">Attendance Log</h2>
        <p className="text-center text-sm mb-4">{format(startDate, 'dd MMM, yyyy')} - {format(endDate, 'dd MMM, yyyy')}</p>
        <table className="w-full border-collapse border border-gray-400">
            <thead className="bg-gray-200">
                <tr>
                    <th className="border p-1">Date</th>
                    <th className="border p-1">Employee</th>
                    <th className="border p-1">Check-In</th>
                    <th className="border p-1">Check-Out</th>
                    <th className="border p-1">Duration</th>
                    <th className="border p-1">Status</th>
                </tr>
            </thead>
            <tbody>
                {data.map((rec, i) => (
                    <tr key={i}>
                        <td className="border p-1">{rec.date}</td>
                        <td className="border p-1">{rec.userName}</td>
                        <td className="border p-1">{rec.checkIn || '--'}</td>
                        <td className="border p-1">{rec.checkOut || '--'}</td>
                        <td className="border p-1">{rec.duration || '--'}</td>
                        <td className="border p-1">{rec.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AttendanceDashboard;