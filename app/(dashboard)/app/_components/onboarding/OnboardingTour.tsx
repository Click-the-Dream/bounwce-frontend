"use client";

import { useEffect, useRef, useState } from "react";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./onboarding.css";
import { useOnboarding } from "@/app/context/OnboardingProvider";

const BREAKPOINT = 1024;
const WAIT_TIMEOUT = 3500;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < BREAKPOINT;

const getSelectorForViewport = (desktop: string, mobile: string) =>
  isMobileViewport() ? mobile : desktop;

const waitForVisible = async (selector: string, timeout = WAIT_TIMEOUT) => {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    const matches = Array.from(document.querySelectorAll(selector));
    const visible = matches.find((element) => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    });

    if (visible) return visible;
    await sleep(80);
  }

  return null;
};

const stepWithResponsiveTarget = ({
  desktop,
  mobile,
  title,
  description,
  side,
  align = "start",
  onNextClick,
  onPrevClick,
}: {
  desktop: string;
  mobile: string;
  title: string;
  description: string;
  side: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  onNextClick?: (
    element: Element | undefined,
    step: DriveStep,
    options: {
      config: unknown;
      state: unknown;
      driver: Driver;
      index: number | undefined;
    },
  ) => void | Promise<void>;
  onPrevClick?: (
    element: Element | undefined,
    step: DriveStep,
    options: {
      config: unknown;
      state: unknown;
      driver: Driver;
      index: number | undefined;
    },
  ) => void | Promise<void>;
}): DriveStep => ({
  element: getSelectorForViewport(desktop, mobile),
  waitForElement: WAIT_TIMEOUT,
  popover: {
    title,
    description,
    side,
    align,
    onNextClick:
      onNextClick ?? ((_element, _step, { driver }) => driver.moveNext()),
    onPrevClick:
      onPrevClick ?? ((_element, _step, { driver }) => driver.movePrevious()),
  },
});

