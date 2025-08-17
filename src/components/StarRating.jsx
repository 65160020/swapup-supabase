// src/components/StarRating.jsx
import React from 'react';

// --- Component ย่อยสำหรับดาวแต่ละประเภท ---
const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

const FullStar = ({ size }) => (
  <svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d={starPath} /></svg>
);

const EmptyStar = ({ size }) => (
  <svg className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d={starPath} /></svg>
);

const HalfStar = ({ size }) => (
    <svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
      <defs>
        <linearGradient id="half_grad_final_center">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="rgb(209 213 219)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path fill="url(#half_grad_final_center)" d={starPath} />
    </svg>
  );

// --- Component หลัก ---
const StarRating = ({ rating = 0, size = "w-5 h-5", className = "" }) => {
  const stars = [];
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0)); // จำกัดค่า rating ให้อยู่ระหว่าง 0-5
  const fullStars = Math.floor(safeRating);
  
  // ✅ ตรรกะที่ถูกต้อง: ถ้าเศษทศนิยม >= 0.5 ให้ถือว่าเป็นดาวครึ่งดวง
  const hasHalfStar = (safeRating - fullStars) >= 0.5;

  // 1. เพิ่มดาวเต็มดวง
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FullStar key={`full-${i}`} size={size} />);
  }

  // 2. เพิ่มดาวครึ่งดวง (ถ้ามี)
  if (hasHalfStar && fullStars < 5) {
    stars.push(<HalfStar key="half" size={size} />);
  }

  // 3. เพิ่มดาวที่เหลือให้เป็นดาวว่าง
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<EmptyStar key={`empty-${i}`} size={size} />);
  }

  return <div className={`flex items-center ${className}`}>{stars}</div>;
};

export default StarRating;