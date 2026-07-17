import { test, expect } from "@playwright/test";

// The whole dashboard sits behind real Google OAuth (auth.ts + middleware.ts),
// so a scripted end-to-end login isn't something CI can do without storing
// real Google credentials — not something to fake. What IS honestly
// testable, and arguably more important to cover, is the auth boundary
// itself: does an unauthenticated visitor actually get kept out of the
// dashboard and its API routes. These tests exist specifically because that
// boundary was found broken once already (API routes were reachable without
// a session after a middleware matcher change) and fixed — this suite is
// the regression guard for that exact class of bug.

test.describe("Unauthenticated access is blocked", () => {
  test("visiting the dashboard redirects to the landing page", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("visiting a deep dashboard route also redirects", async ({ page }) => {
    await page.goto("/tournament");
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("fan-assistant API rejects an unauthenticated request", async ({ request }) => {
    const response = await request.post("/api/fan-assistant", {
      data: { question: "test" },
    });
    expect(response.status()).toBe(401);
  });

  test("simulate-anomaly API rejects an unauthenticated request", async ({ request }) => {
    const response = await request.post("/api/simulate-anomaly", {
      data: { text: "test" },
    });
    expect(response.status()).toBe(401);
  });

  test("venue-pois API rejects an unauthenticated request", async ({ request }) => {
    const response = await request.get("/api/venue-pois?venueId=metlife");
    expect(response.status()).toBe(401);
  });

  test("quick-reports poll API rejects an unauthenticated request", async ({ request }) => {
    // This one is easy to accidentally leave open: it's read by the
    // dashboard's own polling, but the /report kiosk page it's paired with
    // is intentionally public, so it's tempting to assume this route can be
    // too — it can't, it exposes ops-visible incident data.
    const response = await request.get("/api/quick-reports?venueId=metlife");
    expect(response.status()).toBe(401);
  });
});

test.describe("Quick report kiosk (intentionally public)", () => {
  test("the report page itself is reachable without login", async ({ page }) => {
    const response = await page.goto("/report/metlife/gate-a");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/north gate/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /bottleneck/i })).toBeVisible();
  });

  test("submitting a report only accepts known venue/gate/preset values", async ({ request }) => {
    const response = await request.post("/api/quick-report", {
      data: { venueId: "metlife", gateId: "gate-a", presetId: "not-a-real-preset" },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Landing page", () => {
  test("renders the hero and a Google sign-in option with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/welcome");
    await expect(page.getByText(/matchday/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
