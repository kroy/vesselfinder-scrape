// we might not need this full package. Could use puppeteer-core
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  executablePath: "chromium-browser",
  headless: false,
  args: ["--start-fullscreen", "--no-default-browser-check"],
  ignoreDefaultArgs: ["--enable-automation"],
});
const page = await browser.newPage();

// we don't really want to wait for ads etc to be loaded
await page.goto("https://www.vesselfinder.com", { timeout: 0 });

// Set screen size
// figure out/parameterize dimensions for the rpi
await page.setViewport({ width: 2000, height: 2000 });
const elsToHide = [
  await page.waitForSelector("#map-buttons"),
  await page.waitForSelector(".lsb"),
  await page.waitForSelector("#last-searches"),
].filter((el) => !!el);
for (const el of elsToHide) {
  await el?.evaluate((node) => node.remove());
}
// page.click("#map", { button: "right" });

const map = await page.waitForSelector("#map");
if (map) {
  await map.evaluate((node) => node.requestFullscreen());
}

// await map.screenshot({ path: "map.png", fullPage: false });
// await page.screenshot({ path: "full.png", fullPage: true });
