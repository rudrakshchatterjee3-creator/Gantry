import { test, expect } from "@playwright/test";

// Real credential auth (lib/auth/*, Cloudflare KV-backed) replaced Google
// OAuth, which unblocked something the previous suite explicitly couldn't
// do: script a full signup -> protected route -> logout flow end to end,
// not just probe the boundary from outside. Both are covered here.

const INVITE_CODE = process.env.OFFICIAL_INVITE_CODE ?? "GANTRY2026";

function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@gantry.test`;
}

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
    const response = await request.get("/api/quick-reports?venueId=metlife");
    expect(response.status()).toBe(401);
  });
});

test.describe("Credential auth (signup, login, logout)", () => {
  test("signup rejects a wrong invite code", async ({ request }) => {
    const response = await request.post("/api/auth/signup", {
      data: { email: uniqueEmail(), password: "correct-horse-battery", inviteCode: "wrong-code" },
    });
    expect(response.status()).toBe(403);
  });

  test("signup rejects a short password", async ({ request }) => {
    const response = await request.post("/api/auth/signup", {
      data: { email: uniqueEmail(), password: "short", inviteCode: INVITE_CODE },
    });
    expect(response.status()).toBe(400);
  });

  test("a real signup, protected-route access, and logout round-trip", async ({ page }) => {
    const email = uniqueEmail();
    const password = "correct-horse-battery-staple";

    const signupResponse = await page.request.post("/api/auth/signup", {
      data: { email, password, inviteCode: INVITE_CODE },
    });
    expect(signupResponse.status()).toBe(200);

    // The signup route sets an HttpOnly session cookie — the browser
    // context carries it automatically from here.
    const dashboardResponse = await page.goto("/");
    expect(dashboardResponse?.status()).toBeLessThan(400);
    await expect(page).not.toHaveURL(/\/welcome$/);

    const poisResponse = await page.request.get("/api/venue-pois?venueId=metlife");
    expect(poisResponse.status()).toBe(200);

    // Signing up twice with the same email must fail — proves accounts are
    // actually persisted in KV, not silently overwritten.
    const duplicateResponse = await page.request.post("/api/auth/signup", {
      data: { email, password, inviteCode: INVITE_CODE },
    });
    expect(duplicateResponse.status()).toBe(409);

    await page.request.post("/api/auth/logout");
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("login rejects a wrong password without revealing whether the account exists", async ({
    request,
  }) => {
    const email = uniqueEmail();
    await request.post("/api/auth/signup", {
      data: { email, password: "correct-horse-battery-staple", inviteCode: INVITE_CODE },
    });

    const wrongPassword = await request.post("/api/auth/login", {
      data: { email, password: "definitely-wrong" },
    });
    expect(wrongPassword.status()).toBe(401);

    const noSuchAccount = await request.post("/api/auth/login", {
      data: { email: uniqueEmail(), password: "definitely-wrong" },
    });
    expect(noSuchAccount.status()).toBe(401);

    const wrongBody = await wrongPassword.json();
    const missingBody = await noSuchAccount.json();
    expect(wrongBody.error).toBe(missingBody.error);
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
  test("renders the hero and sign-in form with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/welcome");
    await expect(page.getByText(/matchday/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
