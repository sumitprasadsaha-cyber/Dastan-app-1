import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, 
  Phone, 
  CreditCard, 
  User, 
  GraduationCap, 
  BookOpen, 
  ChevronRight,
  Calendar,
  Check,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Award,
  TrendingUp,
  FileText,
  Save,
  Plus
} from "lucide-react";
import { Student } from "../types";
import { getUnpaidOverdueMonths, MONTH_NAMES } from "./StudentList";

interface StudentDetailsProps {
  student: Student;
  qrCode: string | null;
  onBack: () => void;
  onSelectSubject: (subject: string) => void;
  onToggleAttendance: (date: string, isPresent: boolean) => void;
  onToggleFeePayment: () => void; 
  onSetFeeStatus: (monthYear: string, status: "paid" | "unpaid") => void;
  onOpenAvatarModal: () => void;
  onAddNote: (subject: string, chapterNo: number, chapterName: string, pdfUrl: string, pdfFileName: string, isCompleted?: boolean, remark?: string) => void;
  onToggleChapterCompletion: (subject: string, noteId: string) => void;
  onUpdateChapterRemark: (subject: string, noteId: string, remark: string) => void;
}

// Check if a specific month is overdue
function isMonthOverdue(monthYearStr: string, currentDateTime: Date = new Date("2026-07-14T14:43:00")): boolean {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [monthName, yearStr] = monthYearStr.split(" ");
  const monthIndex = monthNames.indexOf(monthName);
  const year = parseInt(yearStr);
  
  if (monthIndex === -1 || isNaN(year)) return false;
  
  // Overdue if unpaid after the 3rd day of the month at 1:00 PM
  const deadline = new Date(year, monthIndex, 3, 13, 0, 0);
  return currentDateTime > deadline;
}

// Fixed standard chapter templates per subject
const DEFAULT_CHAPTER_TEMPLATES: Record<string, string[]> = {
  "English": ["Reading Comprehension & Passages", "Tenses & Auxiliary Verbs", "Formal Letters & Essays", "The Last Lesson & Prose", "My Mother at Sixty-Six (Poem)"],
  "Hindi": ["अपठित गद्यांश एवं बोध", "व्याकरण, वर्ण एवं संधि", "निबंध एवं पत्र लेखन", "कबीर की साखियाँ", "सूरदास के पद एवं व्याख्या"],
  "Nepali": ["अपठित गद्यांश र बोध", "शब्दवर्ग र व्याकरण अभ्यास", "चिठी र रचनात्मक निबन्ध", "सङ्गति र कविता व्याख्या", "नेपाली कथा र साहित्य परिचय"],
  "Mathematics": ["Real Numbers & Euclid Division", "Polynomials & Algebraic Identites", "Quadratic Equations & Roots", "Arithmetic Progressions Series", "Trigonometry Ratios & Heights"],
  "Science": ["Chemical Reactions & Balance", "Acids, Bases & pH Salts", "Life Processes & Circulation", "Control & Coordination Systems", "Light Reflection & Lenses"],
  "Computer Science": ["Python Programming Basics", "Functions, Modules & Scope", "File Handling (Text/CSV/Binary)", "Database Concepts & SQL Commands", "Computer Networks & Topologies"],
  "Social Science": ["The Rise of Nationalism in Europe", "Nationalism in India", "Resources, Soil & Development", "Federalism & Decentralization", "Sectors of Indian Economy"],
  "Physics": ["Electric Charge & Fields", "Electrostatic Potential", "Current Electricity", "Moving Charges & Magnetism", "Electromagnetic Induction"],
  "Chemistry": ["The Solid State & Crystals", "Solutions & Osmotic Pressure", "Electrochemistry & Nernst", "Chemical Kinetics & Rates", "Surface Chemistry & Catalysis"],
  "Biology": ["Reproduction in Organisms", "Sexual Reproduction in Plants", "Human Reproduction & Health", "Principles of Inheritance", "Molecular Basis of Inheritance"]
};

