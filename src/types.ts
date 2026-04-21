export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  enrolledCourses: string[];
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  content: string;
  order: number;
}
