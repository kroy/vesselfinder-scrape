import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

await page.goto("https://www.vesselfinder.com");

// Set screen size
await page.setViewport({ width: 1080, height: 1024 });
const mapButtons = await page.waitForSelector("#map-buttons");
if (mapButtons) {
  console.log(mapButtons);
  await mapButtons.$eval("#map-type-button", (node) => {
    console.log("hello");
    console.log(node);
  });
}

// Type into search box
// await page.type(".search-box__input", "automate beyond recorder");

// Wait and click on first result
// const searchResultSelector = ".search-box__link";
// await page.waitForSelector(searchResultSelector);
// await page.click(searchResultSelector);

// const map = await page.waitForSelector("map");
// Locate the full title with a unique string
await page.screenshot({ path: "full.png", fullPage: true });

await browser.close();
