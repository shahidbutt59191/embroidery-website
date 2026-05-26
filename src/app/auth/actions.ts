'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    // YAHAN BADALNA HAI: createClient() ke sath 'await' lagana zaroori hai
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const response = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    const error = response.error;

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/", "layout");
    redirect("/marketplace");
}