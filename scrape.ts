// we might not need this full package. Could use puppeteer-core
import puppeteer, { ElementHandle, Page } from "puppeteer";
import * as dotenv from "dotenv";

const setup = () => {
  dotenv.config();
};

const login = async (page: Page) => {
  // assume the login button is the first button in the login div
  await page.waitForSelector(".must-login button");
  await page.click(".must-login button");
  const email = await page.waitForSelector("input[type=email]");
  if (email) {
    await page.type("input[type='email']", process.env.USERNAME!);
  }
  await page.type("input[type=password]", process.env.PASSWORD!, { delay: 50 });

  const logInButtons = await page.$x("//button[contains(text(), 'Log In')]");
  if (logInButtons.length > 0) {
    const handle = logInButtons[0];
    await Promise.all([
      handle.click(),
      // wait for network idle isn't great. We don't know what's going on in the background
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);
  }
};

const openSavedView = async (page: Page) => {
  try {
    await page.click("a.tb-icon[title=Views]");
    if (await page.$(".must-login")) {
      await login(page);
      const viewsButton = await page.waitForSelector("a.tb-icon[title=Views]");
      if (viewsButton) {
        await viewsButton.click();
      }
    }

    await page.click("#places-list div");
  } catch (e) {
    console.error("failed to open view", e);
  }
};

const selectFilters = async (page: Page) => {
  try {
    await page.click("a.tb-icon[title=VesselFilters]");
    const deselectStrings = [
      "Other type/ Auxiliary",
      "Passenger/Cruise ships",
      "Fishing ships",
      "Yachts/Sailing Vessels",
      "Military",
      "High speed crafts",
      "Unknown",
    ];
    for (const str of deselectStrings) {
      const filter = await page.$x(`//div[contains(text(), '${str}')]`);
      if (filter) {
        await filter[0].click();
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const hideUnwantedEls = async (
  page: Page,
  unwantedSelectors: string[]
): Promise<void> => {
  const elsToHide: (ElementHandle<any> | null)[] = [];
  for (const sel of unwantedSelectors) {
    elsToHide.push(await page.waitForSelector(sel));
  }
  for (const el of elsToHide) {
    if (el) await el.evaluate((node) => node.remove());
  }
};

setup();

const browser = await puppeteer.launch({
  ...(process.env.RPI === "true" && { executablePath: "chromium-browser" }),
  headless: false,
  args: ["--start-fullscreen", "--no-default-browser-check"],
  ignoreDefaultArgs: ["--enable-automation"],
});
const page = await browser.newPage();

// we don't really want to wait for ads etc to be loaded
await page.goto("https://www.vesselfinder.com", { timeout: 0 });

// Set screen size
// figure out/parameterize dimensions for the rpi
await page.setViewport({ width: 1920, height: 1080 });

await selectFilters(page);
await openSavedView(page);
await hideUnwantedEls(page, ["#last-searches"]);
const map = await page.waitForSelector("#map", { timeout: 0 });
if (map) {
  await map.evaluate((node) => node.requestFullscreen());
}

const refreshBtn = await page.waitForSelector("#refresh-btn");

if (refreshBtn) {
  await refreshBtn.click();
}

// await map.screenshot({ path: "map.png", fullPage: false });
// await page.screenshot({ path: "full.png", fullPage: true });
