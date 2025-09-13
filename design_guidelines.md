# Job File Management System Design Guidelines

## Design Approach
**System-Based Approach**: Using Carbon Design System principles for enterprise data management with Material Design elements for enhanced visual feedback, given the data-heavy, productivity-focused nature of this application.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: Primary: 214 100% 97% | Accent: 214 84% 56% 
- Dark Mode: Primary: 214 32% 18% | Accent: 214 84% 70%
- Success: 142 76% 36% | Warning: 45 93% 47% | Error: 0 84% 60%

### B. Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono for data displays
- **Hierarchy**: text-3xl for headers, text-lg for section titles, text-base for body, text-sm for metadata

### C. Layout System
**Tailwind Spacing Units**: Consistent use of 2, 4, 6, 8, 12, 16
- Container padding: p-6
- Component spacing: space-y-4
- Grid gaps: gap-4
- Margins: m-4, m-8

### D. Component Library

**Navigation:**
- Sidebar navigation with collapsible sections
- Breadcrumb navigation for deep hierarchies
- Tab-based navigation for different data views

**Data Management:**
- Table components with sorting, filtering, and pagination
- Card layouts for job file overview
- Form components with clear validation states
- File upload areas with drag-and-drop functionality

**Admin Panel:**
- Dashboard with key metrics and charts
- Bulk upload interfaces for data migration
- User management grids
- Analytics visualization components

**Overlays:**
- Modal dialogs for form submissions
- Confirmation dialogs for critical actions
- Toast notifications for feedback
- Loading states for data operations

### E. Specific Design Considerations

**Data Upload Interface:**
Create prominent upload sections in admin panel with:
- Clear, labeled upload areas for "User Data," "Job File Data," and "Client Data"
- File format indicators (JSON/CSV accepted)
- Progress indicators during upload
- Success/error feedback

**File Management:**
- Visual file type indicators
- Status badges for job file stages
- Client categorization with color coding
- Search and filter capabilities

**Authentication Flow:**
- Clean login/register forms
- Role-based UI variations
- Session management indicators

**Responsive Behavior:**
- Mobile-first approach with collapsible sidebar
- Stacked layouts on smaller screens
- Touch-friendly interaction targets

### F. Key UI Patterns

**Enterprise Focus:**
- Clean, minimal aesthetics prioritizing content
- Consistent spacing and typography scales
- High contrast for accessibility
- Professional color palette avoiding vibrant branding colors

**Productivity Optimization:**
- Keyboard shortcuts for power users
- Bulk action capabilities
- Quick access toolbars
- Contextual menus

This design system ensures a professional, efficient interface suitable for business users managing complex job file workflows while maintaining the data migration capabilities you require.