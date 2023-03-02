// we might not need this full package. Could use puppeteer-core
import puppeteer, { ElementHandle, Page } from "puppeteer";
import * as dotenv from "dotenv";

const setup = () => {
  dotenv.config();
};

const DEFAULT_TIMEOUT = { timeout: 0 };

const selectSatelliteView = async (page: Page) => {
  const mapTypeButton = await page.waitForSelector(
    "div#map-buttons button#map-type-button",
    DEFAULT_TIMEOUT
  );
  await mapTypeButton?.click();
  await new Promise<void>((res) => setTimeout(() => res(), 1000));
  // await page.click("button#map-type-button");
  await page.waitForSelector("div.hasMenu ul", DEFAULT_TIMEOUT);
  const satelliteMapButton = await page.$x(
    `//li[contains(text(), 'Satellite map')]`
  );

  return Promise.all([satelliteMapButton[0].click()]);
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
    console.log("found handle", handle);
    return Promise.all([
      handle.click().then(() => {
        console.log("clicked login button");
      }),
      // wait for network idle isn't great. We don't know what's going on in the background
      page
        .waitForNavigation({ waitUntil: "networkidle2", timeout: 0 })
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

    return page.click("#places-list div");
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
): Promise<any> => {
  const elsToHide: (ElementHandle<any> | null)[] = [];
  const promises = unwantedSelectors.map(async (selector) => {
    return page.waitForSelector(selector, {
      ...DEFAULT_TIMEOUT,
    });
  });
  // for (const sel of unwantedSelectors) {
  //   elsToHide.push(
  //     await page.waitForSelector(sel, {
  //       ...DEFAULT_TIMEOUT,
  //     })
  //   );
  // }

  const elements = await Promise.all(promises);
  const hide = elements.map(async (el) => {
    return el?.evaluate((node) => node.remove());
  });
  // for (const el of elsToHide) {
  //   if (el) await el.evaluate((node) => node.remove());
  // }
  return Promise.all(hide);
};

const main = async () => {
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

  // Set screen size
  // figure out/parameterize dimensions for the rpi
  console.log("setting viewPort");
  const width = Number(process.env.SCREEN_WIDTH ?? 1920);
  const height = Number(process.env.SCREEN_HEIGHT ?? 1080);
  await page.setViewport({
    width,
    height,
    isLandscape: true,
    deviceScaleFactor: 2,
  });
  console.log("navigating to page");
  // we don't really want to wait for ads etc to be loaded
  await page.goto("https://www.vesselfinder.com", DEFAULT_TIMEOUT);

  console.log("selecting filters");
  await selectFilters(page);
  await selectSatelliteView(page);
  await Promise.all([openSavedView(page)]);
  await hideUnwantedEls(page, [
    "#last-searches",
    "#map-buttons",
    ".ol-zoom",
    ".ol-attribution",
  ]);
  const map = await page.waitForSelector("#map", {
    ...DEFAULT_TIMEOUT,
  });

  // wait 2 seconds for the cruft to go awat
  await new Promise<void>((res) => setTimeout(() => res(), 2000));
  // if (map) {
  //   // await map.evaluate((node) => node.requestFullscreen());
  // }

  // const refreshBtn = await page.waitForSelector("#refresh-btn", {
  //   ...DEFAULT_TIMEOUT,
  // });
  await map?.screenshot({
    path: `images/03-02-2023-0740/map-${Date.now()}.png`,
  });
  return browser.close();

  // while (true) {
  //   console.log("waiting to refresh...");
  //   await new Promise<void>((res) => setTimeout(() => res(), 600000));
  //   if (refreshBtn) {
  //     console.log("refreshing...");
  //     await refreshBtn.click();
  //   }
  // }

  // await page.screenshot({ path: "full.png", fullPage: true });
};

setup();
await main();

while (true) {
  console.log("waiting to take picture...");
  await new Promise<void>((res) => setTimeout(() => res(), 300000));
  await main();
}