export const OnboardingTour = () => {
  const {
    isTourActive,
    completeTour,
    openMobileSidebar,
    closeMobileSidebar,
  } = useOnboarding();

  const driverRef = useRef<Driver | null>(null);
  const completionHandledRef = useRef(false);
  const [viewportMode, setViewportMode] = useState<"mobile" | "desktop">(
    typeof window !== "undefined" && window.innerWidth < BREAKPOINT
      ? "mobile"
      : "desktop",
  );

  useEffect(() => {
    const handleResize = () => {
      const nextMode = isMobileViewport() ? "mobile" : "desktop";
      setViewportMode(nextMode);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isTourActive) {
      driverRef.current?.destroy();
      driverRef.current = null;
      closeMobileSidebar();
      return;
    }

    let destroyed = false;
    completionHandledRef.current = false;
    const mobile = viewportMode === "mobile";

    const moveNextWithDrawerOpen = async (driverObj: Driver) => {
      if (!mobile) {
        driverObj.moveNext();
        return;
      }

      openMobileSidebar();

      // Wait for the drawer itself and the next visible navigation target.
      await waitForVisible('[data-tour="mobile-home"]');
      await sleep(120);
      if (!destroyed) driverObj.moveNext();
    };

    const moveNextFromSidebar = async (
      driverObj: Driver,
      nextSelector: string,
    ) => {
      if (!mobile) {
        driverObj.moveNext();
        return;
      }

      openMobileSidebar();
      const next = await waitForVisible(nextSelector);
      if (!next || destroyed) return;

      await sleep(100);
      driverObj.moveNext();
    };

    const movePreviousFromSidebar = async (driverObj: Driver) => {
      if (!mobile) {
        driverObj.movePrevious();
        return;
      }

      openMobileSidebar();
      await waitForVisible('[data-tour="mobile-home"]');
      if (!destroyed) driverObj.movePrevious();
    };

    const closeDrawerAndMoveNext = async (driverObj: Driver) => {
      if (!mobile) {
        driverObj.moveNext();
        return;
      }

      closeMobileSidebar();
      await waitForVisible('[data-tour="messages"]');
      if (!destroyed) {
        await sleep(100);
        driverObj.moveNext();
      }
    };

    const steps: DriveStep[] = [
      {
        popover: {
          title: "Welcome to Bouwnce 👋",
          description:
            "A quick 60-second look around so you know exactly where to discover people, manage requests, chat and find events.",
          align: "center",
        },
      },
      ...(mobile
        ? [
            {
              element: '[data-tour="mobile-menu"]',
              waitForElement: WAIT_TIMEOUT,
              popover: {
                title: "Start here",
                description:
                  "Your main menu holds your Bouwnce navigation. Tap Next and we'll open it so you can see where everything lives.",
                side: "bottom" as const,
                align: "center" as const,
                onNextClick: (_element, _step, { driver }) =>
                  moveNextWithDrawerOpen(driver),
              },
            } as DriveStep,
          ]
        : []),
      stepWithResponsiveTarget({
        desktop: '[data-tour="home"]',
        mobile: '[data-tour="mobile-home"]',
        title: "Home",
        description:
          "Your starting point. Come here to see what's happening and quickly get back to your Bouwnce experience.",
        side: "right",
        onNextClick: mobile
          ? (_element, _step, { driver }) =>
              moveNextFromSidebar(driver, '[data-tour="mobile-explore"]')
          : undefined,
        onPrevClick: mobile
          ? (_element, _step, { driver }) => movePreviousFromSidebar(driver)
          : undefined,
      }),
      stepWithResponsiveTarget({
        desktop: '[data-tour="explore"]',
        mobile: '[data-tour="mobile-explore"]',
        title: "Explore people",
        description:
          "Discover new people and potential connections based on interests and what you're looking for.",
        side: "right",
        onNextClick: mobile
          ? (_element, _step, { driver }) =>
              moveNextFromSidebar(driver, '[data-tour="mobile-requests"]')
          : undefined,
        onPrevClick: mobile
          ? (_element, _step, { driver }) =>
              movePreviousFromSidebar(driver)
          : undefined,
      }),
      stepWithResponsiveTarget({
        desktop: '[data-tour="requests"]',
        mobile: '[data-tour="mobile-requests"]',
        title: "Connection requests",
        description:
          "See who wants to connect with you. Your badge lets you know when something needs your attention.",
        side: "right",
        onNextClick: mobile
          ? (_element, _step, { driver }) =>
              moveNextFromSidebar(driver, '[data-tour="mobile-profile"]')
          : undefined,
        onPrevClick: mobile
          ? (_element, _step, { driver }) =>
              movePreviousFromSidebar(driver)
          : undefined,
      }),
      stepWithResponsiveTarget({
        desktop: '[data-tour="profile"]',
        mobile: '[data-tour="mobile-profile"]',
        title: "Your profile",
        description:
          "Your public identity on Bouwnce. Update your photo, bio, username and interests whenever you like.",
        side: "right",
        onNextClick: mobile
          ? (_element, _step, { driver }) =>
              moveNextFromSidebar(driver, '[data-tour="mobile-events"]')
          : undefined,
        onPrevClick: mobile
          ? (_element, _step, { driver }) =>
              movePreviousFromSidebar(driver)
          : undefined,
      }),
      stepWithResponsiveTarget({
        desktop: '[data-tour="events"]',
        mobile: '[data-tour="mobile-events"]',
        title: "Events",
        description:
          "Discover events, see what's happening and join experiences that interest you.",
        side: "right",
        onNextClick: mobile
          ? (_element, _step, { driver }) => closeDrawerAndMoveNext(driver)
          : undefined,
        onPrevClick: mobile
          ? (_element, _step, { driver }) =>
              movePreviousFromSidebar(driver)
          : undefined,
      }),
      {
        element: '[data-tour="messages"]',
        waitForElement: WAIT_TIMEOUT,
        popover: {
          title: "Messages",
          description:
            "Once you connect with someone, your conversations live here.",
          side: "bottom",
          align: "center",
          onPrevClick: mobile
            ? async (_element, _step, { driver }) => {
                openMobileSidebar();
                await waitForVisible('[data-tour="mobile-events"]');
                await sleep(120);
                driver.movePrevious();
              }
            : undefined,
        },
      },
      {
        element: '[data-tour="notifications"]',
        waitForElement: WAIT_TIMEOUT,
        popover: {
          title: "Notifications",
          description:
            "Stay updated with requests, activity and other important changes.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-tour="profile-avatar"]',
        waitForElement: WAIT_TIMEOUT,
        popover: {
          title: "You're ready ✨",
          description:
            "That's Bouwnce. Discover people, build connections, join events and keep your profile looking great.",
          side: "bottom",
          align: "end",
        },
      },
    ];

    const driverObj = driver({
      animate: true,
      duration: 240,
      overlayColor: "rgba(19, 15, 13, 0.72)",
      overlayOpacity: 0.72,
      allowClose: false,
      allowKeyboardControl: true,
      smoothScroll: true,
      showButtons: ["next", "previous"],
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Finish",
      stagePadding: mobile ? 5 : 8,
      stageRadius: mobile ? 10 : 12,
      popoverOffset: mobile ? 9 : 12,
      popoverClass: "bouwnce-driver-popover",
      steps,
      onPopoverRender: (popover) => {
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "bouwnce-tour-skip";
        skip.textContent = "Skip tour";
        skip.addEventListener("click", () => driverRef.current?.destroy());
        popover.footerButtons.prepend(skip);
      },
      onDoneClick: () => {
        driverRef.current?.destroy();
      },
      onDestroyed: () => {
        if (!destroyed && !completionHandledRef.current) {
          completionHandledRef.current = true;
          closeMobileSidebar();
          void completeTour();
        }
      },
    });

    driverRef.current = driverObj;

    const boot = async () => {
      if (!mobile) {
        driverObj.drive();
        return;
      }

      // The mobile menu must be in the DOM and visible before Driver starts
      // calculating positions for the sidebar targets.
      await waitForVisible('[data-tour="mobile-menu"]');
      if (!destroyed) driverObj.drive();
    };

    void boot();

    return () => {
      destroyed = true;
      driverObj.destroy();
      driverRef.current = null;
      closeMobileSidebar();
    };
  }, [closeMobileSidebar, completeTour, isTourActive, openMobileSidebar, viewportMode]);

  return null;
};
