import { expect, test } from "@playwright/test";

test("home renders Vyb desktop shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vyb Desktop" })).toBeVisible();
});
