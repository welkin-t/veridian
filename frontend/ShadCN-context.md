# ShadCN Components Used in Veridian

This document tracks all ShadCN/UI components installed and used in the Veridian project.

## Installed Components

### Form Components
- **Button** (`@/components/ui/button`) - Primary actions, form submissions, various variants
- **Input** (`@/components/ui/input`) - Text input fields with proper styling
- **Label** (`@/components/ui/label`) - Form field labels with accessibility support

### Layout Components
- **Card** (`@/components/ui/card`) - Content containers with header, content, and footer sections
  - CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Separator** (`@/components/ui/separator`) - Visual dividers between content sections

### Feedback Components
- **Alert** (`@/components/ui/alert`) - Success messages, error notifications, and system alerts
  - AlertDescription for alert content
- **Progress** (`@/components/ui/progress`) - Loading indicators and progress tracking
- **Badge** (`@/components/ui/badge`) - Status indicators for jobs and states

### User Interface Components  
- **Avatar** (`@/components/ui/avatar`) - User profile pictures and initials
- **SignInPage** (`@/components/ui/sign-in`) - Complete authentication page component
- **RegisterForm** (`@/components/ui/register-form`) - User registration form component

## Usage Patterns

### LoginPage Components
- SignInPage: Complete authentication interface with hero image and testimonials
- Alert: Success/error message display with proper theming
- Button: Submit buttons with loading states
- Input: Email and password fields
- Label: Form field labels

### RegisterPage Components  
- RegisterForm: Complete user registration interface
- Card: Main form container with proper spacing
- Input: All form fields (email, password confirmation)
- Button: Submit button with loading states and validation feedback
- Label: Accessible form field labels
- Alert: Registration error and success message display

### Dashboard Components (Planned)
- Badge: Job status indicators (queued, running, completed, failed)
- Progress: Task completion indicators
- Card: Job detail containers
- Avatar: User profile display

### Theme Integration
All components follow the Veridian color scheme:
- Primary: emerald-600 (light) / emerald-500 (dark)
- Destructive: red-600 (light) / red-900 (dark)
- Border radius: 0.5rem
- Typography: Inter font family

## Dependencies Added
- @radix-ui/react-label: ^2.1.7
- @radix-ui/react-slot: ^1.2.3
- class-variance-authority: ^0.7.1
- lucide-react: ^0.525.0 (for icons)
