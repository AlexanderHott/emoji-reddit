import Link from "next/link";
import { Icons } from "./Icons";
import { buttonVariants } from "./ui/button";
import { UserAccountNav } from "./UserAccountNav";
import { getServerAuthSession } from "~/server/auth";

export default async function Navbar() {
  const session = await getServerAuthSession();
  return (
    <div className="fixed inset-x-0 top-0 z-[10] h-fit border-b border-zinc-300 bg-zinc-100 py-2 ">
      <div className="container mx-auto flex h-full max-w-7xl items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🗿</span>
          <p className="text-zinc hidden text-sm font-medium md:block">
            Emoji Reddit
          </p>
        </Link>

        {session === null ? (
          <Link href="/sign-in" className={buttonVariants()}>
            Sign In
          </Link>
        ) : (
          <UserAccountNav user={session.user} />
        )}
      </div>
    </div>
  );
}
