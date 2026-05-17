import { Course, Lesson } from './types';

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Kỹ Thuật Làm Móng Gel Cơ Bản',
    description: 'Học cách sơn gel bền màu, không bong tróc và quy trình chuẩn salon.',
    thumbnail: 'https://picsum.photos/seed/nail1/400/250',
    category: 'Gel Art',
    level: 'beginner'
  },
  {
    id: 'course-2',
    title: 'Nghệ Thuật Vẽ Móng Nâng Cao',
    description: 'Hướng dẫn vẽ hoa, hoạt hình và các họa tiết phức tạp trên móng.',
    thumbnail: 'https://picsum.photos/seed/nail2/400/250',
    category: 'Art Design',
    level: 'advanced'
  },
  {
    id: 'course-3',
    title: 'Kỹ Thuật Đính Đá Và Phụ Kiện',
    description: 'Cách đính đá chắc chắn, bố cục sang trọng và bền lâu.',
    thumbnail: 'https://picsum.photos/seed/nail3/400/250',
    category: 'Accents',
    level: 'intermediate'
  }
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson-1-1',
    courseId: 'course-1',
    title: 'Chuẩn Bị Phao Móng',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: 'Hướng dẫn cách nhặt da và làm sạch phao móng trước khi sơn.',
    order: 1
  },
  {
    id: 'lesson-1-2',
    courseId: 'course-1',
    title: 'Quy Trình Sơn Base & Màu',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    content: 'Cách đi cọ mượt mà và vào đèn đúng thời gian.',
    order: 2
  }
];
