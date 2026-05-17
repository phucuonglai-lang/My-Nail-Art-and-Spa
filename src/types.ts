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
  translations?: {
    [key: string]: {
      title: string;
      description: string;
    }
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  content: string;
  order: number;
  translations?: {
    [key: string]: {
      title: string;
      content: string;
    }
  };
}

export interface ProcedureStep {
  id: string;
  title: string;
  desc: string;
  videoUrl?: string;
  order: number;
  translations?: {
    [key: string]: {
      title: string;
      desc: string;
    }
  };
}

export interface Procedure {
  id: string;
  icon: string;
  color: string;
  difficulty: string;
  translations: {
    [key: string]: {
      nav: string;
      title: string;
      subtitle: string;
      phases?: {
        [key: string]: string;
      };
      steps: {
        [key: string]: {
          title: string;
          desc: string;
          videoUrl?: string;
        }
      };
      warning_callus_title?: string;
      warning_callus_desc?: string;
      copyright?: string;
    }
  }
}

export interface Policy {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'html';
  url?: string;
  content?: string; // For HTML type
  translations?: {
    [key: string]: {
      title: string;
      content: string;
    }
  };
  createdAt: any;
  updatedAt: any;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  updatedBy?: string;
  isPurchased?: boolean;
  branch?: 'kendall' | 'cutlerbay';
  lastUpdated?: any;
}

export interface PortfolioWork {
  id: string;
  technicianId: string;
  technicianName: string;
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  duration: string;
  notes: string;
  level: number;
  category: string;
  createdAt: any;
  evaluations?: WorkEvaluation[];
}

export interface WorkEvaluation {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  ratings: {
    shape: number;
    cuticle: number;
    durability: number;
    aesthetics: number;
  };
  feedback: string;
  annotatedImageUrls?: string[];
  createdAt: any;
}

export interface PurchaseOrderItem {
  name: string;
  quantity: number;
  isPurchased: boolean;
}

export interface PurchaseOrderHistory {
  updatedBy: string;
  updatedAt: any;
}

export interface PurchaseOrder {
  id: string;
  branch: 'kendall' | 'cutlerbay';
  creatorName: string;
  updatedBy?: string;
  items: PurchaseOrderItem[];
  createdAt: any;
  updatedAt?: any;
  history?: PurchaseOrderHistory[];
}

