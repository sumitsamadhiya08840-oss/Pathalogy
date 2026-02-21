import { TestResult } from '@/types/testing';

const COMPLETED_TESTS_KEY = 'nxa_testing_completed_v1';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const getCompletedTests = (): TestResult[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = localStorage.getItem(COMPLETED_TESTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as TestResult[];
  } catch {
    return [];
  }
};

export const saveCompletedTests = (tests: TestResult[]): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(COMPLETED_TESTS_KEY, JSON.stringify(tests));
};
