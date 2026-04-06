"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

/** Routes that should NOT show the app navbar (auth / landing pages). */
const NO_NAVBAR = new Set(["/", "/login", "/signup"]);

export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (NO_NAVBAR.has(pathname)) return null;
  return <Navbar />;
}
