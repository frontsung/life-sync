'use client';

import * as React from 'react';
import { ko, enUS } from 'date-fns/locale';

export type Language = 'en' | 'ko';

export const dictionaries = {
  en: {
    appTitle: 'Life Sync',
    manageSchedule: 'Manage your schedule efficiently',
    eventsFor: 'Events for',
    noEvents: 'No events scheduled for this day.',
    addEvent: 'Add Event',
    eventTitle: 'Event Title',
    eventTitlePlaceholder: 'Meeting with team...',
    description: 'Description',
    descriptionPlaceholder: 'Details...',
    colorLabel: 'Color Label',
    adding: 'Adding...',
    delete: 'Delete',
    more: 'more',
    label: 'Label',
    scheduleManagement: 'Schedule Management',
    todaysTodo: "Today's To-Do",
    addTodo: 'Add To-Do',
    todoPlaceholder: 'What needs to be done?',
    syncCalendar: 'Sync with Calendar',
    noTodos: 'No tasks for today. Enjoy your day!',
    dashboard: 'Dashboard',
    todoManagement: 'To-Do Management',
    financeManagement: 'Finance Management',
    secretSpace: 'Secret Space',
    financeDesc: 'Track your income and expenses',
    totalBalance: 'Total Balance',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    addTransaction: 'Add Transaction',
    type: 'Type',
    income: 'Income',
    expense: 'Expense',
    amount: 'Amount',
    category: 'Category',
    categoryPlaceholder: 'e.g. Food, Transport',
    date: 'Date',
    actions: 'Actions',
    descPlaceholder: 'Description...',
    noTransactions: 'No transactions recorded yet.',
    todaysSchedule: "Today's Schedule",
    viewAll: 'View All',
    financeSummary: 'Finance Summary',
    root: 'Root',
    folder: 'Folder',
    note: 'Note',
    createFolder: 'New Folder',
    createNote: 'New Note',
    save: 'Save',
    back: 'Back',
    newFolder: 'New Folder',
    newNote: 'New Note',
    untitled: 'Untitled',
    confirmDelete: 'Are you sure you want to delete this item? Contents will be lost.',
    saving: 'Saving...',
    unlink: 'Unlink from Calendar',
    update: 'Update',
    edit: 'Edit',
    syncNow: 'Sync Now',
    search: 'Search',
    rename: 'Rename',
    cancel: 'Cancel',
    confirm: 'Confirm',
    namePlaceholder: 'Enter name...',
    searchPlaceholder: 'Search...',
    gridView: 'Grid View',
    listView: 'List View',
    name: 'Name',
    dateModified: 'Date Modified',
    fileType: 'Type',
  },
  ko: {
    appTitle: 'Life Sync',
    manageSchedule: '일정을 효율적으로 관리하세요',
    eventsFor: '일정 목록:',
    noEvents: '이 날짜에 예정된 일정이 없습니다.',
    addEvent: '일정 추가',
    eventTitle: '일정 제목',
    eventTitlePlaceholder: '팀 회의...',
    description: '설명',
    descriptionPlaceholder: '상세 내용...',
    colorLabel: '색상 라벨',
    adding: '추가 중...',
    delete: '삭제',
    more: '개 더보기',
    label: '라벨',
    scheduleManagement: '일정 관리',
    todaysTodo: '오늘 할 일',
    addTodo: '할 일 추가',
    todoPlaceholder: '해야 할 일이 있나요?',
    syncCalendar: '캘린더 연동',
    noTodos: '오늘 할 일이 없습니다. 즐거운 하루 되세요!',
    dashboard: '대시보드',
    todoManagement: '할 일 관리',
    financeManagement: '재무 관리',
    secretSpace: '비밀 공간',
    financeDesc: '수입과 지출을 관리하세요',
    totalBalance: '총 자산',
    totalIncome: '총 수입',
    totalExpense: '총 지출',
    addTransaction: '내역 추가',
    type: '유형',
    income: '수입',
    expense: '지출',
    amount: '금액',
    category: '카테고리',
    categoryPlaceholder: '예: 식비, 교통비',
    date: '날짜',
    actions: '관리',
    descPlaceholder: '내용 입력...',
    noTransactions: '아직 기록된 내역이 없습니다.',
    todaysSchedule: '오늘의 일정',
    viewAll: '전체 보기',
    financeSummary: '재무 요약',
    root: '최상위',
    folder: '폴더',
    note: '메모',
    createFolder: '폴더 만들기',
    createNote: '메모 만들기',
    save: '저장',
    back: '뒤로',
    newFolder: '새 폴더',
    newNote: '새 메모',
    untitled: '제목 없음',
    confirmDelete: '정말 삭제하시겠습니까? 포함된 내용도 모두 삭제됩니다.',
    saving: '저장 중...',
    unlink: '캘린더 연동 해제',
    update: '수정',
    edit: '편집',
    syncNow: '지금 연동',
    search: '검색',
    rename: '이름 변경',
    cancel: '취소',
    confirm: '확인',
    namePlaceholder: '이름 입력...',
    searchPlaceholder: '검색...',
    gridView: '바둑판 보기',
    listView: '자세히 보기',
    name: '이름',
    dateModified: '수정한 날짜',
    fileType: '유형',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof dictionaries['en']) => string;
  dateLocale: typeof enUS;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>('en');

  // Load language from local storage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'ko')) {
      setLanguage(saved);
    } else {
       // Detect browser language
       const browserLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
       setLanguage(browserLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof dictionaries['en']) => {
    return dictionaries[language][key];
  };

  const dateLocale = language === 'ko' ? ko : enUS;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
