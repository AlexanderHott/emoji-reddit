"use client";

import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Icons } from "./Icons";
import { useToast } from "~/hooks/use-toast";

export default function UserAuthForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginWithGoogle = async () => {
    setIsLoading(true);

    try {
      await signIn("google");
    } catch (err) {
      console.log("Error logging in with google", err);
      toast({
        title: "There was a problem.",
        description: "An error occured when logging in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <Button
        size="sm"
        className="w-full"
        variant={"subtle"}
        isLoading={isLoading}
        onClick={loginWithGoogle}
      >
        {isLoading ? null : <Icons.google className="mr-2 h-4 w-4" />}
        Google
      </Button>
    </div>
  );
}
