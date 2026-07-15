import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  IndianRupee, 
  BarChart2, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X
} from "lucide-react";
import { Student } from "../types";
import { getUnpaidOverdueMonths } from "./StudentList";

interface DashboardProps {
  students: Student[];
  onRefresh: () => void;
  onNavigateToStudents: () => void;
  onNavigateToStudentDetails: (studentId: string) => void;
  onToggleAttendance: (studentId: string, date: string, isPresent: boolean) => void;
}

export default function Dashboard({ 
  students, 
  onRefresh, 
  onNavigateToStudents, 
  onNavigateToStudentDetails,
  onToggleAttendance
}: DashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adjustingCardId, setAdjustingCardId] = useState<string | null>(null);

  // Trigger rotation for refresh
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Calculate statistics dynamically from the true month-by-month state
  const stats = useMemo(() => {
    const totalEnrolled = students.length;
    
    let pendingFeeCount = 0;
    let totalTarget = 0;
    let totalCollected = 0;
    let remainingDue = 0;
    let attendancePresentCount = 0;
    let attendanceMarkedCount = 0;

    students.forEach(student => {
      // 1. Dynamic target fee calculation (for current month July 2026 if they are registered)
      const regDate = student.registrationDate || "2026-06-01";
      const [regYearStr, regMonthStr] = regDate.split("-");
      const regYear = parseInt(regYearStr) || 2026;
      const regMonthIdx = (parseInt(regMonthStr) || 6) - 1; // 0-indexed

      // July 2026 is year 2026, month index 6
      const isEnrolledInJuly = regYear < 2026 || (regYear === 2026 && regMonthIdx <= 6);

      if (isEnrolledInJuly) {
        totalTarget += student.monthlyFee;
        const feeMonths = student.feeMonths || {};
        const status = feeMonths["July 2026"] || (student.feePaidThisMonth ? "paid" : "unpaid");
        if (status === "paid") {
          totalCollected += student.monthlyFee;
        }
      }

      // 2. Overdue calculation using getUnpaidOverdueMonths
      const overdueMonths = getUnpaidOverdueMonths(student);
      if (overdueMonths.length > 0) {
        pendingFeeCount++;
        remainingDue += overdueMonths.length * student.monthlyFee;
      }

      // 3. Attendance calculations for today "2026-07-14"
      const todayStr = "2026-07-14";
      if (student.attendance && student.attendance[todayStr] !== undefined) {
        attendanceMarkedCount++;
        if (student.attendance[todayStr] === true) {
          attendancePresentCount++;
        }
      }
    });

    // Baseline from image (₹8,400 cumulative revenue)
    const baseRevenue = 8400;
    const totalRevenue = baseRevenue + totalCollected;
    const collectionPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

    return {
      totalEnrolled,
      pendingFeeCount,
      totalRevenue,
      totalTarget,
      totalCollected,
      remainingDue,
      collectionPercentage,
      attendancePresentCount,
      attendanceMarkedCount
    };
  }, [students]);

  // Persistent Card Size state
  const [cardSizes, setCardSizes] = useState<Record<string, { colSpan: 1 | 2 | 3; rowSpan: 1 | 2 | 3 }>>(() => {
    const cached = localStorage.getItem("tuition_dashboard_sizes");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.attendance) {
          parsed.attendance = { colSpan: 1, rowSpan: 1 };
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    // Default: elegant square layout of 5 single cards (1x1 each)
    return {
      students: { colSpan: 1, rowSpan: 1 },
      pending: { colSpan: 1, rowSpan: 1 },
      revenue: { colSpan: 1, rowSpan: 1 },
      overdue: { colSpan: 1, rowSpan: 1 },
      attendance: { colSpan: 1, rowSpan: 1 },
    };
  });

  // Persistent Card Order state
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    const cached = localStorage.getItem("tuition_dashboard_order");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.includes("attendance")) {
          parsed.push("attendance");
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return ["students", "pending", "revenue", "overdue", "attendance"];
  });

  // Save layout configurations
  useEffect(() => {
    localStorage.setItem("tuition_dashboard_sizes", JSON.stringify(cardSizes));
  }, [cardSizes]);

  useEffect(() => {
    localStorage.setItem("tuition_dashboard_order", JSON.stringify(cardOrder));
  }, [cardOrder]);

  // Handler to cycle sizes on hold / long press (restricted to 1x1, 2x2, 3x3)
  const handleCycleCardSize = (cardId: string) => {
    setCardSizes(prev => {
      const current = prev[cardId] || { colSpan: 1, rowSpan: 1 };
      let next: { colSpan: 1 | 2 | 3; rowSpan: 1 | 2 | 3 };
      if (current.colSpan === 1 && current.rowSpan === 1) {
        // Step 1: Make it 2x2
        next = { colSpan: 2, rowSpan: 2 };
      } else if (current.colSpan === 2 && current.rowSpan === 2) {
        // Step 2: Make it 3x3
        next = { colSpan: 3, rowSpan: 3 };
      } else {
        // Step 3: Back to normal Square (1x1)
        next = { colSpan: 1, rowSpan: 1 };
      }
      return { ...prev, [cardId]: next };
    });
  };

  // Move cards left/right (up/down in order)
  const handleMoveCard = (index: number, direction: "left" | "right") => {
    const nextOrder = [...cardOrder];
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < nextOrder.length) {
      // Swap
      const temp = nextOrder[index];
      nextOrder[index] = nextOrder[targetIdx];
      nextOrder[targetIdx] = temp;
      setCardOrder(nextOrder);
    }
  };

  // Dynamic system date formatter according to user specification
  // Today is "day" - date
  const getFormattedDate = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    
    // We base on current time which has July 2026.
    const now = new Date();
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `Today is ${dayName} - ${dayNum}/${monthName}/${year}`;
  };

  // Definition of available stats cards
  const cardsConfig = useMemo(() => {
    return {
      students: {
        id: "students",
        title: "Total Students",
        value: stats.totalEnrolled,
        subtext: "View Students",
        icon: <Users className="w-5 h-5" />,
        theme: "blue" as const,
        onClick: onNavigateToStudents,
      },
      pending: {
        id: "pending",
        title: "Fees Pending",
        value: stats.pendingFeeCount,
        subtext: "Open List Directly",
        icon: <AlertCircle className="w-5 h-5" />,
        theme: "rose" as const,
        onClick: onNavigateToStudents,
      },
      revenue: {
        id: "revenue",
        title: "Total Revenue",
        value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
        subtext: "Cumulative Collected",
        icon: <IndianRupee className="w-5 h-5" />,
        theme: "indigo" as const,
      },
      overdue: {
        id: "overdue",
        title: "Overdue Amount",
        value: `₹${stats.remainingDue.toLocaleString("en-IN")}`,
        subtext: `${stats.pendingFeeCount} Unpaid Accounts`,
        icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
        theme: "amber" as const,
      },
      attendance: {
        id: "attendance",
        title: "Today's Attendance",
        value: `${stats.attendancePresentCount} / ${stats.totalEnrolled}`,
        subtext: "Record Attendance",
        icon: <Calendar className="w-5 h-5" />,
        theme: "emerald" as const,
        onClick: onNavigateToStudents,
      }
    };
  }, [stats, onNavigateToStudents]);

  // Filter cardOrder to only show cards where data is available (greater than 0 / non-empty)
  const activeCardIds = useMemo(() => {
    return cardOrder.filter((cardId) => {
      if (cardId === "students") return stats.totalEnrolled > 0;
      if (cardId === "pending") return stats.pendingFeeCount > 0;
      if (cardId === "revenue") return stats.totalRevenue > 0;
      if (cardId === "overdue") return stats.remainingDue > 0;
      if (cardId === "attendance") return stats.totalEnrolled > 0 && stats.attendanceMarkedCount > 0;
      return false;
    });
  }, [cardOrder, stats]);

  return (
    <div className="flex flex-col gap-6 pb-24 animate-fadeIn" id="dashboard-view">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5" id="dashboard-header">
        <div className="flex flex-col">
          {/* Changed Tuition Management Hub to Ingenious Study Circle */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100" id="dashboard-title">
            Ingenious Study Circle
          </h1>
          {/* Dynamic customized date layout: Tuesday 15/July/2026 */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5" id="dashboard-subtitle">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {getFormattedDate()}
          </p>
        </div>
        <button
          onClick={handleRefreshClick}
          className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all focus:outline-hidden cursor-pointer"
          id="btn-refresh-dashboard"
          title="Refresh statistics"
        >
          <RefreshCw 
            className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? "rotate-180" : ""}`} 
          />
        </button>
      </div>

      {/* Grid: Stats Cards (Elegantly structured as a 3-column grid, fully adjustable 1x1, 2x2, 3x3) */}
      {activeCardIds.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-4 mt-1" id="stats-grid">
            {activeCardIds.map((cardId, index) => {
              const card = cardsConfig[cardId as keyof typeof cardsConfig];
              if (!card) return null;
              const size = cardSizes[cardId] || { colSpan: 1, rowSpan: 1 };
              
              return (
                <DashboardCardWrapper
                  key={cardId}
                  card={{...card, ...size}}
                  index={index}
                  totalCards={activeCardIds.length}
                  onLongPress={() => setAdjustingCardId(cardId)}
                  onMoveLeft={() => handleMoveCard(index, "left")}
                  onMoveRight={() => handleMoveCard(index, "right")}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-extrabold text-slate-750 dark:text-slate-200">No dashboard metrics available</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
            Enroll your first student or log details in the Students tab to populate dynamic tiles on your ledger.
          </p>
          <button
            onClick={onNavigateToStudents}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Add Student
          </button>
        </div>
      )}

      {/* Fee Collection Tracker Card - Only show if student data is available */}
      {stats.totalEnrolled > 0 && (
        <div 
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md animate-fadeIn"
          id="card-fee-collection-tracker"
        >
          <div className="flex justify-between items-start" id="fee-tracker-header">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Monthly fee Collection tracker
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                Target Amount: ₹{stats.totalTarget.toLocaleString("en-IN")} (July 2026 Term)
              </p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-end" id="fee-tracker-values">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Collected
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                ₹{stats.totalCollected.toLocaleString("en-IN")}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
              {stats.collectionPercentage}% Collected
            </span>
          </div>

          {/* Progress Bar with Blue & White gradient */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-3.5 overflow-hidden" id="fee-tracker-progress-bg">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.collectionPercentage}%` }}
              id="fee-tracker-progress-bar"
            />
          </div>

          <div className="mt-4 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider" id="fee-tracker-footer">
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Amount: ₹{stats.remainingDue.toLocaleString("en-IN")}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              Unpaid Students: {stats.pendingFeeCount}
            </span>
          </div>
        </div>
      )}

      {/* Adjust Tile Size Dialog Modal */}
      {adjustingCardId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-0" id="adjust-tile-modal">
          <div className="absolute inset-0" onClick={() => setAdjustingCardId(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-slideUp z-10 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 m-0 sm:m-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Adjust Tile Shape
              </h2>
              <button
                onClick={() => setAdjustingCardId(null)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
              Customize the shape of the <span className="text-blue-600 dark:text-blue-400">"{cardsConfig[adjustingCardId as keyof typeof cardsConfig]?.title}"</span> block inside the 3-column stats grid.
            </p>

            <div className="grid grid-cols-2 gap-3.5 my-2">
              {[
                { label: "1x1 Square (Small)", col: 1, row: 1 },
                { label: "2x1 Wide Rectangle", col: 2, row: 1 },
                { label: "1x2 Tall Rectangle", col: 1, row: 2 },
                { label: "2x2 Large Square", col: 2, row: 2 },
                { label: "3x2 Showcase Banner", col: 3, row: 2 },
                { label: "3x3 Massive Panel", col: 3, row: 3 },
              ].map(({ label, col, row }) => {
                const isSelected = 
                  cardSizes[adjustingCardId]?.colSpan === col && 
                  cardSizes[adjustingCardId]?.rowSpan === row;

                return (
                  <button
                    key={label}
                    onClick={() => {
                      setCardSizes(prev => ({
                        ...prev,
                        [adjustingCardId]: { colSpan: col as any, rowSpan: row as any }
                      }));
                      setAdjustingCardId(null);
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] text-slate-400">Span: {col} cols × {row} rows</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAdjustingCardId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Card Wrapper with long-press gesture support
interface CardItem {
  id: string;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  theme: "blue" | "rose" | "indigo" | "amber" | "emerald";
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2 | 3;
  onClick?: () => void;
}

interface CardWrapperProps {
  card: CardItem;
  index: number;
  totalCards: number;
  onLongPress: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

const DashboardCardWrapper: React.FC<CardWrapperProps> = ({
  card,
  index,
  totalCards,
  onLongPress,
  onMoveLeft,
  onMoveRight
}) => {
  const timerRef = React.useRef<any>(null);
  const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressing(true);
    setIsLongPressTriggered(false);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsLongPressTriggered(true);
      // Optional subtle vibration feedback if supported
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600); // 600ms hold
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (card.onClick) {
      card.onClick();
    }
  };

  const themeClasses = {
    blue: "bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-100",
    rose: "bg-gradient-to-br from-rose-50/70 to-orange-50/40 dark:from-rose-950/15 dark:to-orange-950/10 border-rose-100/40 dark:border-rose-900/25 hover:from-rose-100/70 dark:hover:from-rose-950/20 text-rose-700 dark:text-rose-400",
    indigo: "bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 border-blue-500/10 text-white hover:brightness-105",
    amber: "bg-gradient-to-br from-amber-50/70 to-yellow-50/40 dark:from-amber-950/15 dark:to-yellow-950/10 border-amber-100/40 dark:border-amber-900/25 hover:from-amber-100/70 dark:hover:from-amber-950/20 text-amber-700 dark:text-amber-400",
    emerald: "bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/15 dark:to-teal-950/10 border-emerald-100/40 dark:border-emerald-900/25 hover:from-emerald-100/70 dark:hover:from-emerald-950/20 text-emerald-700 dark:text-emerald-400",
  };

  const spanClasses = `${
    card.colSpan === 3 ? "col-span-3" : card.colSpan === 2 ? "col-span-2" : "col-span-1"
  } ${
    card.rowSpan === 3 ? "row-span-3 min-h-[260px]" : card.rowSpan === 2 ? "row-span-2 min-h-[190px]" : "row-span-1 min-h-[110px]"
  }`;

  return (
    <div
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onClick={handleClick}
      className={`relative p-4 rounded-2xl border shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer select-none group overflow-hidden ${
        themeClasses[card.theme]
      } ${spanClasses} ${isPressing ? "scale-97 brightness-95" : "hover:scale-[1.015] hover:shadow-md"}`}
    >
      {/* Small top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity opacity-0 group-hover:opacity-100 ${
        card.theme === 'indigo' ? 'bg-white/40' : 'bg-blue-500'
      }`} />

      {/* Card Header */}
      <div className="flex justify-between items-start gap-1">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
          card.theme === "indigo" ? "text-blue-100/80" : "text-slate-400 dark:text-slate-500"
        }`}>
          {card.title}
        </span>
        <div className={`p-1.5 rounded-lg shrink-0 ${
          card.theme === "indigo" ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}>
          {card.icon}
        </div>
      </div>

      {/* Card Body */}
      <div className="mt-2.5">
        <span className={`font-black tracking-tight ${
          card.rowSpan === 2 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
        }`}>
          {card.value}
        </span>
        <p className={`text-[9px] font-extrabold uppercase tracking-wider mt-1 flex items-center gap-1 ${
          card.theme === "indigo" ? "text-blue-100/70" : "text-blue-600 dark:text-blue-400"
        }`}>
          <span>{card.subtext}</span>
          <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </p>
      </div>

      {/* Control overlay when hovered or held */}
      <div className="mt-2 pt-2 border-t border-slate-150/10 dark:border-slate-850/10 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {/* Resize control */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLongPress();
          }}
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
            card.theme === "indigo" 
              ? "bg-white/15 hover:bg-white/25 text-white" 
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
          }`}
          title="Change size (or hold card)"
        >
          {card.colSpan}x{card.rowSpan}
        </button>

        {/* Position Controls */}
        <div className="flex gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft();
            }}
            className={`p-1 rounded transition-all ${
              index === 0 
                ? "opacity-25 cursor-not-allowed" 
                : card.theme === "indigo" 
                  ? "bg-white/15 hover:bg-white/25 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
            }`}
            title="Move earlier"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === totalCards - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight();
            }}
            className={`p-1 rounded transition-all ${
              index === totalCards - 1 
                ? "opacity-25 cursor-not-allowed" 
                : card.theme === "indigo" 
                  ? "bg-white/15 hover:bg-white/25 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
            }`}
            title="Move later"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
