import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, Settings as SettingsIcon } from "lucide-react";
import { Student, ChapterNote } from "./types";
import { INITIAL_STUDENTS } from "./data";
import Dashboard from "./components/Dashboard";
import StudentList from "./components/StudentList";
import StudentDetails from "./components/StudentDetails";
import SubjectNotes from "./components/SubjectNotes";
import AddEditStudentModal from "./components/AddEditStudentModal";
import ProfilePictureModal from "./components/ProfilePictureModal";
import Settings from "./components/Settings";

export default function App() {
  // --- Navigation States ---
  const [activeTab, setActiveTab] = useState<"Dashboard" | "Students" | "Settings">("Dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<"All" | "Pending">("All");

  // --- Display Theme State ---
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("tuition_app_theme") as any) || "system";
  });

  // --- Global QR Code for WhatsApp Billings ---
  const [qrCode, setQrCode] = useState<string | null>(() => {
    return localStorage.getItem("tuition_payment_qr_code");
  });

  // --- Student State with local persistence ---
  const [students, setStudents] = useState<Student[]>(() => {
    const cached = localStorage.getItem("tuition_students_data");
    if (cached === null) {
      return []; // Start clean with no students, no class tabs, and no names
    }
    
    let parsed: Student[] = [];
    try {
      parsed = JSON.parse(cached);
    } catch (e) {
      console.error("Failed parsing student cache:", e);
      return [];
    }

    // Initialize feeMonths for all students if not present
    return parsed.map(student => {
      if (!student.feeMonths) {
        return {
          ...student,
          feeMonths: {
            "June 2026": student.id === "student-3" || student.id === "student-5" ? "unpaid" : "paid",
            "July 2026": student.feePaidThisMonth ? "paid" : "unpaid"
          }
        };
      }
      return student;
    });
  });

  // Save changes to local persistence
  useEffect(() => {
    localStorage.setItem("tuition_students_data", JSON.stringify(students));
  }, [students]);

  // Handle Theme application
  useEffect(() => {
    localStorage.setItem("tuition_app_theme", theme);
    const root = window.document.documentElement;
    
    const applyTheme = (isDark: boolean, gradientClass?: string) => {
      // Clean previous gradient theme classes
      root.classList.remove("theme-sunset", "theme-ocean", "theme-neon", "theme-cosmic");
      if (gradientClass) {
        root.classList.add(gradientClass);
      }

      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else if (theme === "sunset" || theme === "ocean" || theme === "neon" || theme === "cosmic") {
      applyTheme(true, `theme-${theme}`);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  // Save QR Code to local storage
  const handleSaveQrCode = (dataUrl: string | null) => {
    setQrCode(dataUrl);
    if (dataUrl) {
      localStorage.setItem("tuition_payment_qr_code", dataUrl);
    } else {
      localStorage.removeItem("tuition_payment_qr_code");
    }
  };

  // --- Modal States ---
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // Find active student object if selected
  const activeStudent = React.useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Find notes for the current active subject
  const currentSubjectNotes = React.useMemo(() => {
    if (!activeStudent || !activeSubject) return [];
    return activeStudent.notes[activeSubject] || [];
  }, [activeStudent, activeSubject]);

  // --- State Mutators ---

  // Reset & Delete all application data
  const handleResetData = () => {
    setStudents([]);
    setQrCode(null);
    localStorage.removeItem("tuition_payment_qr_code");
    localStorage.setItem("tuition_students_data", JSON.stringify([]));
    setActiveTab("Dashboard");
    setSelectedStudentId(null);
    setActiveSubject(null);
    setStudentFilter("All");
  };

  // Restore state from a backup file or Drive
  const handleRestoreData = (restoredStudents: Student[], restoredQrCode: string | null) => {
    setStudents(restoredStudents);
    if (restoredQrCode) {
      setQrCode(restoredQrCode);
      localStorage.setItem("tuition_payment_qr_code", restoredQrCode);
    }
  };

  // Add or update student details
  const handleSaveStudent = (
    studentData: Omit<Student, "id" | "notes" | "attendance" | "feeMonths">
  ) => {
    if (studentToEdit) {
      // Edit mode
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentToEdit.id) {
            const updatedNotes = { ...s.notes };
            studentData.enrolledSubjects.forEach((subj) => {
              if (!updatedNotes[subj]) {
                updatedNotes[subj] = [];
              }
            });

            return {
              ...s,
              ...studentData,
              notes: updatedNotes,
            };
          }
          return s;
        })
      );
      setStudentToEdit(null);
    } else {
      // Add mode
      const newStudent: Student = {
        ...studentData,
        id: `student-${Date.now()}`,
        avatarColor: getRandomAvatarColor(),
        feeMonths: {
          "June 2026": "paid",
          "July 2026": "unpaid"
        },
        notes: studentData.enrolledSubjects.reduce((acc, subj) => {
          acc[subj] = [];
          return acc;
        }, {} as Record<string, ChapterNote[]>),
        attendance: {
          "2026-07-14": false,
        },
      };
      setStudents((prev) => [newStudent, ...prev]);
    }
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setActiveSubject(null);
    }
  };

  // Toggle Fee paid status for legacy fallback
  const handleToggleFeePayment = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const isPaid = !s.feePaidThisMonth;
          const updatedMonths = { ...(s.feeMonths || {}) };
          updatedMonths["July 2026"] = isPaid ? "paid" : "unpaid";
          return {
            ...s,
            feePaidThisMonth: isPaid,
            feeMonths: updatedMonths
          };
        }
        return s;
      })
    );
  };

  // Explicit monthly fee toggler
  const handleSetFeeStatus = (studentId: string, monthYear: string, status: "paid" | "unpaid") => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedMonths = { ...(s.feeMonths || {}) };
          updatedMonths[monthYear] = status;
          const isJulyPaid = monthYear === "July 2026" ? (status === "paid") : s.feePaidThisMonth;
          return {
            ...s,
            feePaidThisMonth: isJulyPaid,
            feeMonths: updatedMonths
          };
        }
        return s;
      })
    );
  };

  // Toggle attendance for a date
  const handleToggleAttendance = (
    studentId: string,
    date: string,
    isPresent: boolean
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            attendance: {
              ...s.attendance,
              [date]: isPresent,
            },
          };
        }
        return s;
      })
    );
  };

  // Add chapter note with pdf
  const handleAddNote = (
    studentId: string,
    subject: string,
    chapterNo: number,
    chapterName: string,
    pdfUrl: string,
    pdfFileName: string,
    isCompleted: boolean = false,
    remark: string = ""
  ) => {
    const newNote: ChapterNote = {
      id: `note-${Date.now()}`,
      chapterNo,
      chapterName,
      pdfUrl,
      pdfFileName,
      isCompleted,
      remark,
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const subjectNotes = s.notes[subject] || [];
          return {
            ...s,
            notes: {
              ...s.notes,
              [subject]: [...subjectNotes, newNote],
            },
          };
        }
        return s;
      })
    );
  };

  // Delete note from a subject
  const handleDeleteNote = (
    studentId: string,
    subject: string,
    noteId: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const subjectNotes = s.notes[subject] || [];
          return {
            ...s,
            notes: {
              ...s.notes,
              [subject]: subjectNotes.filter((n) => n.id !== noteId),
            },
          };
        }
        return s;
      })
    );
  };

  // Toggle note complete state
  const handleToggleNoteComplete = (
    studentId: string,
    subject: string,
    noteId: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const subjectNotes = s.notes[subject] || [];
          return {
            ...s,
            notes: {
              ...s.notes,
              [subject]: subjectNotes.map((n) => {
                if (n.id === noteId) {
                  return { ...n, isCompleted: !n.isCompleted };
                }
                return n;
              }),
            },
          };
        }
        return s;
      })
    );
  };

  // Update chapter note remark
  const handleUpdateChapterRemark = (
    studentId: string,
    subject: string,
    noteId: string,
    remark: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const subjectNotes = s.notes[subject] || [];
          return {
            ...s,
            notes: {
              ...s.notes,
              [subject]: subjectNotes.map((n) => {
                if (n.id === noteId) {
                  return { ...n, remark };
                }
                return n;
              }),
            },
          };
        }
        return s;
      })
    );
  };

  // Save profile photo
  const handleSaveProfilePhoto = (studentId: string, dataUrl: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            avatarUrl: dataUrl,
          };
        }
        return s;
      })
    );
  };

  // Triggering edit from student list
  const handleTriggerEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsAddEditOpen(true);
  };

  // Triggering add modal
  const handleTriggerAdd = () => {
    setStudentToEdit(null);
    setIsAddEditOpen(true);
  };

  // Fallback random colors for avatars
  const getRandomAvatarColor = () => {
    const colors = [
      "bg-blue-600",
      "bg-sky-600",
      "bg-indigo-600",
      "bg-blue-800",
      "bg-cyan-600",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Helper to trigger navigation to pending students directly
  const handleNavigateToPendingStudents = () => {
    setActiveTab("Students");
    setStudentFilter("Pending");
    setSelectedStudentId(null);
    setActiveSubject(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d16] flex items-center justify-center p-0 sm:p-6 md:p-8 font-sans antialiased selection:bg-blue-500 selection:text-white" id="app-shell">
      {/* 
        Sleek, responsive mockup frame container.
        Scales up dynamically on wider devices, but feels like an elegant native app.
      */}
      <div 
        id="main-frame"
        className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl h-screen sm:h-[850px] sm:max-h-[900px] bg-white dark:bg-[#111827] sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-2xl transition-all duration-300"
        style={{ contentVisibility: "auto" }}
      >
        {/* Scrollable primary content viewport */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-24" id="main-content-scroll">
          
          {/* View Routing Engine */}
          {activeSubject && activeStudent ? (
            /* Sub-view: Subject Revision Notes with PDF */
            <SubjectNotes
              subject={activeSubject}
              studentName={activeStudent.name}
              notes={currentSubjectNotes}
              onBack={() => setActiveSubject(null)}
              onAddNote={(chapterNo, chapterName, pdfUrl, pdfFileName) =>
                handleAddNote(activeStudent.id, activeSubject, chapterNo, chapterName, pdfUrl, pdfFileName)
              }
              onDeleteNote={(noteId) =>
                handleDeleteNote(activeStudent.id, activeSubject, noteId)
              }
            />
          ) : selectedStudentId && activeStudent ? (
            /* Sub-view: Student Details */
            <StudentDetails
              student={activeStudent}
              qrCode={qrCode}
              onBack={() => {
                setSelectedStudentId(null);
                setActiveTab("Students");
              }}
              onSelectSubject={(subject) => setActiveSubject(subject)}
              onToggleAttendance={(date, isPresent) =>
                handleToggleAttendance(activeStudent.id, date, isPresent)
              }
              onToggleFeePayment={() => handleToggleFeePayment(activeStudent.id)}
              onSetFeeStatus={(monthYear, status) => handleSetFeeStatus(activeStudent.id, monthYear, status)}
              onOpenAvatarModal={() => setIsAvatarOpen(true)}
              onAddNote={(subject, chapterNo, chapterName, pdfUrl, pdfFileName, isCompleted, remark) =>
                handleAddNote(activeStudent.id, subject, chapterNo, chapterName, pdfUrl, pdfFileName, isCompleted, remark)
              }
              onToggleChapterCompletion={(subject, noteId) => handleToggleNoteComplete(activeStudent.id, subject, noteId)}
              onUpdateChapterRemark={(subject, noteId, remark) => handleUpdateChapterRemark(activeStudent.id, subject, noteId, remark)}
            />
          ) : (
            /* Top-level Tabs (Dashboard, Students, Settings) */
            <>
              {activeTab === "Dashboard" && (
                <Dashboard
                  students={students}
                  onRefresh={() => {
                    setStudents([...students]);
                  }}
                  onNavigateToStudents={handleNavigateToPendingStudents}
                  onNavigateToStudentDetails={(id) => {
                    setSelectedStudentId(id);
                    setActiveSubject(null);
                  }}
                  onToggleAttendance={(studentId, date, isPresent) =>
                    handleToggleAttendance(studentId, date, isPresent)
                  }
                />
              )}

              {activeTab === "Students" && (
                <StudentList
                  students={students}
                  filter={studentFilter}
                  onFilterChange={setStudentFilter}
                  onSelectStudent={(id) => {
                    setSelectedStudentId(id);
                    setActiveSubject(null);
                  }}
                  onEditStudent={handleTriggerEdit}
                  onDeleteStudent={handleDeleteStudent}
                  onAddStudent={handleTriggerAdd}
                />
              )}

              {activeTab === "Settings" && (
                <Settings 
                  theme={theme} 
                  onThemeChange={setTheme} 
                  qrCode={qrCode}
                  onQrCodeChange={handleSaveQrCode}
                  onResetData={handleResetData} 
                  students={students}
                  onRestoreData={handleRestoreData}
                />
              )}
            </>
          )}
        </div>

        {/* 
          Global Bottom Navigation:
          NOW FIXED AT BOTTOM ALWAYS, even when inside detailed student files.
          Allows instant navigation back or tabs swap!
        */}
        <nav 
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 flex justify-around items-center z-30 shadow-lg"
          id="bottom-navigation-bar"
        >
          {/* Nav Tab 1: Dashboard */}
          <button
            onClick={() => {
              setActiveTab("Dashboard");
              setSelectedStudentId(null);
              setActiveSubject(null);
            }}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all flex-1 py-1 ${
              activeTab === "Dashboard" && !selectedStudentId
                ? "text-blue-600 dark:text-blue-400 scale-102 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="nav-btn-dashboard"
          >
            <LayoutDashboard className="w-5 h-5 stroke-[2]" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mt-0.5">
              Dashboard
            </span>
          </button>

          {/* Nav Tab 2: Students */}
          <button
            onClick={() => {
              setActiveTab("Students");
              setSelectedStudentId(null);
              setActiveSubject(null);
            }}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all flex-1 py-1 ${
              (activeTab === "Students" || selectedStudentId)
                ? "text-blue-600 dark:text-blue-400 scale-102 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="nav-btn-students"
          >
            <Users className="w-5 h-5 stroke-[2]" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mt-0.5">
              Students
            </span>
          </button>

          {/* Nav Tab 3: Settings */}
          <button
            onClick={() => {
              setActiveTab("Settings");
              setSelectedStudentId(null);
              setActiveSubject(null);
            }}
            className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all flex-1 py-1 ${
              activeTab === "Settings" && !selectedStudentId
                ? "text-blue-600 dark:text-blue-400 scale-102 font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            id="nav-btn-settings"
          >
            <SettingsIcon className="w-5 h-5 stroke-[2]" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mt-0.5">
              Settings
            </span>
          </button>
        </nav>

        {/* --- Floating / Portal Modals --- */}
        
        {/* Register/Edit Student Dialog */}
        <AddEditStudentModal
          isOpen={isAddEditOpen}
          onClose={() => setIsAddEditOpen(false)}
          onSave={handleSaveStudent}
          studentToEdit={studentToEdit}
        />

        {/* Update Profile Avatar Sheet */}
        {activeStudent && (
          <ProfilePictureModal
            isOpen={isAvatarOpen}
            onClose={() => setIsAvatarOpen(false)}
            onSelectPhoto={(dataUrl) => handleSaveProfilePhoto(activeStudent.id, dataUrl)}
          />
        )}
      </div>
    </div>
  );
}
