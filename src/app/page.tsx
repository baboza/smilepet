import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root path to dashboard (which is protected and will redirect to login if not authenticated)
  redirect("/dashboard");
}
