import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, username } = evt.data;

    // Get the primary email
    const primaryEmail = email_addresses?.find(
      (email) => email.id === evt.data.primary_email_address_id,
    );

    // Construct the name (similar to your existing logic)
    const fullName =
      `${first_name ?? ""} ${last_name ?? ""}`.trim() ??
      username ??
      primaryEmail?.email_address?.split("@")[0]?.split(".")[0] ??
      "Unknown";

    try {
      // Update the player in your database
      await db.player.update({
        where: { clerkId: id },
        data: {
          name: fullName,
          email: primaryEmail?.email_address ?? "",
        },
      });

      return new Response("Player updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error updating player:", error);
      return new Response("Error updating player", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
