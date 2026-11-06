"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/sections";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="app-nav">
      <ul>
        {SECTIONS.map((section, index) => {
          const isActive = pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <li key={section.href}>
              <Link href={section.href} aria-current={isActive ? "page" : undefined}>
                <span className="app-nav__step" aria-hidden="true">
                  {index + 1}
                </span>
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
