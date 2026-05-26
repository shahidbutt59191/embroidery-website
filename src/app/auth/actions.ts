'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Yahan aap error message return kar sakte hain ya redirect kar sakte hain
        throw new Error(error.message);
    }

    revalidatePath("/", "layout");
    redirect("/marketplace"); // Login ke baad user ko yahan bhej dein
}