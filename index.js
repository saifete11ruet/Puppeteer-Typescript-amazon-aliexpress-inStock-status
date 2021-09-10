const schedule = require("node-schedule");
const userAgent = require("user-agents");
const puppeteer = require("puppeteer-extra");
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const urlAliExpress =
  "https://www.aliexpress.com/item/1005001375604489.html?spm=a2g0o.productlist.0.0.11e67e0391P60o&algo_pvid=7d753413-ec1d-4a76-864e-e0adaad8aed0&algo_expid=7d753413-ec1d-4a76-864e-e0adaad8aed0-13&btsid=2100bde116134847808776634e2075&ws_ab_test=searchweb0_0,searchweb201602_,searchweb201603_";

const urlAmazon =
  "https://www.amazon.es/Relaxdays-Tienda-Exterior-Interior-10022461/dp/B07B8VPM15?&linkCode=sl1&tag=regaladin-21&linkId=5a01555752c1235f513a8ec026782a21&language=es_ES&ref_=as_li_ss_tl";

// run cron job every midnight 12 am
schedule.scheduleJob("0 0 * * *", async function () {
  const browser = await puppeteer.launch({
    headless: true,
    // waitUntil: "networkidle0",
    timeout: 0,
    userDataDir: "./temp", // Vey Very Important
  });
  // const page = await browser.newPage();
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  try {
    await page.setRequestInterception(true);
    await page.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.setUserAgent(userAgent.toString());

    // In stock status for Ali Express
    await page.goto(urlAliExpress);
    const inStockAliExpress = await page.evaluate(() => {
      const inStock = document.querySelector(".product-quantity-tip span span");
      const inStockQuantity =
        inStock && inStock.innerHTML ? inStock.innerHTML.replace(/ .*/, "") : 0;
      return inStockQuantity;
    });
    console.log(inStockAliExpress);

    //Update Database code here

    // In stock status for Amazon
    await page.goto(urlAmazon);
    const inStockAmazon = await page.evaluate(() => {
      const inStock = document.querySelector("#availability span");
      const inStockQuantity =
        inStock &&
        inStock.innerHTML &&
        inStock.innerHTML.replace(/(\r\n|\n|\r)/gm, "") == "En stock." // This will work for spanish version only.
          ? true
          : false;
      return inStockQuantity;
    });
    console.log(inStockAmazon);

    //Update Database code here
  } catch (error) {
    console.log(error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
});
