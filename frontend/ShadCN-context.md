# ShadCN Components Used in Veridian

This document tracks all ShadCN/UI components installed and used in the Veridian project.

## Installed Components

### Form Components
- **Button** (`@/components/ui/button`) - Primary actions, form submissions
- **Input** (`@/components/ui/input`) - Text input fields with proper styling
- **Label** (`@/components/ui/label`) - Form field labels with accessibility support

### Layout Components
- **Card** (`@/components/ui/card`) - Content containers with header, content, and footer sections
  - CardHeader, CardTitle, CardDescription, CardContent, CardFooter

### Feedback Components
- **Alert** (`@/components/ui/alert`) - Error messages and notifications
  - AlertDescription for alert content

## Usage Patterns

### RegisterPage Components
- Card: Main form container
- Input: All form fields (email, password, name, company)
- Button: Submit button with loading states
- Label: Form field labels
- Alert: Error message display

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
