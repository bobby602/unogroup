# 📱 UNOGROUP - Responsive Design Guide

## 🎯 Overview

โปรเจกต์นี้ถูกออกแบบให้รองรับการใช้งานบนทุกอุปกรณ์:

| อุปกรณ์ | Breakpoint | คุณสมบัติ |
|---------|------------|-----------|
| 📱 Mobile | < 640px | Bottom Navigation, Card View |
| 📱 Tablet Portrait | 640px - 768px | 2 columns, Compact UI |
| 📱 iPad | 768px - 1024px | Optimized layout |
| 💻 Desktop | 1024px - 1280px | Full Navigation |
| 🖥️ Large Desktop | > 1280px | Max width container |

---

## ✨ Responsive Features

### 1. Bottom Navigation (Mobile)
```
บน Mobile จะมี Navigation Bar ด้านล่างหน้าจอ
- แสดง 5 ไอคอน: หน้าหลัก, รายงานขาย, คะแนน, ค่าคอม, Price List
- Fixed position ติดขอบล่าง
- รองรับ Safe Area (iPhone notch)
```

### 2. Responsive Grid
```tsx
// ตัวอย่าง Grid ที่ปรับตามหน้าจอ
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

### 3. Mobile Card View (DataTable)
```
บน Mobile ตารางจะเปลี่ยนเป็น Card View
- แสดงข้อมูลสำคัญในรูปแบบ Card
- Touch-friendly (ขนาด tap target ≥ 44px)
- Swipe-able
```

### 4. PWA Support
```
Progressive Web App Features:
- ✅ Install to Home Screen
- ✅ Offline Support
- ✅ Push Notifications (ready)
- ✅ Splash Screens (iOS)
```

---

## 📐 Breakpoint Reference

```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets / iPad */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large */
```

### Usage Examples:

```tsx
// Hide on mobile, show on tablet+
<div className="hidden sm:block">...</div>

// Show on mobile only
<div className="sm:hidden">...</div>

// Different padding per breakpoint
<div className="p-3 sm:p-4 md:p-6">...</div>

// Responsive text
<h1 className="text-xl sm:text-2xl lg:text-3xl">...</h1>

// Responsive grid columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">...</div>
```

---

## 🎨 Custom Responsive Utilities

### Safe Area (iPhone)
```tsx
// สำหรับ iPhone notch และ home indicator
<nav className="safe-area-bottom">...</nav>
<header className="safe-area-top">...</header>
```

### Touch Target
```tsx
// ขนาดขั้นต่ำสำหรับ touch (44x44px)
<button className="touch-target">...</button>
<button className="touch-target-lg">...</button>  // 48x48px
```

### Responsive Text
```tsx
<p className="text-responsive-sm">...</p>   // text-sm -> text-base
<h1 className="text-responsive-xl">...</h1> // text-xl -> text-3xl
```

### Responsive Spacing
```tsx
<div className="p-responsive">...</div>   // p-3 -> p-6
<div className="gap-responsive">...</div> // gap-3 -> gap-6
```

### Horizontal Scroll (Mobile)
```tsx
<div className="scroll-container">
  <Card />
  <Card />
  <Card />
</div>
```

---

## 📱 Mobile-Specific Components

### 1. Bottom Navigation
- Fixed ที่ด้านล่างหน้าจอ
- 5 tabs พร้อม icons
- Active indicator
- Safe area padding

### 2. Mobile Card View
- แทนที่ตารางบน mobile
- ข้อมูลจัดเรียงแนวตั้ง
- Touch-friendly

### 3. Swipe Actions (Ready)
- สามารถเพิ่ม swipe left/right actions
- เหมาะสำหรับ delete, edit

### 4. Pull to Refresh (Ready)
- CSS class `.pull-to-refresh`
- เพิ่ม functionality ได้ทีหลัง

---

## 📱 iPad Optimizations

### Layout
- 2 หรือ 3 columns
- Larger touch targets
- Landscape/Portrait support

### Navigation
- Sidebar option (can add)
- Top navbar with dropdown

### Tables
- Full table view (not cards)
- Horizontal scroll if needed

---

## 💻 Desktop Features

### Full Navigation
- Top navbar with all links
- Hover effects
- Dropdown menus

### Multi-column Layout
- 3-4 column grids
- Side panels
- Wide tables

---

## 🔧 Hooks สำหรับ Responsive

### useMediaQuery
```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from "@/hooks";

function MyComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### useResponsive
```tsx
import { useResponsive } from "@/hooks";

function MyComponent() {
  const { isMobile, isTablet, device, isTouchDevice } = useResponsive();
  
  return (
    <div>
      Current device: {device}
      {isTouchDevice && <p>Touch enabled</p>}
    </div>
  );
}
```

### usePWA
```tsx
import { usePWA } from "@/hooks";

function InstallButton() {
  const { isInstallable, installApp, isOnline } = usePWA();
  
  if (!isInstallable) return null;
  
  return (
    <button onClick={installApp}>
      Install App
    </button>
  );
}
```

---

## 📋 Checklist สำหรับ Responsive Design

### Mobile
- [ ] Bottom navigation ใช้งานได้
- [ ] ปุ่มมีขนาด ≥ 44px
- [ ] Text อ่านง่าย (≥ 14px)
- [ ] Forms ใช้งานง่าย
- [ ] ไม่ต้อง zoom เพื่ออ่าน
- [ ] Scroll smooth

### Tablet (iPad)
- [ ] Layout 2-3 columns
- [ ] Touch-friendly
- [ ] Landscape support
- [ ] Split view ready

### Desktop
- [ ] Full feature access
- [ ] Keyboard navigation
- [ ] Hover states
- [ ] Max-width container

### PWA
- [ ] Manifest.json valid
- [ ] Service worker registered
- [ ] Icons all sizes
- [ ] Offline page

---

## 🚀 Testing

### Chrome DevTools
1. เปิด DevTools (F12)
2. Click Toggle device toolbar (Ctrl+Shift+M)
3. เลือก device หรือใส่ขนาดเอง

### Real Device Testing
```bash
# Run with network access
npm run dev -- --host

# Access from other devices
http://YOUR_IP:3000
```

### Common Test Devices
- iPhone SE (375x667)
- iPhone 14 Pro (393x852)
- iPad Mini (768x1024)
- iPad Pro 12.9" (1024x1366)
- Desktop (1920x1080)

---

## 📝 Best Practices

1. **Mobile First** - เริ่มออกแบบจาก mobile ก่อน
2. **Touch Targets** - ขนาดขั้นต่ำ 44x44px
3. **Readable Text** - ขั้นต่ำ 14px, 16px แนะนำ
4. **Contrast** - ตัวอักษรต้องอ่านง่าย
5. **Loading States** - แสดง skeleton/spinner
6. **Error Handling** - แสดง error ชัดเจน
7. **Offline Support** - ทำงานได้เมื่อไม่มี internet

---

## 🎉 Done!

โปรเจกต์พร้อมใช้งานบน:
- ✅ iPhone (ทุกรุ่น)
- ✅ Android Phone
- ✅ iPad (ทุกรุ่น)
- ✅ Android Tablet
- ✅ Desktop (Windows/Mac/Linux)
- ✅ PWA Install