const getSyllabusChaptersForSubject = (subject: string): { chapterNo: number; name: string }[] => {
  const list = DEFAULT_CHAPTER_TEMPLATES[subject] || [
    "Introduction & Structural Core",
    "Foundational Conceptual Models",
    "Practical Exercise Solutions",
    "Advanced Application Methods",
    "Comprehensive Revision Guide"
  ];
  return list.map((name, index) => ({
    chapterNo: index + 1,
    name
  }));
};

export default function StudentDetails({
  student,
  qrCode,
  onBack,
  onSelectSubject,
  onToggleAttendance,
  onToggleFeePayment,
  onSetFeeStatus,
  onOpenAvatarModal,
  onAddNote,
  onToggleChapterCompletion,
  onUpdateChapterRemark
}: StudentDetailsProps) {
  const [activeTab, setActiveTab] = useState<"Profile" | "Progress" | "Attendance" | "Subjects" | "Fee">("Profile");
  
  // Selected progress subject (default is the first enrolled subject)
  const [selectedProgressSubject, setSelectedProgressSubject] = useState<string>(() => {
    return student.enrolledSubjects[0] || "";
  });

  // State for remark input focus
  const [editingRemarkNoteId, setEditingRemarkNoteId] = useState<string | null>(null);
  const [editingRemarkText, setEditingRemarkText] = useState<string>("");

  // Academic Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // WhatsApp billing popup overlay state
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedQrImage, setCopiedQrImage] = useState(false);

  const studentFeeMonths = useMemo(() => {
    return student.feeMonths || {};
  }, [student.feeMonths]);

  // List of overdue unpaid months
  const overdueUnpaidMonths = useMemo(() => {
    return getUnpaidOverdueMonths(student);
  }, [student]);

  // Total pending amount
  const totalPendingAmount = useMemo(() => {
    return overdueUnpaidMonths.length * student.monthlyFee;
  }, [overdueUnpaidMonths, student.monthlyFee]);

  // Formatted months list for reminder message, e.g. "June, July"
  const formattedUnpaidMonthsText = useMemo(() => {
    return overdueUnpaidMonths.map(m => m.split(" ")[0]).join(", ");
  }, [overdueUnpaidMonths]);

  // Grammatically corrected billing message with Rs Only suffix
  const whatsappMessage = useMemo(() => {
    const monthsText = formattedUnpaidMonthsText || "Current Term";
    return `${student.name} has Pending Tuition Fee Payment for ${monthsText} amounting to Rs ${totalPendingAmount} Only /-.`;
  }, [student.name, formattedUnpaidMonthsText, totalPendingAmount]);

  const initials = useMemo(() => {
    if (!student.name) return "?";
    const parts = student.name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return student.name[0].toUpperCase();
  }, [student.name]);

  // Attendance history formatting
  const attendanceHistory = useMemo(() => {
    const dates = ["2026-07-14", "2026-07-13", "2026-07-12", "2026-07-11", "2026-07-10", "2026-07-09", "2026-07-08"];
    return dates.map(date => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const formattedDate = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      const isPresent = student.attendance[date] === true;
      const isMarked = student.attendance[date] !== undefined;

      return { date, dayName, formattedDate, isPresent, isMarked };
    });
  }, [student.attendance]);

  const attendanceStats = useMemo(() => {
    const records = Object.values(student.attendance);
    const total = records.length;
    const presents = records.filter(r => r === true).length;
    const rate = total > 0 ? Math.round((presents / total) * 100) : 0;
    return { total, presents, rate };
  }, [student.attendance]);

  // Alphabetically sorted enrolled subjects
  const sortedEnrolledSubjects = useMemo(() => {
    return [...student.enrolledSubjects].sort((a, b) => a.localeCompare(b));
  }, [student.enrolledSubjects]);

  // Calculate detailed chapters list derived ONLY from real subject notes
  const activeChaptersList = useMemo(() => {
    const subject = selectedProgressSubject;
    if (!subject) return [];

    const realNotes = student.notes[subject] || [];

    // Map each real note to the standardized format and sort alphabetically
    const list = realNotes.map((note) => ({
      chapterNo: note.chapterNo,
      chapterName: note.chapterName,
      isReal: true,
      id: note.id,
      isCompleted: !!note.isCompleted,
      remark: note.remark || "",
      pdfFileName: note.pdfFileName
    }));

    return list.sort((a, b) => a.chapterName.localeCompare(b.chapterName));
  }, [student.notes, selectedProgressSubject]);

  // Subject-specific and collective progress indicators
  const subjectCompletionStats = useMemo(() => {
    const total = activeChaptersList.length;
    const completed = activeChaptersList.filter(ch => ch.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [activeChaptersList]);

  // Collective Academic Standing & Progress Percentage calculated from real notes
  const collectiveProgressStats = useMemo(() => {
    let grandTotal = 0;
    let grandCompleted = 0;
    const subjectBreakdown: Record<string, { total: number; completed: number; percent: number; remark: string }> = {};

    sortedEnrolledSubjects.forEach(subject => {
      const realNotes = student.notes[subject] || [];
      const total = realNotes.length;
      let completed = 0;
      let topRemark = "";

      realNotes.forEach(note => {
        if (note.isCompleted) completed++;
        if (note.remark && !topRemark) topRemark = note.remark;
      });

      grandTotal += total;
      grandCompleted += completed;

      subjectBreakdown[subject] = {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        remark: topRemark || "On track with syllabus review."
      };
    });

    const overallPercent = grandTotal > 0 ? Math.round((grandCompleted / grandTotal) * 100) : 0;
    let standing = "On Track";
    if (grandTotal === 0) standing = "New Student";
    else if (overallPercent >= 85) standing = "Excellent";
    else if (overallPercent < 45) standing = "Needs Focus";

    return {
      grandTotal,
      grandCompleted,
      overallPercent,
      standing,
      breakdown: subjectBreakdown
    };
  }, [student.notes, sortedEnrolledSubjects]);

  // Generate complete Academic Performance WhatsApp Report
  const formattedAcademicReport = useMemo(() => {
    const dateStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    let text = `*INGENIOUS STUDY CIRCLE*\n*ACADEMIC PERFORMANCE REPORT*\n\n`;
    text += `Student Name: *${student.name}*\n`;
    text += `Class/Grade: *${student.classGrade}*\n`;
    text += `Date: ${dateStr}\n\n`;
    text += `*Overall Progress: ${collectiveProgressStats.overallPercent}% Completed*\n`;
    text += `Total Completed Chapters: ${collectiveProgressStats.grandCompleted} / ${collectiveProgressStats.grandTotal}\n`;
    text += `Academic Standing: *${collectiveProgressStats.standing}*\n\n`;
    text += `*Subject Syllabus Breakdown:*\n`;

    (Object.entries(collectiveProgressStats.breakdown) as [string, { total: number; completed: number; percent: number; remark: string }][]).forEach(([subj, data]) => {
      text += `- *${subj}*: ${data.percent}% Completed (${data.completed}/${data.total} Chapters)\n`;
      text += `  _Tutor Remarks:_ ${data.remark}\n`;
    });

    text += `\n_Ingenious Study Circle - Shaping Bright Minds._`;
    return text;
  }, [student, collectiveProgressStats]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyReportText = () => {
    navigator.clipboard.writeText(formattedAcademicReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const cleanPhoneNumber = (ph: string) => {
    return ph.replace(/[^0-9+]/g, "");
  };

  const handleTriggerWhatsApp = (phone: string, msgText: string) => {
    const targetPh = cleanPhoneNumber(phone);
    const link = `https://api.whatsapp.com/send?phone=${targetPh}&text=${encodeURIComponent(msgText)}`;
    window.open(link, "_blank");
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${student.name.replace(/\s+/g, "_")}_Tuition_Payment_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyQRImageToClipboard = async () => {
    if (!qrCode) return;
    try {
      const response = await fetch(qrCode);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob
        })
      ]);
      setCopiedQrImage(true);
      setTimeout(() => setCopiedQrImage(false), 2000);
    } catch (e) {
      console.error("Failed copying QR image", e);
    }
  };

  // Toggle chapter completion logic
  const handleToggleChapter = (ch: typeof activeChaptersList[0]) => {
    if (ch.isReal) {
      onToggleChapterCompletion(selectedProgressSubject, ch.id);
    } else {
      // Convert virtual template to real ChapterNote inside student notes state
      onAddNote(
        selectedProgressSubject,
        ch.chapterNo,
        ch.chapterName,
        "", // no PDF file URL yet
        "", // no PDF original filename
        true // marked complete directly
      );
    }
  };

  // Save/Submit customized remark
  const handleSaveRemark = (ch: typeof activeChaptersList[0]) => {
    if (ch.isReal) {
      onUpdateChapterRemark(selectedProgressSubject, ch.id, editingRemarkText.trim());
    } else {
      // Convert virtual template to real with custom remark
      onAddNote(
        selectedProgressSubject,
        ch.chapterNo,
        ch.chapterName,
        "",
        "",
        ch.isCompleted,
        editingRemarkText.trim()
      );
    }
    setEditingRemarkNoteId(null);
  };

  const handleStartEditingRemark = (ch: typeof activeChaptersList[0]) => {
    setEditingRemarkNoteId(ch.id);
    setEditingRemarkText(ch.remark);
  };

  return (
    <div className="flex flex-col gap-5 pb-24 animate-fadeIn" id={`student-details-${student.id}`}>
      {/* Back Header navigation */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4" id="details-back-header">
        <button
          onClick={onBack}
          className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
          id="btn-back-to-students"
          title="Back to Students list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Student Profile</span>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 -mt-0.5">{student.name}</h1>
        </div>
      </div>

      {/* Hero card display */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white flex flex-col gap-4 relative overflow-hidden shadow-lg border border-blue-500/10">
        <div className="flex items-center gap-4">
          <div onClick={onOpenAvatarModal} className="relative cursor-pointer group" id="avatar-container">
            <div className="w-16 h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center text-slate-800 font-extrabold text-xl bg-white shadow-md transition-all duration-300 group-hover:scale-[1.02]">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-full h-full rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-blue-700 text-2xl">{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 border border-white text-white rounded-lg group-hover:scale-105 transition-all shadow-sm">
              <Camera className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black leading-tight">{student.name}</h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100/70 bg-white/10 px-2.5 py-0.5 rounded-full mt-1 w-max">
              {student.classGrade}
            </span>
          </div>
        </div>

        <div className="h-[1px] bg-white/10 w-full" />

        <div className="flex justify-between text-xs font-semibold text-blue-100/80">
          <a href={`tel:${student.phone}`} className="flex items-center gap-1.5 hover:underline">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{student.phone}</span>
          </a>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>₹{student.monthlyFee.toLocaleString("en-IN")}/mo</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1 overflow-x-auto scrollbar-none" id="details-tabs-container">
        {["Profile", "Progress", "Attendance", "Subjects", "Fee"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider text-center border-b-2 rounded-none transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              id={`tab-details-${tab.toLowerCase()}`}
            >
              {tab === "Fee" && overdueUnpaidMonths.length > 0 ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Fee</span>
                  <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full">
                    !
                  </span>
                </span>
              ) : tab}
            </button>
          );
        })}
      </div>

      {/* Tab details routing content */}
      <div className="mt-1" id="details-tab-content">
        {/* TAB 1: PROFILE */}
        {activeTab === "Profile" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Registry Fields
            </span>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-3xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Name</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold text-sm mt-0.5">{student.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-3xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class / Grade</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold text-sm mt-0.5">{student.classGrade}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-3xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Contact Number</span>
                  <a href={`tel:${student.phone}`} className="text-slate-800 dark:text-slate-100 font-semibold text-sm mt-0.5 hover:underline">
                    {student.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-3xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parent's or Guardian contact No.</span>
                  <a href={`tel:${student.parentPhone}`} className="text-slate-800 dark:text-slate-100 font-semibold text-sm mt-0.5 hover:underline">
                    {student.parentPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-3xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Subjects</span>
                  <span className="text-slate-800 dark:text-slate-100 font-semibold text-sm mt-0.5 leading-relaxed">
                    {sortedEnrolledSubjects.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESS TRACKER (NEW!) */}
        {activeTab === "Progress" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Overall Summary bento cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-4">
                {/* SVG Circular Donut Chart representing ALL subjects */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="3" />
                    <circle cx="20" cy="20" r="18" fill="none" className="stroke-blue-600 dark:stroke-blue-400 transition-all duration-1000" strokeWidth="3"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (113.1 * collectiveProgressStats.overallPercent / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{collectiveProgressStats.overallPercent}%</span>
                    <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tight">Overall</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-blue-500" />
                    Academic Standing
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {collectiveProgressStats.standing}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {collectiveProgressStats.grandCompleted} of {collectiveProgressStats.grandTotal} chapters ready
                  </span>
                </div>
              </div>

              {/* Action buttons side */}
              <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200/50 dark:border-slate-800/80 pt-3 sm:pt-0 sm:pl-4 gap-2">
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-extrabold uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Generate WhatsApp Report</span>
                </button>
              </div>
            </div>

            {/* Subject horizontal tab switcher */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Select Course Syllabus
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {sortedEnrolledSubjects.map((subject) => {
                  const percent = collectiveProgressStats.breakdown[subject]?.percent || 0;
                  const isSel = selectedProgressSubject === subject;

                  return (
                    <button
                      key={subject}
                      onClick={() => {
                        setSelectedProgressSubject(subject);
                        setEditingRemarkNoteId(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        isSel
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <span>{subject}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                        isSel ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      }`}>
                        {percent}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected subject chapter checklists and details */}
            {selectedProgressSubject && (
              <div className="flex flex-col gap-3 animate-fadeIn mt-1">
                {/* Subject Specific stats display */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {selectedProgressSubject} Syllabus Status
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Completed {subjectCompletionStats.completed} out of {subjectCompletionStats.total} chapters
                    </span>
                  </div>

                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="18" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3" />
                      <circle cx="20" cy="20" r="18" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500" strokeWidth="3"
                        strokeDasharray="113.1"
                        strokeDashoffset={113.1 - (113.1 * subjectCompletionStats.percent / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-slate-700 dark:text-slate-200">{subjectCompletionStats.percent}%</span>
                  </div>
                </div>

                {/* Chapter Checklist cards */}
                <div className="flex flex-col gap-2.5">
                  {activeChaptersList.map((ch) => {
                    const isEditingThis = editingRemarkNoteId === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-3xs transition-all flex flex-col gap-3 ${
                          ch.isCompleted 
                            ? "border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/5" 
                            : "border-slate-100 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Toggle checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleChapter(ch)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
                                ch.isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-950"
                              }`}
                            >
                              {ch.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                            </button>

                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Chapter {ch.chapterNo}
                              </span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                                {ch.chapterName}
                              </span>
                              {ch.pdfFileName && (
                                <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-1 mt-1">
                                  <FileText className="w-3 h-3" />
                                  Attached: {ch.pdfFileName}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            ch.isCompleted 
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                          }`}>
                            {ch.isCompleted ? "Completed" : "Pending"}
                          </span>
                        </div>

                        {/* Remark box */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850/60 flex flex-col gap-2">
                          {isEditingThis ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write revision remarks, difficulty level..."
                                value={editingRemarkText}
                                onChange={(e) => setEditingRemarkText(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                              />
                              <button
                                onClick={() => handleSaveRemark(ch)}
                                className="px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingRemarkNoteId(null)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-slate-100/50 dark:border-slate-850">
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                                {ch.remark ? `Tutor Remarks: "${ch.remark}"` : "No remarks added yet."}
                              </span>
                              <button
                                onClick={() => handleStartEditingRemark(ch)}
                                className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                              >
                                {ch.remark ? "Edit Remark" : "+ Add Remark"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === "Attendance" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Attendance Log Sheet
              </span>
              <div className="flex justify-between items-center mt-1 text-[10px] sm:text-xs font-bold text-slate-400">
                <span>Present Ratio: {attendanceStats.rate}%</span>
                <span>({attendanceStats.presents} / {attendanceStats.total} marked sessions)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {attendanceHistory.map(({ date, dayName, formattedDate, isPresent, isMarked }) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {formattedDate}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                      {dayName} (July 2026)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleAttendance(date, true)}
                      className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                        isMarked && isPresent
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Present</span>
                    </button>

                    <button
                      onClick={() => onToggleAttendance(date, false)}
                      className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                        isMarked && !isPresent
                          ? "bg-rose-600 border-rose-600 text-white"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-400 hover:text-rose-600"
                      }`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBJECTS */}
        {activeTab === "Subjects" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Syllabus Chapter Notes
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Select an academic discipline to upload and preview chapters.
              </p>
            </div>

            <div className="flex flex-col mt-1 divide-y divide-slate-100 dark:divide-slate-800">
              {student.enrolledSubjects.map((subject) => {
                const notesList = student.notes[subject] || [];
                const notesCount = notesList.length;

                return (
                  <div
                    key={subject}
                    onClick={() => onSelectSubject(subject)}
                    className="flex justify-between items-center py-4 group cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {subject}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>
                        {notesCount > 0 
                          ? `${notesCount} Chapter${notesCount > 1 ? "s" : ""}`
                          : "No PDFs"
                        }
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: MANUAL FEE LEDGER & WHATSAPP ALERTS */}
        {activeTab === "Fee" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Tuition Fee Payment Registry
              </span>
              <span className="text-xs text-slate-400 leading-relaxed mt-1">
                Manually record subscriber monthly cycles. Unpaid cycles past the 3rd of that month (1:00 PM) will trigger a billing alert warning.
              </span>
            </div>

            {/* List of Tracked Months (12 Months of 2026) */}
            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {[
                "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026", 
                "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"
              ].map((month) => {
                // Determine registration date boundary
                const regDate = student.registrationDate || "2026-06-01";
                const [regYearStr, regMonthStr] = regDate.split("-");
                const regYear = parseInt(regYearStr) || 2026;
                const regMonthIdx = (parseInt(regMonthStr) || 6) - 1; // 0-indexed

                const [mName, yStr] = month.split(" ");
                const mIdx = MONTH_NAMES.indexOf(mName);
                const year = parseInt(yStr) || 2026;

                const isBeforeRegistration = year < regYear || (year === regYear && mIdx < regMonthIdx);

                // Default fallback statuses for legacy students
                const getDefaultStatus = (m: string) => {
                  if (m === "June 2026") {
                    return student.id === "student-3" || student.id === "student-5" ? "unpaid" : "paid";
                  }
                  if (m === "July 2026") {
                    return student.feePaidThisMonth ? "paid" : "unpaid";
                  }
                  return "unpaid";
                };

                const status = studentFeeMonths[month] || (isBeforeRegistration ? "not-enrolled" : getDefaultStatus(month));
                const isOverdue = status === "unpaid" && !isBeforeRegistration && isMonthOverdue(month);
                
                return (
                  <div 
                    key={month}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shadow-3xs ${
                      isOverdue 
                        ? "border-rose-100 dark:border-rose-950/40 bg-gradient-to-r from-white to-rose-50/10" 
                        : isBeforeRegistration
                        ? "border-slate-100 dark:border-slate-800 opacity-60"
                        : "border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {month} Term
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {status === "paid" ? (
                          <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : status === "not-enrolled" ? (
                          <span className="text-[10px] font-bold bg-slate-150 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            Not Joined Yet
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Overdue Pending</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            Unpaid (Future Term)
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          ₹{student.monthlyFee} Due
                        </span>
                      </div>
                    </div>

                    {/* Toggle Selector */}
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => onSetFeeStatus(month, "paid")}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer flex-1 sm:flex-initial text-center justify-center flex items-center gap-1 ${
                          status === "paid"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </button>

                      <button
                        onClick={() => onSetFeeStatus(month, "unpaid")}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer flex-1 sm:flex-initial text-center justify-center flex items-center gap-1 ${
                          status === "unpaid"
                            ? (isOverdue ? "bg-rose-600 border-rose-600 text-white" : "bg-slate-700 border-slate-700 text-white")
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Unpaid</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct QR display in Fee tab itself for quicker visual review */}
            {overdueUnpaidMonths.length > 0 && qrCode && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center gap-3.5 mt-2 animate-fadeIn">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-500" />
                  Fast Scan UPI Payment QR
                </span>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm relative group">
                  <img src={qrCode} alt="Billing QR Code" className="w-32 h-32 object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Scan to Settle ₹{totalPendingAmount} Due</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Valid for Ingenious Study Circle Tuition Ledger</span>
                </div>
              </div>
            )}

            {/* Send billing alert button if overdue months exist */}
            {overdueUnpaidMonths.length > 0 ? (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer text-sm animate-pulse"
              >
                <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                <span>Compose WhatsApp Billing Alert ({overdueUnpaidMonths.length})</span>
              </button>
            ) : (
              <div className="mt-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-dashed border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center text-emerald-700 dark:text-emerald-400 flex flex-col items-center justify-center gap-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                <span className="text-xs font-bold">All Subscriptions Paid Up!</span>
                <span className="text-[10px] font-medium text-emerald-600/70">No overdue fee cycles logged for this student.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- WHATSAPP REMINDER BILLING DIALOG --- */}
      {isReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-0" id="whatsapp-reminder-modal">
          <div className="absolute inset-0" onClick={() => setIsReminderOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-slideUp z-10 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                WhatsApp Billing Sheet
              </h2>
              <button
                onClick={() => setIsReminderOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic WhatsApp text preview box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WhatsApp Message Text
              </span>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 relative group leading-relaxed">
                <p>{whatsappMessage}</p>
                <button
                  onClick={handleCopyText}
                  className="absolute bottom-2.5 right-2.5 p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Copy message to clipboard"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3.5]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* GPay/PhonePe QR code display */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Payment QR Code
              </span>
              {qrCode ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={qrCode} 
                      alt="GPay QR" 
                      className="w-14 h-14 object-contain rounded-lg border bg-white p-1" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">GPay/PhonePe Code Ready</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Copy image to paste it in WhatsApp chat!</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={handleCopyQRImageToClipboard}
                      className={`px-2.5 py-1.5 font-bold text-[10px] rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        copiedQrImage
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                          : "bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                      title="Copy QR Image to Clipboard"
                    >
                      {copiedQrImage ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy QR</span>
                    </button>
                    <button
                      onClick={handleDownloadQR}
                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer"
                      title="Download QR"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border border-dashed border-yellow-200/50 dark:border-yellow-900/30 rounded-xl text-center text-yellow-700 dark:text-yellow-500 flex flex-col items-center justify-center gap-1">
                  <QrCode className="w-6 h-6 text-yellow-500" />
                  <span className="text-xs font-bold">No Billing QR Code Uploaded</span>
                  <span className="text-[10px] font-medium text-yellow-600/80 mt-0.5">Upload GPay QR in Settings screen to display here.</span>
                </div>
              )}
            </div>

            {/* Direct Action triggers */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
              <button
                onClick={() => handleTriggerWhatsApp(student.phone, whatsappMessage)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 transition-all cursor-pointer text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Send to Student Phone ({student.phone})</span>
              </button>

              <button
                onClick={() => handleTriggerWhatsApp(student.parentPhone, whatsappMessage)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 transition-all cursor-pointer text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Send to Parent Phone ({student.parentPhone})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ACADEMIC REPORT DIALOG --- */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-0 animate-fadeIn" id="academic-report-modal">
          <div className="absolute inset-0" onClick={() => setIsReportOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-slideUp z-10 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 m-0 sm:m-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-indigo-500 animate-bounce" />
                Student Academic Report
              </h2>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Report text box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Performance Report Output (Formatted Markdown)
              </span>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 relative group leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                <p>{formattedAcademicReport}</p>
                <button
                  onClick={handleCopyReportText}
                  className="absolute bottom-2.5 right-2.5 p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Copy report to clipboard"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3.5]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Direct Action triggers */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
              <button
                onClick={() => handleTriggerWhatsApp(student.parentPhone, formattedAcademicReport)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 transition-all cursor-pointer text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Send Report to Parent WhatsApp ({student.parentPhone})</span>
              </button>
              
              <button
                onClick={() => handleTriggerWhatsApp(student.phone, formattedAcademicReport)}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Send Report to Student WhatsApp ({student.phone})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
