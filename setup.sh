#!/bin/bash

# Install required dependencies
echo "Installing dependencies..."
npm install @/components/ui lucide-react @radix-ui/react-slot \
    class-variance-authority clsx tailwind-merge \
    @radix-ui/react-alert-dialog \
    @hookform/resolvers \
    date-fns


# Install shadcn UI components
echo "Installing shadcn UI components..."
npx shadcn-ui@latest init
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert-dialog
