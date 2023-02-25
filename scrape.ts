// we might not need this full package. Could use puppeteer-core
import puppeteer, { ElementHandle, Page } from "puppeteer";
import * as dotenv from "dotenv";

const DEFAULT_TIMEOUT = { ...(process.env.RPI === "true" && { timeout: 0 }) };

const setup = () => {
  dotenv.config();
};

const login = async (page: Page) => {
  // assume the login button is the first button in the login div
  await page.waitForSelector(".must-login button", {
    ...DEFAULT_TIMEOUT,
  });
  await page.click(".must-login button");
  const email = await page.waitForSelector("input[type=email]", {
    ...DEFAULT_TIMEOUT,
  });
  if (email) {
    await page.type("input[type='email']", process.env.USERNAME!);
  }
  await page.type("input[type=password]", process.env.PASSWORD!, { delay: 50 });

  const logInButtons = await page.$x("//button[contains(text(), 'Log In')]");
  if (logInButtons.length > 0) {
    console.log("logging in");
    const handle = logInButtons[0];
    await Promise.all([
      handle.click(),
      // wait for network idle isn't great. We don't know what's going on in the background
      page
        .waitForNavigation({ waitUntil: "networkidle0", ...DEFAULT_TIMEOUT })
        .then((v) => {
          console.log("network idle");
          return v;
        }),
    ]);
  }
};

const openSavedView = async (page: Page) => {
  try {
    await page.click("a.tb-icon[title=Views]");
    if (await page.$(".must-login")) {
      await login(page);
      console.log("logged in");
      const viewsButton = await page.waitForSelector("a.tb-icon[title=Views]", {
        ...DEFAULT_TIMEOUT,
      });
      console.log("found views button");
      if (viewsButton) {
        await viewsButton.click();
        console.log("clicked button");
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
    elsToHide.push(
      await page.waitForSelector(sel, {
        ...DEFAULT_TIMEOUT,
      })
    );
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

// page.on("request", (request) => {
//   console.log(request.url());
// });

// we don't really want to wait for ads etc to be loaded
await page.goto("https://www.vesselfinder.com", { ...DEFAULT_TIMEOUT });

// Set screen size
// figure out/parameterize dimensions for the rpi
const width = Number(process.env.SCREEN_WIDTH ?? 1920);
const height = Number(process.env.SCREEN_HEIGHT ?? 1080);
await page.setViewport({
  width,
  height,
});

await selectFilters(page);
await openSavedView(page);
// await hideUnwantedEls(page, ["#last-searches"]);
const map = await page.waitForSelector("#map", {
  ...DEFAULT_TIMEOUT,
});
if (map) {
  await map.evaluate((node) => node.requestFullscreen());
}

const refreshBtn = await page.waitForSelector("#refresh-btn", {
  ...DEFAULT_TIMEOUT,
});

while (true) {
  console.log("waiting to refresh...");
  await new Promise<void>((res) => setTimeout(() => res(), 60000));
  if (refreshBtn) {
    console.log("refreshing...");
    await refreshBtn.click();
  }
}

// await map.screenshot({ path: "map.png", fullPage: false });
// await page.screenshot({ path: "full.png", fullPage: true });
