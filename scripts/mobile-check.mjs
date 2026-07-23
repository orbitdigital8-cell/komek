// Проверка мобильной адаптации: эмуляция iPhone, поиск элементов шире экрана
import puppeteer from "puppeteer-core";

const OUT = "C:/Users/Sherlock/AppData/Local/Temp/claude/c--Users-Sherlock-Desktop-podbor/06026a47-b29a-48b5-ac82-bbb8e259c01d/scratchpad";
const pages = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: "new",
});

for (const [i, url] of pages.entries()) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
  page.on("console", (m) => { if (m.type() === "error") console.log("  CONSOLE:", m.text().slice(0, 300)); });
  page.on("pageerror", (e) => console.log("  PAGEERROR:", String(e).slice(0, 300)));
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1500));

  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 || r.right > vw + 1) {
        // пропускаем родителей, у которых виноват потомок той же ширины
        bad.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === "string") ? el.className.slice(0, 40) : "",
          w: Math.round(r.width),
          right: Math.round(r.right),
          text: (el.textContent || "").trim().slice(0, 40),
        });
      }
    }
    return { vw, docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, bad: bad.slice(0, 15) };
  });
  const name = `mc-${i}`;
  console.log(`=== ${url}\nviewport=${report.vw} docScrollW=${report.docW} bodyScrollW=${report.bodyW}`);
  for (const b of report.bad) console.log(`  <${b.tag}> class="${b.cls}" w=${b.w} right=${b.right} | ${b.text}`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: process.env.FULL === "1" });
  await page.close();
}
await browser.close();
console.log("done");
