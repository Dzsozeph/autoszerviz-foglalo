
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open

    const setOpen = React.useCallback(
      (value) => {
        const openState =
          typeof value === "function" ? value(open) : value

        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen])

    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)

      return () =>
        window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        toggleSidebar,
      ]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            }}
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-background",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)

SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } =
      useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col",
            "bg-[rgba(0, 0, 0, 0.92)] backdrop-blur-2xl",
            "border-r border-white/[0.08]",
            "text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet
          open={openMobile}
          onOpenChange={setOpenMobile}
          {...props}
        >
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className={cn(
              "w-[--sidebar-width] p-0",
              "bg-[rgba(5,6,9,0.94)]",
              "backdrop-blur-2xl",
              "border-white/[0.10]",
              "text-sidebar-foreground",
              "shadow-[0_0_60px_rgba(0,0,0,0.65)]",
              "[&>button]:hidden"
            )}
            style={{
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            }}
            side={side}
          >
            <div className="flex h-full w-full flex-col">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={
          state === "collapsed" ? collapsible : ""
        }
        data-variant={variant}
        data-side={side}
      >
        <div
          className={cn(
            "relative h-svh w-[--sidebar-width]",
            "bg-transparent transition-[width] duration-300 ease-in-out",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />

        <div
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh",
            "w-[--sidebar-width]",
            "transition-[left,right,width] duration-300 ease-in-out",
            "md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              "relative flex h-full w-full flex-col overflow-hidden",
              "bg-[rgba(8,9,12,0.84)]",
              "backdrop-blur-2xl",
              "border border-white/[0.08]",
              "shadow-[0_8px_40px_rgba(0,0,0,0.45)]",
              "group-data-[variant=floating]:rounded-2xl",
              "group-data-[variant=floating]:border-white/[0.12]",
              "group-data-[variant=floating]:shadow-[0_12px_50px_rgba(0,0,0,0.55)]"
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.035] via-transparent to-black/[0.10]" />
            <div className="relative z-10 flex min-h-0 h-full flex-col">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef(
  ({ className, onClick, asChild = false, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <Button
        ref={ref}
        data-sidebar="trigger"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-xl",
          "border border-white/[0.08]",
          "bg-white/[0.04]",
          "text-white/70 backdrop-blur-xl",
          "shadow-[0_4px_16px_rgba(0,0,0,0.25)]",
          "transition-all duration-300",
          "hover:bg-white/[0.10]",
          "hover:text-white hover:border-white/[0.16]",
          "hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]",
          "active:scale-95",
          className
        )}
        onClick={(event) => {
          onClick?.(event)
          toggleSidebar()
        }}
        asChild={asChild}
        {...props}
      >
        {asChild ? (
          <PanelLeft />
        ) : (
          <>
            <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
          </>
        )}
      </Button>
    )
  }
)

SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4",
          "-translate-x-1/2 transition-all ease-linear",
          "after:absolute after:inset-y-0 after:left-1/2",
          "after:w-[2px] after:transition-colors",
          "hover:after:bg-white/20",
          "group-data-[side=left]:-right-4",
          "group-data-[side=right]:left-0",
          "[[data-side=left]_&]:cursor-w-resize",
          "[[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize",
          "[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0",
          "group-data-[collapsible=offcanvas]:after:left-full",
          "group-data-[collapsible=offcanvas]:hover:bg-white/[0.03]",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "relative flex min-h-svh flex-1 flex-col bg-background",
          "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))]",
          "md:peer-data-[variant=inset]:m-2",
          "md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2",
          "md:peer-data-[variant=inset]:ml-0",
          "md:peer-data-[variant=inset]:rounded-xl",
          "md:peer-data-[variant=inset]:shadow",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        data-sidebar="input"
        className={cn(
          "h-9 w-full rounded-xl",
          "bg-white/[0.04] border border-white/[0.08]",
          "text-white placeholder:text-white/30",
          "backdrop-blur-xl shadow-none",
          "focus-visible:ring-2 focus-visible:ring-white/20",
          "focus-visible:border-white/[0.18]",
          "transition-all duration-300",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn(
          "relative flex flex-col gap-2 p-3",
          "border-b border-white/[0.06]",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="footer"
        className={cn(
          "relative flex flex-col gap-2 p-3",
          "border-t border-white/[0.06]",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        data-sidebar="separator"
        className={cn(
          "mx-3 w-auto bg-white/[0.08]",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "relative flex min-h-0 flex-1 flex-col gap-2",
          "overflow-auto",
          "group-data-[collapsible=icon]:overflow-hidden",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn(
          "relative flex w-full min-w-0 flex-col p-2",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          "flex h-9 shrink-0 items-center rounded-lg px-3",
          "text-[10px] font-semibold uppercase tracking-[0.18em]",
          "text-white/35",
          "outline-none ring-sidebar-ring",
          "transition-all duration-300",
          "focus-visible:ring-2",
          "group-data-[collapsible=icon]:-mt-9",
          "group-data-[collapsible=icon]:opacity-0",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-sidebar="group-action"
        className={cn(
          "absolute right-3 top-3.5 flex aspect-square w-6",
          "items-center justify-center rounded-lg p-0",
          "text-white/50",
          "border border-transparent",
          "transition-all duration-300",
          "hover:bg-white/[0.08]",
          "hover:text-white hover:border-white/[0.08]",
          "focus-visible:ring-2 focus-visible:ring-white/20",
          "after:absolute after:-inset-2 after:md:hidden",
          "group-data-[collapsible=icon]:hidden",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
)

SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0 flex-col gap-1",
        className
      )}
      {...props}
    />
  )
)

SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
)

SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  `
  peer/menu-button
  relative flex w-full items-center gap-2
  overflow-hidden rounded-xl
  px-3 py-2
  text-left text-sm text-white/65
  outline-none border border-transparent
  transition-all duration-300 ease-out

  hover:bg-white/[0.07]
  hover:text-white
  hover:border-white/[0.08]
  hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]

  focus-visible:ring-2
  focus-visible:ring-white/20

  active:scale-[0.985]
  active:bg-white/[0.10]

  disabled:pointer-events-none
  disabled:opacity-40

  data-[active=true]:bg-gradient-to-r
  data-[active=true]:from-white/[0.14]
  data-[active=true]:to-white/[0.04]
  data-[active=true]:border-white/[0.12]
  data-[active=true]:text-white
  data-[active=true]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.2)]

  group-has-[[data-sidebar=menu-action]]/menu-item:pr-8
  aria-disabled:pointer-events-none
  aria-disabled:opacity-40

  data-[state=open]:bg-white/[0.07]
  data-[state=open]:text-white

  group-data-[collapsible=icon]:!size-9
  group-data-[collapsible=icon]:!p-2

  [&>span:last-child]:truncate
  [&>svg]:size-4
  [&>svg]:shrink-0
  [&>svg]:transition-all
  [&>svg]:duration-300
  `,
  {
    variants: {
      variant: {
        default: "",
        outline: `
          bg-white/[0.025]
          border-white/[0.08]
          hover:bg-white/[0.08]
          hover:border-white/[0.15]
        `,
      },
      size: {
        default: "h-10 text-sm",
        sm: "h-8 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          sidebarMenuButtonVariants({ variant, size }),
          className
        )}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>

        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          className={cn(
            "z-50 rounded-xl",
            "bg-[rgba(8,9,12,0.94)]",
            "backdrop-blur-2xl",
            "border border-white/[0.12]",
            "text-white shadow-2xl",
            "px-3 py-2",
            "text-xs"
          )}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)

SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef(
  (
    {
      className,
      asChild = false,
      showOnHover = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-action"
        className={cn(
          "absolute right-1 top-1.5",
          "flex aspect-square w-6 items-center justify-center",
          "rounded-lg p-0 text-white/45",
          "transition-all duration-300",
          "hover:bg-white/[0.10]",
          "hover:text-white",
          "focus-visible:ring-2 focus-visible:ring-white/20",
          "after:absolute after:-inset-2 after:md:hidden",
          "peer-data-[size=sm]/menu-button:top-1",
          "peer-data-[size=default]/menu-button:top-2",
          "peer-data-[size=lg]/menu-button:top-3",
          "group-data-[collapsible=icon]:hidden",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1",
        "flex h-5 min-w-5 select-none items-center justify-center",
        "rounded-md px-1",
        "bg-white/[0.06]",
        "border border-white/[0.06]",
        "text-xs font-medium tabular-nums text-white/65",
        "peer-hover/menu-button:text-white",
        "peer-data-[active=true]/menu-button:text-white",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-2",
        "peer-data-[size=lg]/menu-button:top-3",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
)

SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef(
  ({ className, showIcon = false, ...props }, ref) => {
    const width = React.useMemo(() => {
      return `${Math.floor(Math.random() * 40) + 50}%`
    }, [])

    return (
      <div
        ref={ref}
        data-sidebar="menu-skeleton"
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl px-3",
          className
        )}
        {...props}
      >
        {showIcon && (
          <Skeleton
            className="size-4 rounded-md bg-white/[0.08]"
            data-sidebar="menu-skeleton-icon"
          />
        )}

        <Skeleton
          className="h-4 max-w-[--skeleton-width] flex-1 bg-white/[0.08]"
          data-sidebar="menu-skeleton-text"
          style={{
            "--skeleton-width": width,
          }}
        />
      </div>
    )
  }
)

SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1",
        "border-l border-white/[0.10]",
        "rounded-r-xl py-2 pl-3",
        "bg-white/[0.015]",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
)

SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef(
  ({ ...props }, ref) => (
    <li ref={ref} {...props} />
  )
)

SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef(
  (
    {
      asChild = false,
      size = "md",
      isActive,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "a"

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-sub-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          "flex h-9 min-w-0 -translate-x-px",
          "items-center gap-2 overflow-hidden",
          "rounded-lg px-3",
          "text-white/50 text-sm",
          "outline-none",
          "transition-all duration-300",
          "hover:bg-white/[0.07]",
          "hover:text-white hover:translate-x-0.5",
          "focus-visible:ring-2 focus-visible:ring-white/20",
          "active:bg-white/[0.10]",
          "data-[active=true]:bg-white/[0.10]",
          "data-[active=true]:text-white",
          "data-[active=true]:border",
          "data-[active=true]:border-white/[0.08]",
          "[&>span:last-child]:truncate",
          "[&>svg]:size-4",
          "[&>svg]:shrink-0",
          "[&>svg]:text-white/60",
          "group-data-[collapsible=icon]:hidden",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          className
        )}
        {...props}
      />
    )
  }
)

SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
