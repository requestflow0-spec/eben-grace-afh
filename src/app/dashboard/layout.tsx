'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CareHubLogo } from '@/components/icons';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileText,
  Settings,
  CircleUser,
  LogOut,
  LifeBuoy,
  ClipboardList,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/patients', icon: Users, label: 'Patients' },
  { href: '/dashboard/staff', icon: UsersRound, label: 'Staff' },
  { href: '/dashboard/records', icon: ClipboardList, label: 'Daily Records' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" side="left">
        <SidebarHeader className="items-center justify-center h-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold group-data-[collapsible=icon]:hidden"
          >
            <CareHubLogo className="size-6 text-primary" />
            <span className="text-lg font-headline">CareHub Pro</span>
          </Link>
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 font-bold group-data-[collapsible=icon]:flex"
          >
            <CareHubLogo className="size-6 text-primary" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                    className: 'bg-sidebar-background text-sidebar-foreground',
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserDropdown userAvatar={userAvatar} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <div className="hidden md:block">
            <UserDropdown userAvatar={userAvatar} />
          </div>
        </header>
        <main className="flex-1 flex-col p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserDropdown({ userAvatar }: { userAvatar: any }) {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-full justify-start gap-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              >
                <Avatar className="h-8 w-8">
                  {userAvatar && (
                    <AvatarImage
                      src={userAvatar.imageUrl}
                      alt="User Avatar"
                      data-ai-hint={userAvatar.imageHint}
                    />
                  )}
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium leading-none">
                    Jane Doe
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@carehub.pro
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="bg-sidebar-background text-sidebar-foreground group-data-[collapsible=icon]:block hidden"
          >
            <p>Jane Doe</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Jane Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@carehub.pro
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <CircleUser className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
// This is a workaround for the TooltipProvider not being available in the server context
const { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } =
  require('@/components/ui/tooltip') as typeof import('@/components/ui/tooltip');
