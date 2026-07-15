import { Student } from "./types";

// A small valid PDF base64 mock URL string to allow instant viewing of demo note files
const MOCK_PDF_DATA = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKFR1aXRpb24gTm90ZXMpCi9DcmVhdG9yIChBY2FkZW15IExlZGdlcikKPj4KZW5kb2JqCnhyZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZiAKdHJhaWxlcgo8PAovU2l6ZSAyCi9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxMAolJUVPRgo=";

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "student-1",
    name: "Aanya Patel",
    classGrade: "Class 9",
    phone: "+91 87654 32109",
    parentPhone: "+91 88776 65544",
    monthlyFee: 1000,
    feePaidThisMonth: true,
    enrolledSubjects: ["Computer Science", "English", "Mathematics", "Science"],
    avatarColor: "bg-blue-600",
    notes: {
      "Computer Science": [],
      "English": [
        {
          id: "eng-note-1",
          chapterNo: 1,
          chapterName: "The Fun They Had",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "the_fun_they_had_summary.pdf",
          createdAt: "2026-07-01T10:00:00Z"
        }
      ],
      "Mathematics": [
        {
          id: "math-note-1-1",
          chapterNo: 1,
          chapterName: "Quadratic Equations - Basics",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "quadratic_equations_formula_sheet.pdf",
          createdAt: "2026-07-02T11:00:00Z"
        },
        {
          id: "math-note-1-2",
          chapterNo: 2,
          chapterName: "Arithmetic Progressions",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "arithmetic_progressions_notes.pdf",
          createdAt: "2026-07-05T14:30:00Z"
        },
        {
          id: "math-note-1-3",
          chapterNo: 3,
          chapterName: "Introduction to Trigonometry",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "trigonometry_identities.pdf",
          createdAt: "2026-07-10T09:00:00Z"
        }
      ],
      "Science": [
        {
          id: "sci-note-1-1",
          chapterNo: 1,
          chapterName: "Chemical Reactions and Equations",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "chemical_reactions_guide.pdf",
          createdAt: "2026-07-12T16:00:00Z"
        }
      ]
    },
    attendance: {
      "2026-07-14": true,
      "2026-07-13": true,
      "2026-07-12": true,
      "2026-07-11": true,
      "2026-07-10": true,
      "2026-07-09": true,
      "2026-07-08": true,
    }
  },
  {
    id: "student-2",
    name: "Amit Singh",
    classGrade: "Class 8",
    phone: "+91 98765 43210",
    parentPhone: "+91 98765 01234",
    monthlyFee: 800,
    feePaidThisMonth: true,
    enrolledSubjects: ["Mathematics", "Science"],
    avatarColor: "bg-pink-600",
    notes: {
      "Mathematics": [
        {
          id: "math-note-2-1",
          chapterNo: 1,
          chapterName: "Rational Numbers",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "rational_numbers_study_guide.pdf",
          createdAt: "2026-07-03T10:00:00Z"
        }
      ],
      "Science": []
    },
    attendance: {
      "2026-07-14": true,
      "2026-07-13": true,
      "2026-07-12": true,
      "2026-07-11": true,
      "2026-07-10": false,
      "2026-07-09": true,
      "2026-07-08": true,
    }
  },
  {
    id: "student-3",
    name: "Priya Verma",
    classGrade: "Class 10",
    phone: "+91 87654 00112",
    parentPhone: "+91 87654 99887",
    monthlyFee: 1200,
    feePaidThisMonth: false,
    enrolledSubjects: ["English", "Mathematics", "Science"],
    avatarColor: "bg-emerald-600",
    notes: {
      "English": [],
      "Mathematics": [
        {
          id: "math-note-3-1",
          chapterNo: 1,
          chapterName: "Real Numbers",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "real_numbers_theorems.pdf",
          createdAt: "2026-07-04T09:00:00Z"
        },
        {
          id: "math-note-3-2",
          chapterNo: 2,
          chapterName: "Polynomials",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "polynomials_exercises.pdf",
          createdAt: "2026-07-07T11:00:00Z"
        }
      ],
      "Science": [
        {
          id: "sci-note-3-1",
          chapterNo: 1,
          chapterName: "Life Processes",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "life_processes_excretion_transport.pdf",
          createdAt: "2026-07-11T13:00:00Z"
        }
      ]
    },
    attendance: {
      "2026-07-14": false,
      "2026-07-13": true,
      "2026-07-12": true,
      "2026-07-11": false,
      "2026-07-10": true,
      "2026-07-08": false,
    }
  },
  {
    id: "student-4",
    name: "Rahul Sharma",
    classGrade: "Class 8",
    phone: "+91 76543 21098",
    parentPhone: "+91 76543 99887",
    monthlyFee: 800,
    feePaidThisMonth: true,
    enrolledSubjects: ["Mathematics", "Science"],
    avatarColor: "bg-teal-600",
    notes: {
      "Mathematics": [
        {
          id: "math-note-4-1",
          chapterNo: 1,
          chapterName: "Linear Equations in One Variable",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "linear_equations_guide.pdf",
          createdAt: "2026-07-01T15:00:00Z"
        },
        {
          id: "math-note-4-2",
          chapterNo: 2,
          chapterName: "Understanding Quadrilaterals",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "quadrilaterals_notes.pdf",
          createdAt: "2026-07-06T10:00:00Z"
        }
      ],
      "Science": []
    },
    attendance: {
      "2026-07-14": true,
      "2026-07-13": true,
      "2026-07-12": true,
      "2026-07-11": true,
      "2026-07-10": true,
      "2026-07-08": true,
    }
  },
  {
    id: "student-5",
    name: "Rohan Das",
    classGrade: "Class 8",
    phone: "+91 65432 10987",
    parentPhone: "+91 65432 99887",
    monthlyFee: 800,
    feePaidThisMonth: false,
    enrolledSubjects: ["Computer Science", "Mathematics"],
    avatarColor: "bg-green-600",
    notes: {
      "Computer Science": [],
      "Mathematics": [
        {
          id: "math-note-5-1",
          chapterNo: 1,
          chapterName: "Squares and Square Roots",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "squares_roots_revision_notes.pdf",
          createdAt: "2026-07-02T16:00:00Z"
        },
        {
          id: "math-note-5-2",
          chapterNo: 2,
          chapterName: "Cubes and Cube Roots",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "cubes_roots_revision_notes.pdf",
          createdAt: "2026-07-04T12:00:00Z"
        },
        {
          id: "math-note-5-3",
          chapterNo: 3,
          chapterName: "Comparing Quantities",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "comparing_quantities_workbook.pdf",
          createdAt: "2026-07-08T15:00:00Z"
        },
        {
          id: "math-note-5-4",
          chapterNo: 4,
          chapterName: "Algebraic Expressions and Identities",
          pdfUrl: MOCK_PDF_DATA,
          pdfFileName: "algebraic_identities_cheat_sheet.pdf",
          createdAt: "2026-07-11T10:00:00Z"
        }
      ]
    },
    attendance: {
      "2026-07-14": true,
      "2026-07-13": true,
      "2026-07-12": true,
      "2026-07-11": true,
      "2026-07-10": true,
      "2026-07-08": true,
    }
  }
];
