'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // TypeScript ke error se bachne ke liye response ko alag variable mein liya
    const response = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    const error = response.error;

    if (error) {
        // Agar login mein koi galti ho (jaise galat password)
        throw new Error(error.message);
    }

    // Agar login sahi ho jaye to user ko marketplace par bhej dein
    revalidatePath("/", "layout");
    redirect("/marketplace");
}